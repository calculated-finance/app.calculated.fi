import { Coin } from '@cosmjs/proto-signing';
import { ResultingDenomInfo } from '@utils/DenomInfo';
import { useQuery } from '@tanstack/react-query';
import { useChainId } from '@hooks/useChainId';
import { useChainClient } from '@hooks/useChainClient';
import useDenoms from '@hooks/useDenoms';
import { RouteResult } from './useChainClient/helpers';

const useRoute = (swapAmount?: Coin, targetDenom?: ResultingDenomInfo) => {
  const { chainId } = useChainId();
  const chainClient = useChainClient(chainId);
  const { getDenomById } = useDenoms([chainId]);

  const result = useQuery<RouteResult>(
    ['prices', 'route', chainId, swapAmount?.denom, swapAmount?.amount, targetDenom?.id],
    () => chainClient!.fetchRoute(getDenomById(swapAmount!.denom)!, targetDenom!, BigInt(swapAmount!.amount)),
    {
      enabled: !!chainId && !!chainClient && !!swapAmount && !!getDenomById(swapAmount!.denom) && !!targetDenom?.name,
      staleTime: 1000 * 60,
      retry: false,
      meta: {
        errorMessage: 'Error fetching route',
      },
    },
  );

  return {
    ...result,
    ...result.data,
  };
};

export default useRoute;
