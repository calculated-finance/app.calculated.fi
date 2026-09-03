import { useQuery } from '@tanstack/react-query';
import { InitialDenomInfo } from '@utils/DenomInfo';
import { KeyValuePair, all, filter, indexBy, isNil, map, mergeAll, reduce, toLower, values, zip } from 'rambda';
import { CHAINS, MAINNET_CHAINS } from 'src/constants';
import { ChainId } from '@models/ChainId';
import { useChainClient } from '@hooks/useChainClient';
import { useChainId } from '@hooks/useChainId';
import { ChainClient } from './useChainClient/helpers';

const useDenoms = (injectedChainIds?: ChainId[]) => {
  const { chainId } = useChainId();
  const chainIds = injectedChainIds ?? (process.env.NEXT_PUBLIC_APP_ENV === 'production' ? MAINNET_CHAINS : CHAINS);
  const chainClients = chainIds.map(useChainClient);

  const { data: denoms, ...helpers } = useQuery<{ [x: string]: { [x: string]: InitialDenomInfo } }>(
    ['denoms', chainIds],
    async () =>
      reduce(
        (
          acc: { [chainId: string]: { [id: string]: InitialDenomInfo } },
          [resolvedChainId, denomsById]: KeyValuePair<ChainId, { [id: string]: InitialDenomInfo }>,
        ) => ({ ...acc, [resolvedChainId]: denomsById }),
        {} as { [chainId: string]: { [id: string]: InitialDenomInfo } },
        zip(
          chainIds,
          map(
            (r: any) => r.value,
            filter(
              (r) => r.status === 'fulfilled',
              await Promise.allSettled(map((client: ChainClient | undefined) => client!.fetchDenoms(), chainClients)),
            ),
          ) as any[],
        ),
      ),
    {
      enabled: all((c) => !isNil(c), chainClients),
      staleTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  );

  const allDenoms = (denoms ? denoms && mergeAll(values(denoms)) : {}) as { [x: string]: InitialDenomInfo };

  return {
    denoms,
    allDenoms,
    getDenomById: (id: string): InitialDenomInfo | undefined => allDenoms[id],
    getDenomByName: (name: string, injectedChainId?: ChainId): InitialDenomInfo | undefined =>
      indexBy(
        (d) => toLower(d.name),
        values(denoms?.[injectedChainId ?? chainId] ?? ({} as { [id: string]: InitialDenomInfo })),
      )?.[toLower(name)] as InitialDenomInfo,
    ...helpers,
  };
};

export default useDenoms;
