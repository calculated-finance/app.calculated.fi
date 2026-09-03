import { getChainConfig } from '@helpers/chains';
import { useFormStore } from '@hooks/useFormStore';
import { ChainId } from '@models/ChainId';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHAINS } from 'src/constants';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ChainState = {
  chainId: ChainId;
  setChain: (chain: ChainId) => void;
};

export const useChainStore = create<ChainState>()(
  persist(
    (set) => ({
      chainId: 'osmosis-1',
      setChain: (chainId: ChainId) => set({ chainId }),
    }),
    {
      name: 'chain',
    },
  ),
);

function getChainNameFromRouterQuery(query: ParsedUrlQuery) {
  const { chain } = query;

  if (!chain) {
    return {};
  }

  if (CHAINS.includes(chain as ChainId)) {
    return { chain: chain as ChainId };
  }

  const filteredChainName = CHAINS.find((c) => (chain as string).startsWith(c as string));

  if (filteredChainName) {
    return { chain: filteredChainName, wasFiltered: true };
  }

  return {};
}

export const useChainId = () => {
  const router = useRouter();
  const { chain, wasFiltered } = useMemo(() => getChainNameFromRouterQuery(router.query), [router.query]);
  const storedChain = useChainStore((state) => state.chainId);
  const setStoredChain = useChainStore((state) => state.setChain);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ChainState>({} as ChainState);

  const updateQueryParam = useCallback(
    (newChain: ChainId) => {
      router.replace({
        pathname: router.pathname,
        query: { ...router.query, chain: newChain },
      });
    },
    [router],
  );

  const updateStores = useCallback(
    (newChain: ChainId) => {
      useFormStore.setState({ forms: {} });
      setStoredChain(newChain);
    },
    [setStoredChain],
  );

  const setChain = useCallback(
    (newChain: ChainId) => {
      if (newChain === chain) return;
      useFormStore.setState({ forms: {} });
      updateStores(newChain);
      updateQueryParam(newChain);
    },
    [updateQueryParam, updateStores, chain],
  );

  useEffect(() => {
    if (router.isReady) {
      if (chain) {
        if (storedChain !== chain) {
          updateStores(chain);
        }
        if (wasFiltered) {
          updateQueryParam(chain);
        }
        setData({ chainId: chain as ChainId, setChain });
      } else if (storedChain) {
        const supportedStoredChain = CHAINS.includes(storedChain) ? storedChain : ('osmosis-1' as ChainId);
        if (supportedStoredChain !== storedChain) {
          updateStores(supportedStoredChain);
        }
        updateQueryParam(supportedStoredChain);
        setData({ chainId: supportedStoredChain, setChain });
      }
      setIsLoading(false);
    }
  }, [router.isReady, setChain, chain, updateQueryParam, storedChain, updateStores, wasFiltered]);

  const chainConfig = useMemo(() => getChainConfig(data.chainId)!, [data.chainId]);

  return { ...(data as ChainState), chainConfig, isLoading };
};
