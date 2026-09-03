import { Heading, Text, HStack, Flex, Stack, Icon, Box } from '@chakra-ui/react';
import { Strategy } from '@models/Strategy';
import DenomIcon from '@components/DenomIcon';
import Lottie from 'lottie-react';
import arrow from 'src/animations/arrow.json';
import {
  isStrategyOperating,
  isBuyStrategy,
  getTargetPrice,
  getNextTargetTime,
  getPriceThreshold,
} from '@helpers/strategy';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import usePairs from '@hooks/usePairs';
import { InitialDenomInfo, ResultingDenomInfo } from '@utils/DenomInfo';
import { priceFromRatio } from '@utils/getDenomInfo';
import useTwapToNow from '@hooks/useTwapToNow';
import useRoute from '@hooks/useRoute';
import { coin } from '@cosmjs/stargate';

function Diagram({
  initialDenom,
  resultingDenom,
}: {
  initialDenom: InitialDenomInfo;
  resultingDenom: ResultingDenomInfo;
}) {
  const { name: initialDenomName } = initialDenom;
  const { name: resultingDenomName } = resultingDenom;

  return (
    <Flex justify="space-between" gap={2} align="center" w="full">
      <HStack>
        <DenomIcon size={5} denomInfo={initialDenom} />
        <Text>{initialDenomName}</Text>
      </HStack>
      <Flex display={{ base: 'none', lg: 'initial' }} flexShrink={1}>
        <Box as={Lottie} animationData={arrow} loop w={{ base: 16, lg: 120, xl: 'initial' }} />
      </Flex>
      <Icon as={ArrowForwardIcon} display={{ lg: 'none' }} />
      <HStack>
        <DenomIcon size={5} denomInfo={resultingDenom} />
        <Text>{resultingDenomName}</Text>
      </HStack>
    </Flex>
  );
}

export function NextSwapInfo({ strategy }: { strategy: Strategy }) {
  const { route } = useRoute(coin(strategy.rawData.swap_amount, strategy.initialDenom.id), strategy.resultingDenom);
  const { twap } = useTwapToNow(strategy.initialDenom, strategy.resultingDenom, route || strategy.rawData.route);
  const { pairs } = usePairs(undefined, strategy.initialDenom.id);
  const priceThreshold = getPriceThreshold(strategy);

  const { trigger } = strategy.rawData;
  const { initialDenom, resultingDenom } = strategy;

  const isBeyondThreshold =
    !!twap && !!priceThreshold
      ? isBuyStrategy(strategy)
        ? priceThreshold <= twap
        : priceThreshold >= 1 / twap
      : false;

  let nextSwapInfo;

  if (trigger) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { time } = trigger || {};
    const targetTime = time?.target_time;

    const targetPrice = getTargetPrice(strategy, pairs);

    if (isStrategyOperating(strategy)) {
      if (isBeyondThreshold) {
        if (isBuyStrategy(strategy)) {
          nextSwapInfo = (
            <>
              When price hits 1 {resultingDenom.name} &le; {priceThreshold} {initialDenom.name}
            </>
          );
        } else {
          nextSwapInfo = (
            <>
              When price hits 1 {initialDenom.name} &ge; {priceThreshold} {resultingDenom.name}
            </>
          );
        }
      } else if (targetTime) {
        const nextSwap = getNextTargetTime(strategy);
        const nextSwapDate = nextSwap.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        const nextSwapTime = nextSwap.toLocaleTimeString('en-US', {
          minute: 'numeric',
          hour: 'numeric',
        });
        nextSwapInfo = (
          <>
            {nextSwapDate} at {nextSwapTime}
          </>
        );
      } else if (targetPrice) {
        const denom = isBuyStrategy(strategy) ? resultingDenom : initialDenom;

        const convertedPrice = Number(priceFromRatio(denom, targetPrice).toFixed(denom.pricePrecision));

        if (isBuyStrategy(strategy)) {
          nextSwapInfo = (
            <>
              When price hits 1 {resultingDenom.name} &le; {convertedPrice} {initialDenom.name}
            </>
          );
        } else {
          nextSwapInfo = (
            <>
              When price hits 1 {initialDenom.name} &ge; {convertedPrice} {resultingDenom.name}
            </>
          );
        }
      }
    }
  }

  return nextSwapInfo ? (
    <Stack mb={8} py={4} px={8} layerStyle="panel" direction={{ base: 'column', sm: 'row' }} spacing={4}>
      <HStack spacing={4} w={{ sm: '50%' }}>
        <Heading size="xs" whiteSpace={{ base: 'nowrap', sm: 'normal' }}>
          Next swap:
        </Heading>
        <Text whiteSpace={{ base: 'nowrap', sm: 'normal' }} fontSize="sm" data-testid="next-swap-info">
          {nextSwapInfo}
        </Text>
      </HStack>
      <Flex w={{ sm: '50%' }}>
        <Diagram initialDenom={initialDenom} resultingDenom={resultingDenom} />
      </Flex>
    </Stack>
  ) : null;
}
