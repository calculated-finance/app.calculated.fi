import { filter } from 'rambda';
import { isDenomVolatile } from '@utils/getDenomInfo';
import { HydratedPair, Pair } from '@models/Pair';
import { getDCAContractAddress } from '@helpers/chains';
import { InitialDenomInfo, ResultingDenomInfo } from '@utils/DenomInfo';
import { getBaseDenom, getQuoteDenom } from '@utils/pair';
import { ChainId } from '@models/ChainId';
import { useChainId } from '@hooks/useChainId';
import { useCosmWasmClient } from '@hooks/useCosmWasmClient';
import useDenoms from '@hooks/useDenoms';
import { useChainClient } from '@hooks/useChainClient';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const hiddenPairs = [
  JSON.stringify([
    'ibc/D36D2BBE441D3605EEF340EAFAC57D669880597073050A2650B1468F1634A5F5',
    'factory/kujira1qk00h5atutpsv900x202pxx42npjr9thg58dnqpa72f2p7m2luase444a7/uusk',
  ]),
  JSON.stringify([
    'ibc/F33B313325B1C99B646B1B786F1EA621E3794D787B90C204C30FE1D4D45970AE',
    'factory/kujira1qk00h5atutpsv900x202pxx42npjr9thg58dnqpa72f2p7m2luase444a7/uusk',
  ]),
];

function isPairVisible(denoms: string[]) {
  return !hiddenPairs.includes(JSON.stringify(denoms));
}

export function isSupportedDenomForDcaPlus(denom: InitialDenomInfo) {
  return denom.enabledInDcaPlus && isDenomVolatile(denom);
}

export function orderAlphabetically(denoms: InitialDenomInfo[]) {
  return denoms.sort((a, b) => {
    const { name: nameA } = a;
    const { name: nameB } = b;
    return nameA.localeCompare(nameB);
  });
}

export function uniqueQuoteDenoms(pairs: HydratedPair[] | undefined) {
  return Array.from(new Set(pairs?.map(getQuoteDenom)));
}

export function uniqueBaseDenoms(pairs: HydratedPair[] | undefined) {
  return Array.from(new Set(pairs?.map(getBaseDenom)));
}

export function uniqueBaseDenomsFromQuoteDenom(initialDenom: InitialDenomInfo, pairs: HydratedPair[] | undefined) {
  return Array.from(
    new Set(filter((pair: HydratedPair) => getQuoteDenom(pair).id === initialDenom.id, pairs ?? []).map(getBaseDenom)),
  );
}

export function uniqueQuoteDenomsFromBaseDenom(resultingDenom: ResultingDenomInfo, pairs: HydratedPair[] | undefined) {
  return Array.from(
    new Set(
      filter((pair: HydratedPair) => getBaseDenom(pair).id === resultingDenom.id, pairs ?? []).map(getQuoteDenom),
    ),
  );
}

export function allDenomsFromPairs(pairs: HydratedPair[] | undefined) {
  return Array.from(new Set(pairs?.map((pair) => getQuoteDenom(pair)).concat(pairs?.map(getBaseDenom))));
}

export function getResultingDenoms(pairs: HydratedPair[], initialDenom?: InitialDenomInfo) {
  return !initialDenom
    ? []
    : orderAlphabetically(
        Array.from(
          new Set([
            ...uniqueQuoteDenomsFromBaseDenom(initialDenom, pairs),
            ...uniqueBaseDenomsFromQuoteDenom(initialDenom, pairs),
          ]),
        ),
      );
}

export default function usePairs(injectedChainId?: ChainId, initialDenomId?: string) {
  const { chainId: currentChainId } = useChainId();
  const chainId = injectedChainId ?? currentChainId;
  const { cosmWasmClient } = useCosmWasmClient(chainId);
  const { denoms } = useDenoms([chainId]);
  const chainClient = useChainClient(chainId);
  const supportsLazyPairs = !!chainClient?.fetchPairsForDenom;

  const { data: pairs, ...other } = useQuery<Pair[]>(
    ['pairs', chainId, supportsLazyPairs ? initialDenomId : 'all'],
    () =>
      supportsLazyPairs
        ? initialDenomId
          ? chainClient!.fetchPairsForDenom!(initialDenomId)
          : Promise.resolve([])
        : chainClient!.fetchPairs(chainId, getDCAContractAddress(chainId), cosmWasmClient!),
    {
      enabled: !!chainId && !!cosmWasmClient && !!chainClient,
      staleTime: 1000 * 60 * 30,
      meta: {
        errorMessage: 'Error fetching pairs',
      },
    },
  );

  const hydratedPairs = useMemo(() => {
    const denomsById = denoms?.[chainId];
    if (!denomsById || !pairs) return undefined;

    return pairs
      .filter((pair) => isPairVisible(pair.denoms) && pair.denoms.every((denomId) => !!denomsById[denomId]))
      .map(
        (pair) =>
          ({
            denoms: pair.denoms.map((denomId) => denomsById[denomId]),
          } as HydratedPair),
      );
  }, [chainId, denoms, pairs]);

  return {
    pairs: hydratedPairs,
    ...other,
  };
}
