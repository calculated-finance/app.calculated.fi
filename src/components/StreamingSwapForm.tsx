import {
  Box,
  Button,
  Center,
  Collapse,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalProps,
  SimpleGrid,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spacer,
  Spinner,
  Stack,
  Switch,
  Text,
  Tooltip,
  useDisclosure,
  useMediaQuery,
} from '@chakra-ui/react';
import { FormData, initialValues, schema } from 'src/models/StreamingSwapFormData';
import usePairs, { getResultingDenoms, orderAlphabetically } from '@hooks/usePairs';
import { Formik, FormikHelpers, useField, useFormikContext } from 'formik';
import useValidation from '@hooks/useValidation';
import useBalances from '@hooks/useBalances';
import { AgreementForm, SummaryAgreementForm } from '@components/Summary/SummaryAgreementForm';
import { useEffect, useState } from 'react';
import { DenomSelect } from '@components/DenomSelect';
import { AvailableFunds } from '@components/AvailableFunds';
import { getTimeSaved } from '@helpers/getTimeSaved';
import { useWallet } from '@hooks/useWallet';
import NumberInput from '@components/NumberInput';
import useFiatPrice from '@hooks/useFiatPrice';
import useExpectedReceiveAmount from '@hooks/useExpectedReceiveAmount';
import { coin } from '@cosmjs/proto-signing';
import useExpectedPrice from '@hooks/useExpectedPrice';
import streamingSwapSteps from '@formConfig/streamingSwap';
import { Icon, QuestionOutlineIcon } from '@chakra-ui/icons';
import { MdAccessTime } from 'react-icons/md';
import { FaAnglesUp, FaChevronDown, FaChevronUp, FaShieldHalved } from 'react-icons/fa6';
import useTwapToNow from '@hooks/useTwapToNow';
import { max, min, toLower, values } from 'rambda';
import { useCreateStreamingSwap } from '@hooks/useCreateVault/useCreateStreamingSwap';
import { useDebounce } from 'ahooks';
import { ConnectWalletButton } from '@components/ConnectWalletButton';
import { SWAP_FEE } from 'src/constants';
import useDexFee from '@hooks/useDexFee';
import { FeeBreakdown } from '@components/Fees';
import { Swap2Icon } from '@fusion-icons/react/web3';
import useDenoms from '@hooks/useDenoms';
import { fromAtomic, toAtomic } from '@utils/getDenomInfo';
import useQueryState from '@hooks/useQueryState';
import { useChainId } from '@hooks/useChainId';
import { NewStrategyModalBody } from '@components/NewStrategyModal';
import { SuccessStrategyModalBody } from '@components/SuccessStrategyModal';
import { BrowserRouter } from 'react-router-dom';
import useRoute from '@hooks/useRoute';
import InitialDeposit from '@components/InitialDeposit';
import { getChainMinimumSwapValue } from '@helpers/chains';

function InitialDenom() {
  const [isMobile] = useMediaQuery('(max-width: 506px)');
  const { denoms, getDenomById, getDenomByName } = useDenoms();
  const { chainId } = useChainId();

  const [{ from: initialDenomName, to: resultingDenomName, amount }, setQueryState] = useQueryState();

  const [initialDenom, initialDenomMeta, initialDenomHelpers] = useField({ name: 'initialDenom' });
  const [resultingDenom, , resultingDenomHelpers] = useField({ name: 'resultingDenom' });
  const [initialDeposit] = useField<number>({ name: 'initialDeposit' });
  const selectedInitialDenomId = initialDenom.value?.id ?? getDenomByName(initialDenomName)?.id;
  const { pairs } = usePairs(undefined, selectedInitialDenomId);

  const { fiatPrice } = useFiatPrice(initialDenom.value);

  useEffect(() => {
    const initialDenomAlreadySet = initialDenomName && getDenomByName(initialDenomName)?.id === initialDenom.value?.id;
    const resultingDenomAlreadySet =
      initialDenomAlreadySet &&
      resultingDenomName &&
      getDenomByName(resultingDenomName)?.id === resultingDenom.value?.id;

    const denomsAlreadySet = initialDenomAlreadySet && resultingDenomAlreadySet;

    if (!pairs || denomsAlreadySet) return;

    if (!initialDenomName && !initialDenom.value) return;

    const newInitialDenom = getDenomByName(initialDenomName);

    if (!initialDenomAlreadySet) {
      initialDenomHelpers.setValue(newInitialDenom);
      setQueryState({ from: newInitialDenom?.name });
    }

    if (!resultingDenomAlreadySet) {
      const validResultingDenoms = pairs && newInitialDenom ? getResultingDenoms(pairs, newInitialDenom) : [];
      const newResultingDenom =
        resultingDenomName && validResultingDenoms.find((d) => toLower(d.name) === toLower(resultingDenomName));

      setQueryState({ to: newResultingDenom?.name });
      resultingDenomHelpers.setValue(newResultingDenom);
    }
  }, [initialDenomName, pairs?.length]);

  return (
    <FormControl isInvalid={Boolean(initialDenomMeta.touched && initialDenomMeta.error)}>
      <FormLabel>Swap</FormLabel>
      <FormHelperText>
        <Center>
          <Text textStyle="body-xs">Choose asset to send</Text>
          <Spacer />
          {initialDenom.value && <AvailableFunds denom={initialDenom.value} />}
        </Center>
      </FormHelperText>
      <SimpleGrid columns={2} spacing={2}>
        <Box>
          <DenomSelect
            denoms={orderAlphabetically(values(denoms?.[chainId] ?? {}))}
            placeholder={isMobile ? 'Asset' : 'Choose asset'}
            defaultValue={initialDenom.value?.id}
            isDisabled={!pairs}
            value={initialDenom.value?.id}
            onChange={(v) => {
              const newInitialDenom = v ? getDenomById(v) : undefined;
              setQueryState({
                from: newInitialDenom?.name,
                amount:
                  amount &&
                  initialDenom &&
                  newInitialDenom &&
                  BigInt(
                    Math.round(
                      amount * 10 ** (newInitialDenom.significantFigures - initialDenom.value.significantFigures),
                    ),
                  ).toString(),
              });
            }}
          />
          <FormErrorMessage>{initialDenomMeta.touched && initialDenomMeta.error}</FormErrorMessage>
        </Box>
        <InitialDeposit />
      </SimpleGrid>
      <FormHelperText textAlign="end">
        <Stack align="end">
          <HStack spacing={1} align="end">
            <Text>USD Value:</Text>
            <Text color="white">
              $
              {(initialDeposit.value && fiatPrice && initialDenom.value
                ? Number((fromAtomic(initialDenom.value, initialDeposit.value) * fiatPrice)?.toFixed(2))
                : '0.00'
              ).toLocaleString()}
            </Text>
          </HStack>
        </Stack>
      </FormHelperText>
    </FormControl>
  );
}

function SwapDenoms() {
  const [{ value: initialDenomValue }] = useField({ name: 'initialDenom' });
  const [{ value: resultingDenomValue }] = useField({ name: 'resultingDenom' });

  const { getDenomById } = useDenoms();
  const [{ amount }, setQueryState] = useQueryState();

  return (
    <Center>
      <Image
        src="/images/arrow-down.svg"
        boxSize={8}
        onClick={
          initialDenomValue &&
          resultingDenomValue &&
          (() => {
            setQueryState({
              from: getDenomById(resultingDenomValue.id)?.name,
              to: getDenomById(initialDenomValue.id)?.name,
              ...(amount && resultingDenomValue && initialDenomValue
                ? {
                    amount: BigInt(
                      Math.round(
                        amount * 10 ** (resultingDenomValue.significantFigures - initialDenomValue.significantFigures),
                      ),
                    ).toString(),
                  }
                : {}),
            });
          })
        }
      />
    </Center>
  );
}

function ResultingDenom() {
  const [isMobile] = useMediaQuery('(max-width: 506px)');
  const { dexFee } = useDexFee();
  const { getDenomById, getDenomByName } = useDenoms();

  const [{ to: resultingDenomName }, setQueryState] = useQueryState();

  const {
    values: { initialDenom, initialDeposit, swapAmount },
  } = useFormikContext<FormData>();
  const { pairs } = usePairs(undefined, initialDenom?.id);

  const [{ value: resultingDenomValue, ...resultingDenomField }, resultingDenomMeta, resultingDenomHelpers] = useField({
    name: 'resultingDenom',
  });

  const [{ value: routeStateValue }, ,] = useField<{ route: string | undefined; isLoading: boolean } | undefined>({
    name: 'routeState',
  });

  useEffect(() => {
    if (!resultingDenomName) return;
    resultingDenomHelpers.setValue(getDenomByName(resultingDenomName));
  }, [resultingDenomName]);

  const debouncedInitialDeposit = useDebounce(initialDeposit, { wait: 500 });

  const { fiatPrice: initialDenomFiatPrice } = useFiatPrice(initialDenom);
  const { fiatPrice: resultingDenomFiatPrice } = useFiatPrice(resultingDenomValue);

  const { expectedReceiveAmount } = useExpectedReceiveAmount(
    swapAmount && initialDenom ? coin(BigInt(Math.round(swapAmount)).toString(), initialDenom.id) : undefined,
    resultingDenomValue,
    routeStateValue?.route,
    !!swapAmount && !!resultingDenomValue && !(routeStateValue?.isLoading || true),
  );

  const expectedTotalReceiveAmount =
    initialDenom &&
    swapAmount &&
    expectedReceiveAmount &&
    Number(expectedReceiveAmount?.amount) * (debouncedInitialDeposit / swapAmount);

  const totalFee =
    resultingDenomValue && expectedTotalReceiveAmount && expectedTotalReceiveAmount * (SWAP_FEE + dexFee);

  const expectedFinalReceiveAmount = expectedTotalReceiveAmount && totalFee && expectedTotalReceiveAmount - totalFee;

  const expectedFinalReceiveAmountFiatValue =
    expectedFinalReceiveAmount &&
    resultingDenomFiatPrice &&
    initialDenom &&
    Number(
      (fromAtomic(resultingDenomValue, expectedFinalReceiveAmount) * resultingDenomFiatPrice)?.toFixed(
        resultingDenomValue.significantFigures,
      ),
    );

  const initialDepositFiatValue =
    initialDeposit &&
    initialDenomFiatPrice &&
    initialDenom &&
    Number(
      (fromAtomic(initialDenom, initialDeposit) * initialDenomFiatPrice)?.toFixed(initialDenom.significantFigures),
    );

  return (
    <FormControl isInvalid={Boolean(resultingDenomMeta.touched && resultingDenomMeta.error)} isDisabled={!initialDenom}>
      <FormHelperText>
        <Center>
          <Text textStyle="body-xs">Choose asset to receive</Text>
          <Spacer />
          <Text textStyle="body-xs">Receive (Estimated)</Text>
        </Center>
      </FormHelperText>
      <SimpleGrid columns={2} spacing={2}>
        <DenomSelect
          denoms={pairs && initialDenom ? getResultingDenoms(pairs, initialDenom) : []}
          placeholder={isMobile ? 'Asset' : 'Choose asset'}
          defaultValue={resultingDenomValue?.id}
          value={resultingDenomValue?.id}
          onChange={(v) => setQueryState({ to: v && getDenomById(v)?.name })}
        />
        <FormErrorMessage>{resultingDenomMeta.touched && resultingDenomMeta.error}</FormErrorMessage>
        <NumberInput
          textAlign="right"
          isReadOnly
          isDisabled={!expectedFinalReceiveAmount}
          value={
            (initialDeposit &&
              resultingDenomValue &&
              (expectedFinalReceiveAmount || (expectedFinalReceiveAmount && expectedFinalReceiveAmount === 0)) &&
              Number(
                fromAtomic(resultingDenomValue, expectedFinalReceiveAmount)?.toFixed(
                  resultingDenomValue.significantFigures,
                ),
              )) ||
            ''
          }
          {...resultingDenomField}
        />
        <FormErrorMessage>{resultingDenomMeta.touched && resultingDenomMeta.error}</FormErrorMessage>
      </SimpleGrid>
      <FormHelperText textAlign="right">
        <Spacer />
        <Stack spacing={1} alignItems="end" justify="right">
          <HStack spacing={1} align="end">
            <Text>USD Value:</Text>
            {initialDepositFiatValue && expectedFinalReceiveAmountFiatValue ? (
              <Text color="white">${Number(expectedFinalReceiveAmountFiatValue.toFixed(2)).toLocaleString()}</Text>
            ) : !initialDenom || !resultingDenomValue || !initialDeposit ? (
              <Text color="white">$0.00</Text>
            ) : (
              <Spinner size="xs" />
            )}
          </HStack>
        </Stack>
      </FormHelperText>
      <FormErrorMessage>{resultingDenomMeta.touched && resultingDenomMeta.error}</FormErrorMessage>
    </FormControl>
  );
}

function BuyStrategyInfoModal({ isOpen, onClose }: Omit<ModalProps, 'children'>) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={6}>
          <Flex
            px={8}
            py={4}
            bg="abyss.200"
            fontSize="sm"
            borderRadius="xl"
            borderWidth={1}
            borderColor="slateGrey"
            w="full"
          >
            <Stack>
              <Text fontWeight={600} textAlign="center">
                What are price optimised swaps?
              </Text>
              <Text textAlign="center">
                Price optimised swaps distribute your market swap over several transactions. This method lessens the
                price impact typically associated with larger orders.
              </Text>
              <Text textAlign="center">
                Unlike standard limit orders, CALC Streaming Swaps allow you to set a price floor or ceiling, providing
                a safeguard against less favorable price shifts, while still giving you the opportunity to capitalize on
                positive market movements.
              </Text>
              <br />
              <Text fontWeight={600} textAlign="center">
                What happens if the price changes?
              </Text>
              <Text textAlign="center">
                If the price goes beyond your specified price threshold, CALC will set a limit order at your price
                threshold price, and the swap will only resume once the order is filled.
              </Text>
              <Text textAlign="center">
                This means that if the strategy finishes, you will receive at least the amount shown. However, if the
                price of the token falls below your price threshold, the strategy will not execute until the price
                recovers (which could be never).
              </Text>
              <Text textAlign="center">
                You can also cancel any active swaps via the strategies tab, which will return any unswapped assets back
                to your wallet.
              </Text>
            </Stack>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function AdvancedSettings({ expectedPrice }: { expectedPrice: number | undefined }) {
  const {
    values: { initialDenom, resultingDenom },
  } = useFormikContext<FormData>();

  const [, , slippageToleranceHelpers] = useField<number | undefined>({
    name: 'slippageTolerance',
  });

  const [, , priceThresholdHelpers] = useField<number | undefined>({
    name: 'priceThreshold',
  });

  const [usingPriceProtection, setUsingPriceProtection] = useState(true);
  const [slippageTolerance, setSlippageTolerance] = useState(2);
  const [priceThreshold, setPriceThreshold] = useState(0.02);
  const [rektProtekt, setRektProtekt] = useState(false);

  useEffect(() => {
    priceThresholdHelpers.setValue(
      usingPriceProtection ? expectedPrice && expectedPrice * (1 + Number(priceThreshold)) : undefined,
    );
    slippageToleranceHelpers.setValue(usingPriceProtection ? undefined : slippageTolerance);
  }, [priceThreshold, slippageTolerance, usingPriceProtection, expectedPrice]);

  return (
    <Stack>
      <HStack w="full" spacing={0}>
        <Text noOfLines={1} color={usingPriceProtection ? 'white' : 'slateGrey'} fontSize="11.5">
          {rektProtekt ? 'Rekt Protektion' : 'Price Protection'}
        </Text>
        <Switch
          marginInline={2}
          size="sm"
          colorScheme="brand"
          isChecked={usingPriceProtection}
          onChange={() => setUsingPriceProtection(!usingPriceProtection)}
        />
        <Spacer />
        {usingPriceProtection ? (
          expectedPrice ? (
            <HStack spacing={1}>
              <Text noOfLines={1} textAlign="end" fontSize="11.5">
                Skip swaps if:
              </Text>
              {resultingDenom && initialDenom && (
                <Text noOfLines={1} textAlign="end" fontSize="11.5" color="blue.200">
                  {`1 ${resultingDenom.name} > ${Number(
                    (expectedPrice && expectedPrice * (1 + priceThreshold))?.toFixed(3),
                  )} ${initialDenom.name}`}
                </Text>
              )}
            </HStack>
          ) : (
            <Spinner size="xs" />
          )
        ) : (
          <Text
            noOfLines={1}
            textAlign="end"
            fontSize="11.5"
            color="darkGrey"
            onClick={() => setRektProtekt(!rektProtekt)}
          >
            rekt protekt
          </Text>
        )}
      </HStack>
      <Box position="relative" borderRadius="16px 4px 4px 16px" border="1px solid" borderColor="abyss.200">
        <HStack w="full" marginBlock={2.5} ml={4}>
          {usingPriceProtection ? (
            <Box ml={1}>
              <FaShieldHalved color="slateGray" />
            </Box>
          ) : (
            <Icon as={Swap2Icon} stroke="slateGrey" boxSize={6} />
          )}
          <Text color="slateGrey">
            {usingPriceProtection ? (rektProtekt ? 'Rekt Protektion' : 'Price Protection') : 'Slippage Tolerance'}
          </Text>
          <Tooltip
            label={
              usingPriceProtection
                ? "Your order won't execute and is protected if the market price dips more than your set price through market movement OR pool manipulation from bad actors."
                : 'If the slippage exceeds your tolerance, the swap will fail.'
            }
          >
            <Icon as={QuestionOutlineIcon} color="slateGray" />
          </Tooltip>
          <Spacer />
        </HStack>
        <Box position="absolute" w="100px" top={0} right={0} bottom={0} h="full" backgroundColor="abyss.200">
          <HStack h="full" alignItems="center" pr={2} spacing={1}>
            <Stack h="full" spacing={0} justifyContent="center" pb={1}>
              <Button
                h={4}
                variant="unstyled"
                onClick={
                  usingPriceProtection
                    ? () => setPriceThreshold(max(0, Number(Number(priceThreshold + 0.001).toFixed(3))))
                    : () => setSlippageTolerance(max(0, Number(Number(slippageTolerance + 0.1).toFixed(1))))
                }
              >
                <Icon as={FaChevronUp} color="brand.300" fontSize={10} />
              </Button>
              <Button
                h={4}
                variant="unstyled"
                onClick={
                  usingPriceProtection
                    ? () => setPriceThreshold(max(0, Number(Number(priceThreshold - 0.001).toFixed(3))))
                    : () => setSlippageTolerance(max(0, Number(Number(slippageTolerance - 0.1).toFixed(1))))
                }
              >
                <Icon as={FaChevronDown} color="brand.300" fontSize={10} />
              </Button>
            </Stack>
            <Spacer />
            <Text fontWeight="700">
              {!usingPriceProtection
                ? Number(slippageTolerance.toFixed(2))
                : `-${Number((priceThreshold * 100).toFixed(2))}`}
            </Text>
            <Text color="slateGrey">%</Text>
          </HStack>
        </Box>
      </Box>
    </Stack>
  );
}

function DurationSlider() {
  const { isOpen, onClose } = useDisclosure();

  const {
    values: { initialDenom, initialDeposit, resultingDenom },
  } = useFormikContext<FormData>();

  const [sliderValue, setSliderValue] = useState<number>(415); // where 1 hour sits on the exponential slider
  const [strategyDuration, setStrategyDuration] = useState<number>(60);
  const [debouncedStrategyDuration, setDebouncedStrategyDuration] = useState<number>(60);
  const [isSliding, setIsSliding] = useState<boolean>(false);

  const [{ value: resultingDenomValue }] = useField({
    name: 'resultingDenom',
  });
  const [{ onChange: onChangeSwapAmount, ...swapAmountField }, , swapAmountHelpers] = useField<number>({
    name: 'swapAmount',
  });
  const [, , executionIntervalIncrementHelpers] = useField<number>({
    name: 'executionIntervalIncrement',
  });
  const [, , routeStateHelpers] = useField<
    { route: string | undefined; isLoading: boolean; error: string | undefined } | undefined
  >({
    name: 'routeState',
  });
  const [, , routeHelpers] = useField<string | undefined>({
    name: 'route',
  });

  const debouncedInitialDeposit = useDebounce(initialDeposit, { wait: 500 });

  const { route, routeError, ...useRouteHelpers } = useRoute(
    swapAmountField.value && initialDenom ? coin(BigInt(swapAmountField.value).toString(), initialDenom.id) : undefined,
    resultingDenom,
  );

  useEffect(() => {
    routeHelpers.setValue(route);
    routeStateHelpers.setValue({ route, isLoading: useRouteHelpers.isLoading, error: routeError });
  }, [route, useRouteHelpers.isLoading]);

  const { twap } = useTwapToNow(
    initialDenom,
    resultingDenom,
    route,
    !routeError && !!resultingDenom && !!initialDenom && !useRouteHelpers.isLoading,
  );
  const { dexFee } = useDexFee();
  const { fiatPrice } = useFiatPrice(initialDenom);

  const { chainId } = useChainId();
  const minimumSwapValue = getChainMinimumSwapValue(chainId);

  const minimumSwapAmount =
    initialDenom && fiatPrice && Math.floor(toAtomic(initialDenom, minimumSwapValue) * (1.0 / fiatPrice));
  const maximumSwaps = minimumSwapAmount && Math.ceil(debouncedInitialDeposit / minimumSwapAmount);

  const swaps = strategyDuration && maximumSwaps && min(strategyDuration, maximumSwaps);

  const swapAmount =
    swapAmountField.value && initialDenom
      ? coin(BigInt(Math.round(swapAmountField.value)).toString(), initialDenom.id)
      : undefined;

  const { expectedPrice } = useExpectedPrice(
    swapAmount,
    resultingDenom,
    route,
    !routeError && !!swapAmountField.value && !!resultingDenom && !useRouteHelpers.isLoading,
  );

  const expectedPriceImpact = !twap || !expectedPrice ? null : ((expectedPrice - twap) / twap) * 100;

  const minutes = strategyDuration - 1;
  const hours = Number((minutes / 60).toFixed(1));

  const minValue = 1;
  const maxValue = min(max(maximumSwaps || Infinity, 60), 60 * 48 + 1);

  const { expectedReceiveAmount } = useExpectedReceiveAmount(
    swapAmount,
    resultingDenom,
    route,
    !routeError && !!swapAmountField.value && !!resultingDenom && !useRouteHelpers.isLoading,
  );

  const { expectedReceiveAmount: directExpectedReceiveAmount } = useExpectedReceiveAmount(
    debouncedInitialDeposit && initialDenom
      ? coin(`${BigInt(Math.round(debouncedInitialDeposit)).toString()}`, initialDenom.id)
      : undefined,
    resultingDenom,
    route,
    !routeError && !!debouncedInitialDeposit && !!initialDenom && !!resultingDenom && !useRouteHelpers.isLoading,
  );

  const expectedTotalReceiveAmount =
    initialDenom &&
    swapAmountField.value &&
    expectedReceiveAmount &&
    Number(expectedReceiveAmount?.amount) * (debouncedInitialDeposit / swapAmountField.value);

  const totalFee = resultingDenom && expectedTotalReceiveAmount && expectedTotalReceiveAmount * (SWAP_FEE + dexFee);
  const expectedFinalReceiveAmount = expectedTotalReceiveAmount && totalFee && expectedTotalReceiveAmount - totalFee;

  const extraExpectedReceiveAmount =
    !!expectedFinalReceiveAmount &&
    !!directExpectedReceiveAmount &&
    !!resultingDenom &&
    fromAtomic(resultingDenom, max(0, expectedFinalReceiveAmount - Number(directExpectedReceiveAmount.amount)));

  useEffect(() => {
    const minSwapAmount =
      initialDenom && fiatPrice && Math.floor(toAtomic(initialDenom, minimumSwapValue) * (1.0 / fiatPrice));
    const maxSwaps = debouncedInitialDeposit && minSwapAmount && Math.ceil(debouncedInitialDeposit / minSwapAmount);

    const totalSwaps = debouncedStrategyDuration && maxSwaps && min(debouncedStrategyDuration, maxSwaps);
    const newSwapAmount =
      totalSwaps && debouncedInitialDeposit ? Math.ceil(debouncedInitialDeposit / totalSwaps) : undefined;

    if (debouncedStrategyDuration && totalSwaps)
      executionIntervalIncrementHelpers.setValue(Math.floor(debouncedStrategyDuration / totalSwaps));
    if (newSwapAmount || minSwapAmount) swapAmountHelpers.setValue(newSwapAmount ?? minSwapAmount ?? 0);
  }, [debouncedStrategyDuration, debouncedInitialDeposit, initialDenom, resultingDenom]);

  useEffect(() => {
    if (!swapAmountField.value) {
      setDebouncedStrategyDuration(sliderValue);
    }
  }, [initialDenom]);

  const getStrategyDurationFromSlider = (value: number, factor = 0.2) =>
    max(1, Math.round(((factor * value) ** 2 / (factor * maxValue) ** 2) * maxValue));

  return (
    <>
      <FormControl id="swaps">
        <FormLabel>
          <HStack>
            <Text>Price optimised swap</Text>
            <Tooltip label="Reduce the price impact your swap has on the market by breaking up 1 swap into several transactions so you get more in return rather than profit the arb bots. Enable price protection to safeguard against less favorable price shifts, while still giving you the opportunity to capitalize on positive market movements.">
              <Icon as={QuestionOutlineIcon} _hover={{ color: 'blue.200' }} />
            </Tooltip>
          </HStack>
        </FormLabel>
        <FormHelperText>
          <Center>
            <Button
              size="xs"
              colorScheme="blue"
              variant="link"
              cursor="pointer"
              onClick={() => {
                setSliderValue(minValue);
                setStrategyDuration(minValue);
                setDebouncedStrategyDuration(minValue);
              }}
            >
              Immediate
            </Button>
            <Spacer />
            <Button
              size="xs"
              colorScheme="blue"
              variant="link"
              cursor="pointer"
              onClick={() => {
                setSliderValue(maxValue);
                setStrategyDuration(maxValue);
                setDebouncedStrategyDuration(maxValue);
              }}
            >
              {maxValue > 59
                ? `${(maxValue / 60).toFixed(0)} ${maxValue / 60 < 2 ? 'hour' : 'hours'}`
                : `${maxValue} minutes`}
            </Button>
          </Center>
        </FormHelperText>
        <Slider
          defaultValue={sliderValue}
          value={sliderValue}
          min={minValue}
          max={maxValue}
          step={1}
          onChangeStart={() => setIsSliding(true)}
          onChange={(value) => {
            setSliderValue(value);
            setStrategyDuration(getStrategyDurationFromSlider(value));
          }}
          onChangeEnd={(value) => {
            setIsSliding(false);
            setStrategyDuration(getStrategyDurationFromSlider(value));
            setDebouncedStrategyDuration(getStrategyDurationFromSlider(value));
          }}
          focusThumbOnChange={false}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb boxSize={4} bg="blue.200" borderWidth={1} zIndex={0} />
        </Slider>
        {!routeError && !!swaps && !!initialDenom && !!debouncedInitialDeposit && !!resultingDenom && (
          <FormHelperText>
            <Text color="brand.200" fontSize="xs">
              {swaps} {swaps > 1 ? 'swaps' : 'swap'} of{' '}
              {Number(
                fromAtomic(
                  initialDenom,
                  swaps && debouncedInitialDeposit && Math.ceil(debouncedInitialDeposit / swaps),
                ).toFixed(initialDenom.significantFigures),
              ).toString()}{' '}
              {initialDenom.name}
              {!isSliding && expectedPriceImpact && !useRouteHelpers.isLoading
                ? ` with estimated ${Number(expectedPriceImpact.toFixed(3))}% price impact`
                : ''}
            </Text>
          </FormHelperText>
        )}
      </FormControl>
      <Collapse
        in={!useRouteHelpers.isLoading && !routeError && !!swaps && !!debouncedInitialDeposit && !!resultingDenom}
      >
        <Stack spacing={4}>
          <Box position="relative" borderRadius="lg" p={4}>
            <Box
              position="absolute"
              top={0}
              right={0}
              bottom={0}
              left={0}
              bg="green.200"
              opacity={0.15}
              borderRadius="lg"
            />
            <Stack spacing={2} align="stretch">
              <HStack justifyContent="space-between">
                <HStack>
                  <Icon color="green.200" as={MdAccessTime} />
                  <Text color="white" fontSize="m" fontWeight={600}>
                    Estimated swap time:
                  </Text>
                </HStack>
                <Text color="white" fontSize="m" fontWeight={600}>
                  {hours >= 1
                    ? `${hours} ${hours === 1 ? 'hour' : 'hours'}`
                    : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`}
                </Text>
              </HStack>
              <HStack justifyContent="space-between" alignItems="flex-start">
                <HStack alignItems="flex-start">
                  <Icon mt="5px" color="green.200" opacity={1} as={FaAnglesUp} />
                  <Stack spacing={1.5}>
                    <Text color="white" fontSize="m" fontWeight={600}>
                      Increased returns:
                    </Text>
                    <Text fontSize="xs" color="grey" fontWeight={600}>
                      Compared to a single swap.
                    </Text>
                  </Stack>
                </HStack>
                <Stack spacing={0} justifyContent="flex-end">
                  {extraExpectedReceiveAmount ? (
                    <Text
                      color={extraExpectedReceiveAmount && extraExpectedReceiveAmount > 0 ? 'green.200' : 'white'}
                      fontSize="m"
                      fontWeight={600}
                    >
                      +
                      {resultingDenom &&
                        Number(extraExpectedReceiveAmount.toFixed(resultingDenom.significantFigures)).toLocaleString(
                          [],
                          {
                            maximumFractionDigits: resultingDenom.significantFigures,
                          },
                        )}{' '}
                      {resultingDenom && resultingDenom.name}
                    </Text>
                  ) : !initialDenom ||
                    !debouncedInitialDeposit ||
                    !resultingDenomValue ||
                    extraExpectedReceiveAmount === 0 ? (
                    <Text fontSize="m" fontWeight={600}>
                      0.00 {resultingDenom?.name ?? ''}
                    </Text>
                  ) : (
                    <Spinner mt={3} mr={3} p={1} />
                  )}
                  <Text
                    opacity={1}
                    color={
                      extraExpectedReceiveAmount && totalFee && extraExpectedReceiveAmount - totalFee > 0
                        ? 'green.200'
                        : 'white'
                    }
                    fontSize="m"
                    fontWeight={600}
                    textAlign="end"
                  >
                    {extraExpectedReceiveAmount
                      ? `(+${
                          expectedFinalReceiveAmount &&
                          directExpectedReceiveAmount &&
                          Number(
                            (
                              100 *
                              ((expectedFinalReceiveAmount - Number(directExpectedReceiveAmount.amount)) /
                                Number(directExpectedReceiveAmount.amount))
                            ).toFixed(2),
                          )
                        }%)`
                      : ''}
                  </Text>
                </Stack>
              </HStack>
            </Stack>
          </Box>
          <AdvancedSettings expectedPrice={expectedPrice} />
        </Stack>
      </Collapse>
      <BuyStrategyInfoModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}

function FeeSection() {
  const {
    values: { initialDenom, initialDeposit, resultingDenom, swapAmount },
  } = useFormikContext<FormData>();

  const { fiatPrice } = useFiatPrice(initialDenom);
  const { dexFee } = useDexFee();

  const [{ value: routeState }] = useField<
    { route: string | undefined; isLoading: boolean; error: string | undefined } | undefined
  >({
    name: 'routeState',
  });

  if (!initialDenom) return null;

  return (
    <Collapse in={!routeState?.error && !!initialDenom && !!initialDeposit && !!resultingDenom && !!swapAmount}>
      <Stack spacing={0}>
        <Text textStyle="body-xs" as="span">
          Estimated fees:
          <Tooltip label={`Standard ${SWAP_FEE * 100}% fee on all streaming swaps.`} placement="top">
            {initialDenom ? (
              <Text as="span" textColor="white">
                {' '}
                {String.fromCharCode(8275)}
                {Number(
                  Number(fromAtomic(initialDenom, initialDeposit) * (SWAP_FEE + dexFee)).toFixed(
                    initialDenom.significantFigures,
                  ),
                )}{' '}
                {initialDenom.name}{' '}
                {`(${Number(
                  Number(fromAtomic(initialDenom, swapAmount) * (SWAP_FEE + dexFee)).toFixed(
                    initialDenom.significantFigures,
                  ),
                )} ${initialDenom.name} per swap)`}
              </Text>
            ) : null}
          </Tooltip>
        </Text>
        {initialDenom && (
          <Box pl={2}>
            <FeeBreakdown
              initialDenom={initialDenom}
              swapAmount={fromAtomic(initialDenom, swapAmount)}
              price={fiatPrice}
              dexFee={dexFee}
              swapFee={SWAP_FEE}
              excludeDepositFee={false}
            />
          </Box>
        )}
      </Stack>
    </Collapse>
  );
}

function Form({ formValues }: { formValues: FormData }) {
  const { connected } = useWallet();
  const { isLoading: isPairsLoading } = usePairs(undefined, formValues.initialDenom?.id);
  const { mutate, isError, error, isLoading } = useCreateStreamingSwap();
  const [isSuccess, setIsSuccess] = useState(false);
  const [, updateQueryState] = useQueryState();

  const handleSubmit = (_: AgreementForm, { setSubmitting }: FormikHelpers<AgreementForm>, state: any) =>
    mutate(
      { state },
      {
        onSuccess: (strategyId) => {
          updateQueryState({
            strategyId,
            timeSaved: state && getTimeSaved(state.initialDeposit, state.swapAmount),
          });
          setIsSuccess(true);
        },
        onSettled: () => {
          setSubmitting(false);
        },
      },
    );

  const [{ value: routeState }] = useField<
    { route: string | undefined; isLoading: boolean; error: string | undefined } | undefined
  >({
    name: 'routeState',
  });

  return (
    <Box maxWidth={451} mx="auto">
      <NewStrategyModalBody stepsConfig={streamingSwapSteps} isLoading={isPairsLoading} isSigning={isLoading}>
        {isSuccess ? (
          <SuccessStrategyModalBody />
        ) : (
          <Stack direction="column" spacing={4} visibility={isLoading ? 'hidden' : 'visible'}>
            <Stack direction="column" spacing={2} visibility={isLoading ? 'hidden' : 'visible'}>
              <Stack direction="column" spacing={0} visibility={isLoading ? 'hidden' : 'visible'}>
                <InitialDenom />
                <SwapDenoms />
                <ResultingDenom />
              </Stack>
              <DurationSlider />
            </Stack>
            <FeeSection />
            <FormControl isInvalid={!!routeState?.error}>
              <FormErrorMessage>{routeState?.error}</FormErrorMessage>
            </FormControl>
            {connected ? (
              <SummaryAgreementForm
                isError={isError}
                error={error}
                onSubmit={(agreementData, setSubmitting) => handleSubmit(agreementData, setSubmitting, formValues)}
              />
            ) : (
              <ConnectWalletButton />
            )}
          </Stack>
        )}
      </NewStrategyModalBody>
    </Box>
  );
}

export function StreamingSwapForm() {
  const { balances } = useBalances();
  const { validate } = useValidation(schema, { balances });

  return (
    <BrowserRouter>
      <Formik initialValues={initialValues} validate={validate} onSubmit={() => {}}>
        {({ values: formValues }) => <Form formValues={formValues as unknown as FormData} />}
      </Formik>
    </BrowserRouter>
  );
}
