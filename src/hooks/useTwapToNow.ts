import { findPair } from '@helpers/findPair';
import { useCosmWasmClient } from '@hooks/useCosmWasmClient';
import { InitialDenomInfo, ResultingDenomInfo } from '@utils/DenomInfo';
import { useConfig } from '@hooks/useConfig';
import usePairs from '@hooks/usePairs';
import { useQuery } from '@tanstack/react-query';

export default function useTwapToNow(
  initialDenom: InitialDenomInfo | undefined,
  resultingDenom: ResultingDenomInfo | undefined,
  route: string | null | undefined,
  enabled = true,
) {
  const config = useConfig();
  const { cosmWasmClient } = useCosmWasmClient();
  const { pairs } = usePairs(undefined, initialDenom?.id);

  const pair = pairs && resultingDenom && initialDenom ? findPair(pairs, resultingDenom, initialDenom) : null;

  const { data: twap, ...helpers } = useQuery<number>(
    ['prices', 'twap', initialDenom?.id, resultingDenom?.id, route],
    async () => {
      const twapToNow = await cosmWasmClient!.queryContractSmart(config!.exchange_contract_address, {
        get_twap_to_now: {
          swap_denom: initialDenom!.id,
          target_denom: resultingDenom!.id,
          period: config!.twap_period,
          route,
        },
      });

      return Number(twapToNow) * 10 ** (resultingDenom!.significantFigures - initialDenom!.significantFigures);
    },
    {
      enabled: !!cosmWasmClient && !!pair && !!config && enabled,
      staleTime: 15000,
      retry: false,
      meta: {
        errorMessage: 'Error fetching twap price',
      },
    },
  );

  return {
    twap,
    ...helpers,
  };
}
