import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { ChainId } from '@models/ChainId';
import { InitialDenomInfo, ResultingDenomInfo } from '@utils/DenomInfo';
import { Pair } from '@models/Pair';
import { map, values } from 'rambda';
import { Coin } from '@models/index';
import { Validator } from 'cosmjs-types/cosmos/staking/v1beta1/staking';
import Long from 'long';
import { getPairsFetchLimit } from '@helpers/chains';

export type RouteResult = {
  route: string | undefined;
  feeRate: number;
  routeError: string | undefined;
};

export type ChainClient = {
  fetchDenoms: () => Promise<{ [x: string]: InitialDenomInfo }>;
  fetchPairs: (
    chainId: ChainId,
    contractAddress: string,
    client: CosmWasmClient,
    startAfter?: string,
    allPairs?: Pair[],
  ) => Promise<Pair[]>;
  fetchPairsForDenom?: (initialDenomId: string) => Promise<Pair[]>;
  fetchTokenBalance: (address: string, tokenId: InitialDenomInfo) => Promise<Coin>;
  fetchBalances: (address: string) => Promise<Coin[]>;
  fetchValidators: () => Promise<{ validators: Validator[] }>;
  fetchRoute: (
    initialDenom: InitialDenomInfo,
    targetDenom: ResultingDenomInfo,
    swapAmount: bigint,
  ) => Promise<RouteResult>;
};

export const fetchAllPairsFromSwapper = async (
  chainId: ChainId,
  contractAddress: string,
  client: CosmWasmClient,
  startAfter?: string,
  allPairs = [] as Pair[],
): Promise<Pair[]> => {
  try {
    const { pairs } = await client!.queryContractSmart(contractAddress, {
      get_pairs: {
        limit: getPairsFetchLimit(chainId),
        start_after: startAfter,
      },
    });

    allPairs.push(...pairs);

    if (pairs.length === getPairsFetchLimit(chainId)) {
      const newStartAfter = pairs[pairs.length - 1];
      return await fetchAllPairsFromSwapper(chainId, contractAddress, client, newStartAfter, allPairs);
    }

    return allPairs;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchBalances = async (
  queryClient: any,
  cosmWasmClient: CosmWasmClient,
  address: string,
  denoms: { [x: string]: InitialDenomInfo },
) => {
  try {
    const { balances: nativeBalances } = await queryClient.cosmos.bank.v1beta1.allBalances({
      address,
      pagination: {
        key: Buffer.from(''),
        offset: Long.fromInt(0),
        limit: Long.fromInt(1000),
        countTotal: false,
        reverse: false,
      },
    });

    const cw20Balances = (
      await Promise.all(
        map(
          async (denom) => {
            try {
              const { balance } = await cosmWasmClient.queryContractSmart(denom.id, { balance: { address } });
              return { denom: denom.id, amount: balance };
            } catch (error) {
              console.error(error);
              return { denom: denom.id, amount: 0 };
            }
          },
          values(denoms).filter((denom) => denom.isCw20),
        ),
      )
    ).filter((balance) => BigInt(balance.amount) > 0);

    return [...nativeBalances, ...cw20Balances];
  } catch (error) {
    return [];
  }
};

export const fetchBalance = async (
  _queryClient: any,
  cosmWasmClient: CosmWasmClient,
  address: string,
  denom: InitialDenomInfo,
) => {
  try {
    if (denom.isCw20) {
      const { balance } = await cosmWasmClient.queryContractSmart(denom.id, { balance: { address } });
      return { denom: denom.id, amount: balance };
    }

    return await cosmWasmClient.getBalance(address, denom.id);
  } catch (error) {
    return { denom: denom.id, amount: 0 };
  }
};
