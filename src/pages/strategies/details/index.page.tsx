import 'isomorphic-fetch';
import {
  Heading,
  Grid,
  Text,
  HStack,
  IconButton,
  Icon,
  Center,
  Image,
  Alert,
  useDisclosure,
  Spacer,
  Button,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import CalcIcon from '@components/Icon';
import Spinner from '@components/Spinner';
import { CloseBoxedIcon } from '@fusion-icons/react/interface';
import useStrategy from '@hooks/useStrategy';
import { useRouter } from 'next/router';
import { FiArrowLeft } from 'react-icons/fi';
import { useWallet } from '@hooks/useWallet';
import useStrategyEvents from '@hooks/useStrategyEvents';
import { StrategyEvent } from '@models/StrategyEvent';
import ConnectWallet from '@components/ConnectWallet';
import {
  isChainRetired,
  PREVIOUS_SWAP_FAILED_DUE_TO_PRICE_THRESHOLD,
  PREVIOUS_SWAP_FAILED_DUE_TO_SLIPPAGE_ERROR_MESSAGE,
} from 'src/constants';
import { getStrategyName, getSwapAmount } from '@helpers/strategy';
import { getSidebarLayout } from '@components/Layout';
import { formatDate } from '@helpers/format/formatDate';
import { getStandardDcaEndDate, isEscrowPending } from '@helpers/strategy/dcaPlus';
import { isDcaPlus } from '@helpers/strategy/isDcaPlus';
import LinkWithQuery from '@components/LinkWithQuery';
import useFiatPrice from '@hooks/useFiatPrice';
import { find } from 'rambda';
import { fromAtomic } from '@utils/getDenomInfo';
import { getChainMinimumSwapValue, getChainName } from '@helpers/chains';
import { generateStrategyCustomiseUrl } from '@components/TopPanel/generateStrategyCustomise';
import StrategyPerformance from './StrategyPerformance';
import StrategyDetails from './StrategyDetails';
import StrategyComparison from './StrategyComparison';
import { NextSwapInfo } from './NextSwapInfo';
import { StrategyChart } from './StrategyChart';
import { StrategyComparisonChart } from './StrategyComparisonChart';

export function getLatestSwapError(events: StrategyEvent[] | undefined): string | undefined {
  const finalEvent = events && events.length > 0 && events[events.length - 1];

  return finalEvent && 'dca_vault_execution_skipped' in finalEvent.data
    ? (find(
        ([key, _]) => JSON.stringify(finalEvent.data).includes(key),
        [
          ['slippage_tolerance_exceeded', PREVIOUS_SWAP_FAILED_DUE_TO_SLIPPAGE_ERROR_MESSAGE],
          ['price_threshold_exceeded', PREVIOUS_SWAP_FAILED_DUE_TO_PRICE_THRESHOLD],
        ],
      ) ?? [
        'unknown_failure',
        `The previous swap failed due to an unknown reason. Please contact the CALC team at https://t.me/calcprotocol`,
      ])[1]
    : undefined;
}

function Page() {
  const router = useRouter();
  const { id } = router.query;

  const { data: strategy } = useStrategy(id as string);
  const { data: events } = useStrategyEvents(id as string);
  const { isOpen: isVisible, onClose } = useDisclosure({ defaultIsOpen: true });
  const { fiatPrice } = useFiatPrice(strategy?.initialDenom);

  const { connected } = useWallet();

  if (!connected) {
    return <ConnectWallet layerStyle="panel" />;
  }

  if (!strategy) {
    return (
      <Center h="100vh">
        <Spinner />
      </Center>
    );
  }

  const lastSwapSlippageError = getLatestSwapError(events);
  const expectedSwapValue = fiatPrice && fromAtomic(strategy.initialDenom, getSwapAmount(strategy)) * fiatPrice;
  const minimumSwapValue = getChainMinimumSwapValue(strategy.chainId);
  const chainIsRetired = isChainRetired(strategy.chainId);

  return (
    <>
      <HStack spacing={6} pb={6}>
        <LinkWithQuery href="/strategies">
          <IconButton aria-label="back" variant="outline">
            <Icon as={FiArrowLeft} stroke="brand.200" />
          </IconButton>
        </LinkWithQuery>
        <HStack spacing={8} alignItems="center">
          <Heading data-testid="details-heading">{getStrategyName(strategy)}</Heading>
        </HStack>
      </HStack>
      {isEscrowPending(strategy) && (
        <Alert status="warning" mb={8} borderWidth={1} borderColor="green.200">
          <Image mr={4} src="/images/lightBulbOutlineGreen.svg" />
          <Text fontSize="sm" mr={4}>
            Your strategy is now inactive and you will receive your escrow (minus performance fee) on{' '}
            {formatDate(getStandardDcaEndDate(strategy, events))}.
          </Text>
        </Alert>
      )}
      {Boolean(lastSwapSlippageError) && isVisible && (
        <Alert status="warning" mb={8} borderWidth={1} borderColor="yellow.200">
          <Image mr={4} src="/images/warningIcon.svg" />
          <Text fontSize="sm" mr={4}>
            {lastSwapSlippageError}
          </Text>
          <Spacer />
          <CalcIcon as={CloseBoxedIcon} stroke="white" onClick={onClose} />
        </Alert>
      )}
      {expectedSwapValue && expectedSwapValue < minimumSwapValue && (
        <Alert status="warning" mb={8} borderWidth={1} borderColor="yellow.200">
          <Image mr={4} src="/images/warningIcon.svg" />
          <Text fontSize="sm" mr={4}>
            {chainIsRetired
              ? `The swap amount is below the $${minimumSwapValue} USD minimum on ${getChainName(
                  strategy.chainId,
                )}. New activity is disabled on this chain. Cancel the strategy to recover its available balance.`
              : `In order to cover gas costs of swapping on ${getChainName(
                  strategy.chainId,
                )}, the swap amount of your strategy must be larger than $${minimumSwapValue} USD. Please consider updating the swap amount by editing your strategy.`}
          </Text>
          {!chainIsRetired && (
            <>
              <Spacer />
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
            </>
          )}
        </Alert>
      )}
      <NextSwapInfo strategy={strategy} />
      <Grid
        gap={6}
        mb={6}
        templateColumns="repeat(6, 1fr)"
        templateRows={isDcaPlus(strategy) ? '3fr' : '2fr'}
        alignItems="stretch"
      >
        {isDcaPlus(strategy) && <StrategyComparison strategy={strategy} />}
        <StrategyDetails strategy={strategy} />
        <StrategyPerformance strategy={strategy} />
        {isDcaPlus(strategy) && <StrategyComparisonChart strategy={strategy} />}
        <StrategyChart strategy={strategy} />
      </Grid>
    </>
  );
}

Page.getLayout = getSidebarLayout;

export default Page;
