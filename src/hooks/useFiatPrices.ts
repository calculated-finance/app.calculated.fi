import 'isomorphic-fetch';
import { COINGECKO_API_KEY, COINGECKO_ENDPOINT } from 'src/constants';
import { uniq, values } from 'rambda';
import useDenoms from '@hooks/useDenoms';
import { useQuery } from '@tanstack/react-query';
import { ChainId } from '@models/ChainId';

export type FiatPriceResponse = {
  [key: string]: {
    [key: string]: number;
  };
};

const FIAT_CURRENCY_ID = 'usd';

const MAX_COINGECKO_IDS_PER_REQUEST = 200;

const useFiatPrices = (chainIds?: ChainId[], includedDenomIds?: string[]) => {
  const { allDenoms } = useDenoms(chainIds);
  const denomsList = values(allDenoms ?? {});
  const includedDenomIdSet = includedDenomIds ? new Set(includedDenomIds) : undefined;
  const coingeckoIds = uniq(
    denomsList
      .filter((denom) => (!includedDenomIdSet || includedDenomIdSet.has(denom.id)) && !!denom.coingeckoId)
      .map((denom) => denom.coingeckoId),
  ).sort();

  const { data: fiatPrices, ...other } = useQuery<FiatPriceResponse>(
    ['fiat-prices', coingeckoIds],
    async () => {
      const idChunks = Array.from(
        { length: Math.ceil(coingeckoIds.length / MAX_COINGECKO_IDS_PER_REQUEST) },
        (_, index) =>
          coingeckoIds.slice(index * MAX_COINGECKO_IDS_PER_REQUEST, (index + 1) * MAX_COINGECKO_IDS_PER_REQUEST),
      );
      const responses = await Promise.all(
        idChunks.map(async (ids) => {
          const url = `${COINGECKO_ENDPOINT}/simple/price?ids=${ids.join(
            ',',
          )}&vs_currencies=${FIAT_CURRENCY_ID}&include_24hr_change=true&x_cg_pro_api_key=${COINGECKO_API_KEY}`;
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error('Failed to fetch fiat prices');
          }

          return response.json() as Promise<FiatPriceResponse>;
        }),
      );

      return Object.assign({}, ...responses);
    },
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      enabled: coingeckoIds.length > 0,
      retry: false,
      meta: {
        errorMessage: 'Error fetching fiat prices',
      },
    },
  );

  return {
    fiatPrices,
    ...other,
  };
};

export default useFiatPrices;
