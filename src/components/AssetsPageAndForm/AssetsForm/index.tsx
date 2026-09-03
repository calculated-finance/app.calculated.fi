import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  SimpleGrid,
  Spacer,
  Text,
  Center,
} from '@chakra-ui/react';
import usePairs, { getResultingDenoms, isSupportedDenomForDcaPlus, orderAlphabetically } from '@hooks/usePairs';
import { denomHasCoingeckoId, isDenomStable, isDenomVolatile, toAtomic } from '@utils/getDenomInfo';
import { useField } from 'formik';
import { AvailableFunds } from '@components/AvailableFunds';
import { DenomSelect } from '@components/DenomSelect';
import InitialDeposit from '@components/InitialDeposit';
import { useChainId } from '@hooks/useChainId';
import { getChainDexName } from '@helpers/chains';
import { StrategyType } from '@models/StrategyType';
import { InitialDenomInfo } from '@utils/DenomInfo';
import useDenoms from '@hooks/useDenoms';
import { HydratedPair } from '@models/Pair';
import Spinner from '@components/Spinner';
import { values } from 'rambda';
import useRoute from '@hooks/useRoute';
import { coin } from '@cosmjs/stargate';
import { useEffect } from 'react';
import Submit from '@components/Submit';
import { ConnectWalletButton } from '@components/ConnectWalletButton';
import { useWallet } from '@hooks/useWallet';

function getIsDcaInStrategy(strategyType: string | undefined) {
  const strategy = strategyType && strategyType;
  return [StrategyType.DCAIn, StrategyType.DCAPlusIn, StrategyType.WeightedScaleIn].includes(strategy as StrategyType);
}

function getInitialDenomsFromStrategyType(
  strategyType: StrategyType | undefined,
  denoms: InitialDenomInfo[],
): InitialDenomInfo[] {
  if (!strategyType || !denoms) {
    return [];
  }

  return denoms.filter(
    (denom) =>
      (getIsDcaInStrategy(strategyType) ? isDenomStable(denom) : true) &&
      (strategyType === StrategyType.DCAPlusOut ? isSupportedDenomForDcaPlus(denom) : true) &&
      (strategyType === StrategyType.DCAOut ? isDenomVolatile(denom) : true) &&
      denomHasCoingeckoId(denom),
  );
}

function getResultingDenomsFromStrategyType(
  strategyType: StrategyType | undefined,
  pairs: HydratedPair[],
  initialDenom: InitialDenomInfo,
) {
  if (!strategyType || !pairs || !initialDenom) return [];

  const resultingDenoms = getResultingDenoms(pairs, initialDenom).filter((denom) => denom.id !== initialDenom.id);

  return strategyType === StrategyType.DCAPlusIn ? resultingDenoms.filter(isSupportedDenomForDcaPlus) : resultingDenoms;
}

export function AssetsForm() {
  const { connected } = useWallet();
  const { denoms } = useDenoms();
  const [{ value: initialDenom }, initialDenomMeta, initialDenomHelpers] = useField({ name: 'initialDenom' });
  const { pairs } = usePairs(undefined, initialDenom?.id);
  const [{ value: initialDeposit }] = useField({ name: 'initialDeposit' });
  const [{ value: resultingDenom }, resultingDenomMeta, resultingDenomHelpers] = useField({ name: 'resultingDenom' });
  const [strategyType] = useField({ name: 'strategyType' });
  const { chainId } = useChainId();
  const { getDenomById } = useDenoms();
  const [, routeMeta, routeHelpers] = useField<string | undefined>({
    name: 'route',
  });

  const {
    route,
    routeError,
    isLoading: routeIsLoading,
  } = useRoute(
    initialDenom.significantFigures ? coin(BigInt(toAtomic(initialDenom, 1)).toString(), initialDenom.id) : undefined,
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

  if (!pairs || !denoms?.[chainId])
    return (
      <Box height={200}>
        <Center h="full">
          <Spinner />
        </Center>
      </Box>
    );

  const isDcaInStrategy = getIsDcaInStrategy(strategyType.value);

  return (
    <>
      <FormControl isInvalid={Boolean(initialDenomMeta.touched && initialDenomMeta.error)}>
        <FormLabel>
          {isDcaInStrategy
            ? 'How will you fund your first investment?'
            : 'What position do you want to take profit on?'}
        </FormLabel>
        <FormHelperText>
          <Center>
            <Text textStyle="body-xs">
              {isDcaInStrategy
                ? 'Choose stablecoin'
                : `CALC currently supports pairs trading on ${getChainDexName(chainId)}.`}{' '}
            </Text>
            <Spacer />
            <AvailableFunds denom={initialDenom} />
          </Center>
        </FormHelperText>
        <SimpleGrid columns={2} spacing={2}>
          <Box>
            <DenomSelect
              denoms={
                denoms && chainId && denoms[chainId]
                  ? orderAlphabetically(getInitialDenomsFromStrategyType(strategyType.value, values(denoms[chainId])))
                  : []
              }
              placeholder="Choose&nbsp;asset"
              value={initialDenom?.id}
              onChange={(v) => v && initialDenomHelpers.setValue(getDenomById(v))}
              optionLabel={getChainDexName(chainId)}
            />
            <FormErrorMessage>
              {initialDenomMeta.touched && initialDenomMeta.error
                ? typeof initialDenomMeta.error === 'string'
                  ? initialDenomMeta.error
                  : values(initialDenomMeta.error)[0]
                : null}
            </FormErrorMessage>
          </Box>
          <InitialDeposit />
        </SimpleGrid>
      </FormControl>
      <FormControl
        isInvalid={Boolean(resultingDenomMeta.touched && resultingDenomMeta.error) || !!routeMeta.error}
        isDisabled={!initialDenom}
      >
        <FormLabel hidden={!isDcaInStrategy}>What asset do you want to invest in?</FormLabel>
        <FormLabel hidden={isDcaInStrategy}>How do you want to hold your profits?</FormLabel>
        <FormHelperText>
          <Text textStyle="body-xs">
            {isDcaInStrategy
              ? 'CALC will purchase this asset for you'
              : 'You will have the choice to move these funds into another strategy at the end.'}
          </Text>
        </FormHelperText>
        <DenomSelect
          denoms={getResultingDenomsFromStrategyType(strategyType.value, pairs, initialDenom)}
          placeholder="Choose asset"
          value={resultingDenom}
          onChange={(v) => v && resultingDenomHelpers.setValue(getDenomById(v))}
          optionLabel={`Swapped on ${getChainDexName(chainId)}`}
        />
        <FormErrorMessage>
          {(resultingDenomMeta.touched && resultingDenomMeta.error
            ? typeof resultingDenomMeta.error === 'string'
              ? resultingDenomMeta.error
              : values(resultingDenomMeta.error)[0]
            : null) ||
            (initialDenomMeta.touched && initialDenomMeta.error) ||
            routeError}
        </FormErrorMessage>
      </FormControl>
      {connected ? (
        <Submit isDisabled={!initialDeposit || !routeMeta.touched || !!routeError}>Next</Submit>
      ) : (
        <ConnectWalletButton />
      )}
    </>
  );
}
