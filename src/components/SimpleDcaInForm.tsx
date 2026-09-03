import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Image,
  SimpleGrid,
  Spacer,
  Stack,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import {
  DcaInFormDataStep1,
  SimplifiedDcaInFormData,
  initialValues,
  simplifiedDcaInValidationSchema,
} from 'src/models/DcaInFormData';
import usePairs, { getResultingDenoms, orderAlphabetically } from '@hooks/usePairs';
import { Formik, FormikHelpers, useField, useFormikContext } from 'formik';
import useValidation from '@hooks/useValidation';
import useBalances from '@hooks/useBalances';
import { FormNames } from '@hooks/useFormStore';
import { StrategyType } from '@models/StrategyType';
import { TransactionType } from '@components/TransactionType';
import Spinner from '@components/Spinner';
import simpleDcaInSteps from '@formConfig/simpleDcaIn';
import { StrategyInfoProvider } from '@hooks/useStrategyInfo';
import { NewStrategyModalBody } from '@components/NewStrategyModal';
import usePageLoad from '@hooks/usePageLoad';
import * as Sentry from '@sentry/react';
import { AgreementForm, SummaryAgreementForm } from '@components/Summary/SummaryAgreementForm';
import { useEffect, useState } from 'react';
import { SuccessStrategyModalBody } from '@components/SuccessStrategyModal';
import { DenomSelect } from '@components/DenomSelect';
import { getChainDexName, getChainMinimumSwapValue } from '@helpers/chains';
import { useChainId } from '@hooks/useChainId';
import { InitialDenomInfo, ResultingDenomInfo } from '@utils/DenomInfo';
import { AvailableFunds } from '@components/AvailableFunds';
import InitialDeposit from '@components/InitialDeposit';
import useSteps from '@hooks/useSteps';
import totalExecutions from '@utils/totalExecutions';
import { ExecutionIntervals } from '@models/ExecutionIntervals';
import executionIntervalDisplay from '@helpers/executionIntervalDisplay';
import { getTimeSaved } from '@helpers/getTimeSaved';
import { formatFiat } from '@helpers/format/formatFiat';
import { useWallet } from '@hooks/useWallet';
import useDenoms from '@hooks/useDenoms';
import { BrowserRouter } from 'react-router-dom';
import { values } from 'rambda';
import useRoute from '@hooks/useRoute';
import { coin } from '@cosmjs/stargate';
import useQueryState from '@hooks/useQueryState';
import { fromAtomic, toAtomic } from '@utils/getDenomInfo';
import { useCreateVaultDca } from '@hooks/useCreateVault/useCreateVaultDca';
import ExecutionIntervalLegacy from './ExecutionIntervalLegacy';
import { DenomInput } from './DenomInput';
import { ConnectWalletButton } from './ConnectWalletButton';

type SimpleDcaModalHeaderProps = {
  isSuccess: boolean;
};

function ModalHeader({ isSuccess }: SimpleDcaModalHeaderProps) {
  return (
    <Heading size="sm">
      {isSuccess ? 'Strategy successfully created!' : 'Setup a simple dollar cost averaging (DCA) strategy'}
    </Heading>
  );
}

function InitialDenom() {
  const { chainId } = useChainId();
  const { getDenomById, denoms } = useDenoms([chainId]);
  const [initialDenom, meta, initialDenomHelpers] = useField({ name: 'initialDenom' });
  const [, , resultingDenomHelpers] = useField({ name: 'resultingDenom' });
  const [isMobile] = useMediaQuery('(max-width: 506px)');

  return (
    <FormControl isInvalid={Boolean(meta.touched && meta.error)}>
      <FormLabel>Using:</FormLabel>
      <FormHelperText>
        <Center>
          <Text textStyle="body-xs">Choose asset to sell</Text>
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
            value={initialDenom.value?.id}
            onChange={(newValue) => {
              if (!newValue) return;
              initialDenomHelpers.setValue(getDenomById(newValue));
              resultingDenomHelpers.setValue(undefined);
            }}
          />
          <FormErrorMessage>{meta.touched && meta.error}</FormErrorMessage>
        </Box>
        <InitialDeposit />
      </SimpleGrid>
    </FormControl>
  );
}

function ResultingDenom({ denoms }: { denoms: InitialDenomInfo[] }) {
  const [{ value: resultingDenom }, meta, helpers] = useField({ name: 'resultingDenom' });
  const { chainId } = useChainId();
  const { getDenomById } = useDenoms([chainId]);

  const {
    values: { initialDenom },
  } = useFormikContext<DcaInFormDataStep1>();

  return (
    <FormControl isInvalid={Boolean(meta.touched && meta.error)} isDisabled={!initialDenom}>
      <FormLabel>I want to DCA into:</FormLabel>
      <FormHelperText>
        <Text textStyle="body-xs">CALC will purchase this asset for you</Text>
      </FormHelperText>
      <DenomSelect
        denoms={denoms}
        placeholder="Choose asset"
        defaultValue={resultingDenom?.id}
        value={resultingDenom?.id}
        onChange={(v) => v && helpers.setValue(getDenomById(v))}
        optionLabel={`Swapped on ${getChainDexName(chainId)}`}
      />
      <FormErrorMessage>{meta.touched && meta.error}</FormErrorMessage>
    </FormControl>
  );
}

function SwapAmount({
  initialDenom,
  resultingDenom,
}: {
  initialDenom: InitialDenomInfo | undefined;
  resultingDenom: ResultingDenomInfo | undefined;
}) {
  const { chainId } = useChainId();
  const [{ onChange, value: swapAmount, ...swapAmountField }, swapAmountMeta, { setValue: setSwapAmount }] = useField({
    name: 'swapAmount',
  });
  const [{ value: initialDeposit }, depositMeta] = useField({ name: 'initialDeposit' });
  const [{ value: executionInterval }] = useField({ name: 'executionInterval' });
  const [, routeMeta, routeHelpers] = useField<string | undefined>({
    name: 'route',
  });

  const executions = initialDeposit && swapAmount ? totalExecutions(initialDeposit, swapAmount) : 0;
  const displayExecutionInterval =
    executionInterval &&
    executions > 0 &&
    executionIntervalDisplay[executionInterval as ExecutionIntervals][executions > 1 ? 1 : 0];

  const {
    route,
    routeError,
    isLoading: routeIsLoading,
  } = useRoute(
    swapAmount && initialDenom ? coin(BigInt(swapAmount).toString(), initialDenom.id) : undefined,
    resultingDenom,
  );

  useEffect(() => {
    if (routeIsLoading) {
      routeHelpers.setValue(undefined);
      routeHelpers.setTouched(false);
    } else if (routeError) {
      routeHelpers.setTouched(true, false);
      routeHelpers.setError(routeError);
    } else {
      routeHelpers.setValue(route);
      routeHelpers.setTouched(true);
    }
  }, [route, routeError, routeIsLoading]);

  return (
    <FormControl
      isInvalid={
        Boolean(swapAmountMeta.touched && swapAmountMeta.error && initialDeposit) ||
        Boolean(routeMeta.touched && routeError)
      }
      isDisabled={!executionInterval || !initialDeposit}
    >
      <FormLabel>How much {initialDenom?.name} each purchase?</FormLabel>
      <FormHelperText>
        <Flex alignItems="flex-start">
          <Text>The amount you want swapped each purchase for {resultingDenom?.name}.</Text>
          <Spacer />
          <Flex flexDirection="row">
            <Text ml={4} mr={1}>
              Max:
            </Text>
            <Button
              size="xs"
              colorScheme="blue"
              variant="link"
              cursor="pointer"
              onClick={() => setSwapAmount(initialDeposit)}
            >
              {initialDenom && initialDeposit && depositMeta.touched
                ? fromAtomic(initialDenom, initialDeposit).toLocaleString('en-US', {
                    maximumFractionDigits: 6,
                    minimumFractionDigits: 2,
                  }) ?? '-'
                : '-'}
            </Button>
          </Flex>
        </Flex>{' '}
      </FormHelperText>
      <DenomInput
        denom={initialDenom}
        onChange={(input) => initialDenom && setSwapAmount(toAtomic(initialDenom, input ?? 0))}
        value={initialDenom && swapAmount && fromAtomic(initialDenom, swapAmount)}
        {...swapAmountField}
        isDisabled={!initialDeposit}
      />
      <FormHelperText>Swap amount must be greater than {formatFiat(getChainMinimumSwapValue(chainId))}</FormHelperText>
      <FormErrorMessage>{routeError || swapAmountMeta.error}</FormErrorMessage>
      {initialDeposit && !depositMeta.error && depositMeta.touched && swapAmount > 0 && (
        <FormHelperText color="brand.200" fontSize="xs">
          A total of {executions} swaps will take place over {executions} {displayExecutionInterval}.
        </FormHelperText>
      )}
    </FormControl>
  );
}

function SimpleDCAInForm({ formValues }: { formValues: SimplifiedDcaInFormData }) {
  const { connected } = useWallet();
  const { nextStep } = useSteps(simpleDcaInSteps);
  const { mutate, isError, error, isLoading } = useCreateVaultDca();
  const { isPageLoading } = usePageLoad();
  const [isSuccess, setIsSuccess] = useState(false);
  const [{ value: initialDenom }] = useField({ name: 'initialDenom' });
  const { pairs } = usePairs(undefined, initialDenom?.id);
  const [, initialDepositMeta] = useField({ name: 'initialDeposit' });
  const [{ value: resultingDenom }] = useField({ name: 'resultingDenom' });
  const [, routeMeta] = useField({ name: 'route' });
  const [, setQueryState] = useQueryState();

  const handleSubmit = (_: AgreementForm, { setSubmitting }: FormikHelpers<AgreementForm>, state: any) =>
    mutate(
      { state },
      {
        onSuccess: async (strategyId) => {
          nextStep({
            strategyId,
            timeSaved: state && getTimeSaved(state.initialDeposit, state.swapAmount),
          });
          setQueryState({
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

  if (!pairs) {
    return (
      <Center h={56}>
        <Spinner />
      </Center>
    );
  }

  const resultingDenoms = initialDenom
    ? getResultingDenoms(pairs, initialDenom).filter((denom) => denom.id !== initialDenom?.id)
    : [];

  return (
    <Flex layerStyle="panel" p={{ base: 0, sm: 4 }} alignItems="center" justifyContent="center" h="full">
      <Box maxWidth={451} mx="auto">
        <NewStrategyModalBody stepsConfig={simpleDcaInSteps} isLoading={isPageLoading} isSigning={isLoading}>
          {isSuccess ? (
            <SuccessStrategyModalBody />
          ) : (
            <Stack direction="column" spacing={4} visibility={isLoading ? 'hidden' : 'visible'}>
              <ModalHeader isSuccess={isSuccess} />
              <InitialDenom />
              <ResultingDenom denoms={resultingDenoms} />
              <ExecutionIntervalLegacy />
              <SwapAmount initialDenom={initialDenom} resultingDenom={resultingDenom} />
              {connected ? (
                <SummaryAgreementForm
                  isError={isError}
                  error={error}
                  onSubmit={(agreementData, setSubmitting) => handleSubmit(agreementData, setSubmitting, formValues)}
                  isDisabled={
                    !routeMeta.touched || !!routeMeta.error || !initialDepositMeta.touched || !!initialDepositMeta.error
                  }
                />
              ) : (
                <ConnectWalletButton />
              )}
            </Stack>
          )}
        </NewStrategyModalBody>
      </Box>
    </Flex>
  );
}

export default function SimpleDcaIn() {
  const { balances } = useBalances();
  const { validate } = useValidation(simplifiedDcaInValidationSchema, { balances });

  return (
    <StrategyInfoProvider
      strategyInfo={{
        strategyType: StrategyType.SimpleDCAIn,
        transactionType: TransactionType.Buy,
        formName: FormNames.SimpleDcaIn,
      }}
    >
      <BrowserRouter>
        <Formik initialValues={initialValues} validate={validate} onSubmit={() => {}}>
          {({ values: formValues }) => (
            <Sentry.ErrorBoundary
              fallback={
                <Center m={8} p={8} flexDirection="column" gap={6}>
                  <Heading size="lg">Something went wrong</Heading>
                  <Image w={28} h={28} src="/images/notConnected.png" />
                  <Text>Please try again in a new session</Text>
                </Center>
              }
            >
              <SimpleDCAInForm formValues={formValues as unknown as SimplifiedDcaInFormData} />
            </Sentry.ErrorBoundary>
          )}
        </Formik>
      </BrowserRouter>
    </StrategyInfoProvider>
  );
}
