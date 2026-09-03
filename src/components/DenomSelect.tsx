import { Badge, Flex, HStack, Spacer, Text } from '@chakra-ui/react';
import DenomIcon from '@components/DenomIcon';
import { OptionProps, chakraComponents } from 'chakra-react-select';
import { InitialDenomInfo } from '@utils/DenomInfo';
import useBalances from '@hooks/useBalances';
import useFiatPrices from '@hooks/useFiatPrices';
import { useChainId } from '@hooks/useChainId';
import { useMemo } from 'react';
import { OptionTypeDenomSelect, SelectDenomWithSearch, SelectProps } from './Select';

function formatBalance(balance: number) {
  if (balance > 0 && balance < 0.000001) return '<0.000001';

  return balance.toLocaleString('en-US', {
    maximumFractionDigits: 6,
  });
}

function DenomSelectLabel({ denom, balance }: { denom: InitialDenomInfo; balance: number }) {
  const { name } = denom;
  return (
    <HStack flexGrow={1}>
      <DenomIcon denomInfo={denom} />
      <Text>{name}</Text>
      {balance > 0 && (
        <Badge colorScheme="blue" textTransform="none" variant="subtle">
          {formatBalance(balance)}
        </Badge>
      )}
    </HStack>
  );
}

function DenomOption({ isSelected, rightLabel, children, ...optionProps }: OptionProps & { rightLabel?: string }) {
  return (
    <chakraComponents.Option isSelected={isSelected} {...optionProps}>
      <Flex alignItems="center" w="full">
        {children}
        <Spacer />
        {rightLabel && <Text fontSize="xs">{rightLabel}</Text>}
      </Flex>
    </chakraComponents.Option>
  );
}

function getDenomOptionComponent(rightLabel?: string) {
  // eslint-disable-next-line func-names
  return function ({ children: childrenProp, isSelected, ...props }: OptionProps) {
    return (
      <DenomOption isSelected={isSelected} rightLabel={rightLabel} {...props}>
        {childrenProp}
      </DenomOption>
    );
  };
}

export function DenomSelect({
  denoms,
  optionLabel,
  ...selectProps
}: { denoms: InitialDenomInfo[]; optionLabel?: string } & Omit<SelectProps, 'options'>) {
  const { chainId } = useChainId();
  const { balances } = useBalances();
  const balancesByDenom = useMemo(
    () =>
      new Map(balances?.filter(({ amount }) => Number(amount) > 0).map(({ denom, amount }) => [denom, amount]) ?? []),
    [balances],
  );
  const balanceDenomIds = useMemo(() => Array.from(balancesByDenom.keys()), [balancesByDenom]);
  const { fiatPrices } = useFiatPrices([chainId], balanceDenomIds);
  const balanceDetailsByDenom = useMemo(
    () =>
      new Map(
        denoms.map((denom) => {
          const balance = Number(balancesByDenom.get(denom.id) ?? 0) / 10 ** denom.significantFigures;
          const price = denom.coingeckoId ? fiatPrices?.[denom.coingeckoId]?.usd : undefined;
          return [
            denom.id,
            {
              balance,
              usdValue: balance > 0 && typeof price === 'number' ? balance * price : undefined,
            },
          ];
        }),
      ),
    [balancesByDenom, denoms, fiatPrices],
  );
  const sortedDenoms = useMemo(
    () =>
      [...denoms].sort((a, b) => {
        const { balance: aBalance = 0, usdValue: aUsdValue } = balanceDetailsByDenom.get(a.id) ?? {};
        const { balance: bBalance = 0, usdValue: bUsdValue } = balanceDetailsByDenom.get(b.id) ?? {};
        const aHasUsdValue = typeof aUsdValue === 'number';
        const bHasUsdValue = typeof bUsdValue === 'number';
        const aHasBalance = aBalance > 0;
        const bHasBalance = bBalance > 0;

        if (aHasUsdValue !== bHasUsdValue) return aHasUsdValue ? -1 : 1;
        if (aHasUsdValue && bHasUsdValue && aUsdValue !== bUsdValue) return bUsdValue - aUsdValue;
        if (aHasBalance !== bHasBalance) return aHasBalance ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [balanceDetailsByDenom, denoms],
  );

  const customComponents = () => ({
    Option: getDenomOptionComponent(optionLabel),
  });

  const pairsOptions: OptionTypeDenomSelect[] = sortedDenoms.map((denom) => ({
    value: [denom.id, denom.name],
    label: <DenomSelectLabel denom={denom} balance={balanceDetailsByDenom.get(denom.id)?.balance ?? 0} />,
  }));

  return (
    <SelectDenomWithSearch isSearchable options={pairsOptions} customComponents={customComponents()} {...selectProps} />
  );
}
