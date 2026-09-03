import { Heading, Grid, GridItem, Box, Text, Divider, Badge, Flex, HStack, Code } from '@chakra-ui/react';
import { fromAtomic } from '@utils/getDenomInfo';
import { Strategy } from '@models/Strategy';
import {
  getStrategyInitialDenom,
  getStrategyResultingDenom,
  getStrategyType,
  getStrategyStartDate,
  isStrategyCancelled,
  getStrategyName,
  getSlippageToleranceFormatted,
  getPriceThreshold,
  getStrategyExecutionInterval,
  isBuyStrategy,
} from '@helpers/strategy';
import { StrategyStatusBadge } from '@components/StrategyStatusBadge';
import { SwapEachCycle } from 'src/pages/strategies/details/StrategyDetails';
import { isWeightedScale } from '@helpers/strategy/isWeightedScale';
import usePairs from '@hooks/usePairs';
import { DestinationDetails } from 'src/pages/strategies/details/DestinationDetails';
import { useChainId } from '@hooks/useChainId';

export function ReinvestStrategyDetails({ strategy }: { strategy: Strategy }) {
  const { chainId } = useChainId();
  const { balance } = strategy.rawData;
  const initialDenom = getStrategyInitialDenom(strategy);
  const resultingDenom = getStrategyResultingDenom(strategy);

  const strategyType = getStrategyType(strategy);
  const { pairs } = usePairs(undefined, initialDenom.id);

  const startDate = getStrategyStartDate(strategy, pairs);

  return (
    <GridItem colSpan={[6, null, null, null, 3]}>
      <Box px={8} py={6} bg="abyss.200" p={4} fontSize="sm" borderRadius="xl" borderWidth={1} borderColor="slateGrey">
        <Grid templateColumns="repeat(3, 1fr)" gap={3} alignItems="center">
          <GridItem colSpan={1}>
            <Heading size="xs">Strategy status</Heading>
          </GridItem>
          <GridItem colSpan={1} data-testid="strategy-status">
            <StrategyStatusBadge strategy={strategy} />
          </GridItem>
          <GridItem colSpan={1} visibility={isStrategyCancelled(strategy) ? 'hidden' : 'visible'}>
            <Flex justifyContent="end" />
          </GridItem>
          <GridItem colSpan={1}>
            <Heading size="xs">Strategy name</Heading>
          </GridItem>
          <GridItem colSpan={2}>
            <Text fontSize="sm" data-testid="strategy-name">
              {getStrategyName(strategy)}
            </Text>
          </GridItem>
          <GridItem colSpan={1}>
            <Heading size="xs">Strategy id</Heading>
          </GridItem>
          <GridItem colSpan={2}>
            <Code bg="abyss.200" fontSize="small" whiteSpace="nowrap">
              {strategy.id}
            </Code>
          </GridItem>
          <GridItem colSpan={3}>
            <Divider />
          </GridItem>
          <GridItem colSpan={1}>
            <Heading size="xs">Strategy type</Heading>
          </GridItem>
          <GridItem colSpan={2}>
            <Text fontSize="sm" data-testid="strategy-type">
              {strategyType}
            </Text>
          </GridItem>
          <GridItem colSpan={1}>
            <Heading size="xs">Strategy start date</Heading>
          </GridItem>
          <GridItem colSpan={2}>
            <Text fontSize="sm" data-testid="strategy-start-date">
              {startDate}
            </Text>
          </GridItem>
          <GridItem colSpan={1}>
            <Heading size="xs">Investment cycle</Heading>
          </GridItem>
          <GridItem colSpan={2}>
            <Text fontSize="sm" data-testid="strategy-investment-cycle">
              {getStrategyExecutionInterval(strategy)}
            </Text>
          </GridItem>
          {!isWeightedScale(strategy) && <SwapEachCycle strategy={strategy} />}
          {Boolean(strategy.rawData.slippage_tolerance) && (
            <>
              <GridItem colSpan={1}>
                <Heading size="xs">Slippage tolerance</Heading>
              </GridItem>
              <GridItem colSpan={2}>
                <Text fontSize="sm" data-testid="strategy-slippage-tolerance">
                  {getSlippageToleranceFormatted(strategy)}
                </Text>
              </GridItem>
            </>
          )}
          {Boolean(strategy.rawData.minimum_receive_amount) && strategy.rawData.minimum_receive_amount && (
            <>
              <GridItem colSpan={1}>
                <Heading size="xs">{isBuyStrategy(strategy) ? 'Price ceiling' : 'Price floor'}</Heading>
              </GridItem>
              <GridItem colSpan={2}>
                <HStack>
                  <Text fontSize="sm" data-testid="strategy-minimum-receive-amount">
                    {getPriceThreshold(strategy)} {(isBuyStrategy(strategy) ? initialDenom : resultingDenom).name}
                  </Text>
                  <Badge colorScheme="green">Set</Badge>
                </HStack>
              </GridItem>
            </>
          )}
          <GridItem colSpan={1}>
            <Heading size="xs">Current amount in vault</Heading>
          </GridItem>
          <GridItem colSpan={2}>
            <Text fontSize="sm" data-testid="strategy-current-balance">
              {fromAtomic(initialDenom, Number(balance.amount))} {initialDenom.name}
            </Text>
          </GridItem>
          <DestinationDetails strategy={strategy} chainId={chainId} />
        </Grid>
      </Box>
    </GridItem>
  );
}
