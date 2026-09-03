import { EditIcon, PlusSquareIcon } from '@chakra-ui/icons';
import {
  Heading,
  Grid,
  GridItem,
  Box,
  Text,
  Divider,
  Badge,
  Flex,
  Button,
  HStack,
  Tooltip,
  Stack,
  Code,
} from '@chakra-ui/react';
import CalcIcon from '@components/Icon';
import { fromAtomic } from '@utils/getDenomInfo';
import { generateStrategyTopUpUrl } from '@components/TopPanel/generateStrategyTopUpUrl';
import { Strategy } from '@models/Strategy';
import useStrategyEvents from '@hooks/useStrategyEvents';
import { DELEGATION_FEE, isChainRetired, SWAP_FEE, SWAP_FEE_WS } from 'src/constants';
import { getPrettyFee } from '@helpers/getPrettyFee';
import {
  getStrategyType,
  getStrategyStartDate,
  isStrategyCancelled,
  getStrategyName,
  getStrategyEndDate,
  getSlippageToleranceFormatted,
  getPriceThreshold,
  getSwapAmount,
  isStrategyAutoStaking,
  isStrategyOperating,
  isBuyStrategy,
  getStrategyExecutionInterval,
  getBasePrice,
  getStrategyPriceTrigger,
} from '@helpers/strategy';
import { StrategyStatusBadge } from '@components/StrategyStatusBadge';
import { getEscrowAmount, getStrategyEndDateRange, getStrategySwapRange } from '@helpers/strategy/dcaPlus';
import { useChainId } from '@hooks/useChainId';
import useDexFee from '@hooks/useDexFee';
import usePairs from '@hooks/usePairs';
import { TransactionType } from '@components/TransactionType';
import { isDcaPlus } from '@helpers/strategy/isDcaPlus';
import { isNil } from 'lodash';
import { getWeightedScaleConfig, isWeightedScale } from '@helpers/strategy/isWeightedScale';
import { WeightSummary } from '@components/WeightSummary';
import YesNoValues from '@models/YesNoValues';
import { generateStrategyCustomiseUrl } from '@components/TopPanel/generateStrategyCustomise';
import LinkWithQuery from '@components/LinkWithQuery';
import { getChainDexName } from '@helpers/chains';
import { CancelButton } from './CancelButton';
import { DestinationDetails } from './DestinationDetails';

function Escrowed({ strategy }: { strategy: Strategy }) {
  return (
    <>
      <GridItem colSpan={1}>
        <Heading size="xs">
          {' '}
          <Tooltip
            label={
              <Text>
                A maximum of 5% swap volume, this amount with be returned in full if DCA+ does not outperform
                traditional DCA at the end of the strategy.
              </Text>
            }
          >
            Escrowed*
          </Tooltip>
        </Heading>
      </GridItem>
      <GridItem colSpan={2}>
        <Text fontSize="sm" data-testid="strategy-escrow-amount">
          {getEscrowAmount(strategy)} {strategy.resultingDenom.name}
        </Text>
      </GridItem>
    </>
  );
}

export function SwapEachCycle({ strategy }: { strategy: Strategy }) {
  const { min, max } = getStrategySwapRange(strategy) || {};
  const { chainId } = useChainId();
  const { dexFee } = useDexFee();

  return (
    <>
      <GridItem colSpan={1}>
        <Heading size="xs">Swap each cycle </Heading>
      </GridItem>
      <GridItem colSpan={2}>
        <Text fontSize="sm" data-testid="strategy-swap-amount">
          {!isNil(min) && !isNil(max) ? (
            <>
              Between{' '}
              {fromAtomic(strategy.initialDenom, min).toLocaleString('en-US', {
                maximumSignificantDigits: strategy.initialDenom.significantFigures,
              })}{' '}
              and{' '}
              {fromAtomic(strategy.initialDenom, max).toLocaleString('en-US', {
                maximumSignificantDigits: strategy.initialDenom.significantFigures,
              })}{' '}
              {strategy.initialDenom.name}
            </>
          ) : (
            <>
              {fromAtomic(strategy.initialDenom, getSwapAmount(strategy))} {strategy.initialDenom.name}
            </>
          )}{' '}
          -{' '}
          <Tooltip
            label={
              <Box>
                <Text>Fees automatically deducted from each swap:</Text>
                {!isDcaPlus(strategy) && !isWeightedScale(strategy) ? (
                  <Text>Sustainability fee: {getPrettyFee(100, SWAP_FEE)}%</Text>
                ) : (
                  isWeightedScale(strategy) && <Text>CALC sustainability fee: {getPrettyFee(100, SWAP_FEE_WS)}%</Text>
                )}
                <Text>
                  {`${getChainDexName(chainId)} swap fee`}: {getPrettyFee(100, dexFee)}%
                </Text>
                {isStrategyAutoStaking(strategy) && <Text>Automation fee: {getPrettyFee(100, DELEGATION_FEE)}%</Text>}
              </Box>
            }
          >
            fees*
          </Tooltip>
        </Text>
      </GridItem>
    </>
  );
}

export default function StrategyDetails({ strategy }: { strategy: Strategy }) {
  const { chainId } = useChainId();
  const { balance, destinations } = strategy.rawData;
  const { initialDenom, resultingDenom } = strategy;

  const strategyType = getStrategyType(strategy);
  const { pairs } = usePairs(undefined, initialDenom.id);
  const startDate = getStrategyStartDate(strategy, pairs);
  const { data: events } = useStrategyEvents(strategy.id);
  const showEditButton = !isStrategyCancelled(strategy) && !isChainRetired(strategy.chainId);

  return (
    <GridItem colSpan={[6, null, null, null, 3]}>
      <Stack spacing={6}>
        <Box>
          <HStack align="center" pb={4}>
            <Heading size="md">Strategy details</Heading>
            {showEditButton && (
              <LinkWithQuery href={generateStrategyCustomiseUrl(strategy.id, strategy.chainId)}>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="brand"
                  leftIcon={<CalcIcon as={EditIcon} stroke="brand.200" width={4} height={4} />}
                >
                  Edit
                </Button>
              </LinkWithQuery>
            )}
          </HStack>
          <Box px={8} py={6} layerStyle="panel">
            <Grid templateColumns="repeat(3, 1fr)" gap={3} alignItems="center">
              <GridItem colSpan={1}>
                <Heading size="xs">Strategy status</Heading>
              </GridItem>
              <GridItem colSpan={1} data-testid="strategy-status">
                <StrategyStatusBadge strategy={strategy} />
              </GridItem>
              <GridItem colSpan={1} visibility={isStrategyCancelled(strategy) ? 'hidden' : 'visible'}>
                <Flex justifyContent="end">
                  <CancelButton strategy={strategy} />
                </Flex>
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
                <Heading size="xs">Estimated strategy end date</Heading>
              </GridItem>
              <GridItem colSpan={2}>
                <Text fontSize="sm" data-testid="estimated-strategy-end-date">
                  {(isDcaPlus(strategy) || isWeightedScale(strategy)) &&
                  isStrategyOperating(strategy) &&
                  !getStrategyPriceTrigger(strategy) ? (
                    <>
                      Between {getStrategyEndDateRange(strategy, events).min} and{' '}
                      {getStrategyEndDateRange(strategy, events).max}
                    </>
                  ) : (
                    getStrategyEndDate(strategy, events)
                  )}
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
              {isDcaPlus(strategy) && <Escrowed strategy={strategy} />}
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
              <GridItem colSpan={1}>
                <Text fontSize="sm" data-testid="strategy-current-balance">
                  {fromAtomic(initialDenom, Number(balance.amount))} {initialDenom.name}
                </Text>
              </GridItem>
              <GridItem>
                {showEditButton && (
                  <Flex justify="end">
                    <LinkWithQuery href={generateStrategyTopUpUrl(strategy.id, strategy.chainId)}>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="brand"
                        leftIcon={<CalcIcon as={PlusSquareIcon} stroke="brand.200" width={4} height={4} />}
                      >
                        Add more funds
                      </Button>
                    </LinkWithQuery>
                  </Flex>
                )}
              </GridItem>
              {Boolean(destinations.length) && <DestinationDetails strategy={strategy} chainId={chainId} />}
            </Grid>
          </Box>
        </Box>
        {isWeightedScale(strategy) && (
          <Box>
            <Heading pb={4} size="md">
              Swap multiplier
            </Heading>
            <Box px={3} py={2} layerStyle="panel">
              <WeightSummary
                swapAmount={getSwapAmount(strategy)}
                swapMultiplier={Number(getWeightedScaleConfig(strategy)?.multiplier)}
                transactionType={isBuyStrategy(strategy) ? TransactionType.Buy : TransactionType.Sell}
                applyMultiplier={getWeightedScaleConfig(strategy)?.increase_only ? YesNoValues.No : YesNoValues.Yes}
                basePrice={getBasePrice(strategy)}
                initialDenom={strategy.initialDenom}
                resultingDenom={strategy.resultingDenom}
                route={strategy.rawData.route}
                priceThresholdValue={getPriceThreshold(strategy)}
              />
            </Box>
          </Box>
        )}
      </Stack>
    </GridItem>
  );
}
