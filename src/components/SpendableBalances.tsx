import { Text, Divider, GridItem, Grid, Stack } from '@chakra-ui/react';
import useBalances from '@hooks/useBalances';
import { fromAtomic } from '@utils/getDenomInfo';
import useFiatPrice from '@hooks/useFiatPrice';
import { formatFiat } from '@helpers/format/formatFiat';
import { Coin } from 'src/interfaces/dca/response/get_vault';
import { useDenom } from '@hooks/useDenom/useDenom';
import { truncate } from '@helpers/truncate';
import useDenoms from '@hooks/useDenoms';
import useFiatPrices from '@hooks/useFiatPrices';
import { useChainId } from '@hooks/useChainId';

function CoinBalance({ balance }: { balance: Coin }) {
  const { chainId } = useChainId();
  const { getDenomById } = useDenoms([chainId]);
  const initialDenomInfo = getDenomById(balance.denom);
  return (
    initialDenomInfo && (
      <>
        <GridItem colSpan={1}>
          <Text fontSize="xs" noOfLines={1}>
            {fromAtomic(initialDenomInfo, Number(balance.amount))}
          </Text>
        </GridItem>
        <GridItem colSpan={2}>
          <Text textStyle="body-xs">{initialDenomInfo.name || truncate(balance.denom)}</Text>
        </GridItem>
      </>
    )
  );
}

function CoinBalanceWithFiat({ balance }: { balance: Coin }) {
  const denom = useDenom(balance.denom);
  const { fiatPrice } = useFiatPrice(denom);
  const { getDenomById } = useDenoms();
  const balanceConverted = fromAtomic(getDenomById(balance.denom)!, Number(balance.amount));
  return (
    <>
      <GridItem colSpan={1}>
        <Text fontSize="xs" noOfLines={1}>
          {balanceConverted}
        </Text>
      </GridItem>
      <GridItem colSpan={1}>
        <Text textStyle="body-xs">{denom?.name || truncate(balance.denom)}</Text>
      </GridItem>
      <GridItem colSpan={1}>
        <Text textStyle="body-xs">{formatFiat((fiatPrice || 0) * balanceConverted)}</Text>
      </GridItem>
    </>
  );
}

export function BalanceList({ balances = [] }: { balances: Coin[] | undefined }) {
  const { fiatPrices } = useFiatPrices();
  const { getDenomById } = useDenoms();

  if (!fiatPrices) return null;

  balances
    .map((b) => getDenomById(b.denom))
    .sort((a, b) => {
      const aFiatPrice = a && fiatPrices[a.coingeckoId]?.usd;
      const bFiatPrice = b && fiatPrices[b.coingeckoId]?.usd;
      return aFiatPrice && bFiatPrice ? (aFiatPrice > bFiatPrice ? -1 : 1) : 0;
    });

  return (
    <Grid templateRows="repeat(1, 1fr)" templateColumns="repeat(3, 1fr)" gap={2}>
      <GridItem colSpan={1}>
        <Text fontSize="xs" noOfLines={1}>
          Balance
        </Text>
      </GridItem>
      <GridItem colSpan={1}>
        <Text textStyle="body-xs">Asset</Text>
      </GridItem>
      <GridItem colSpan={1}>
        <Text textStyle="body-xs">Fiat value</Text>
      </GridItem>
      <GridItem colSpan={3}>
        <Divider />
      </GridItem>
      {balances?.map((balance: Coin) => (
        <CoinBalanceWithFiat balance={balance} key={balance.denom} />
      ))}
    </Grid>
  );
}

export function SpendableBalances() {
  const { chainId } = useChainId();
  const { balances } = useBalances();
  const { getDenomById } = useDenoms([chainId]);
  const { fiatPrices } = useFiatPrices([chainId]);

  if (!fiatPrices || !balances) return null;

  const balancesInUsd = balances.map((balance) => {
    const denomInfo = getDenomById(balance.denom);
    const fiatPrice = fiatPrices[denomInfo?.coingeckoId ?? '']?.usd ?? 0;
    return {
      ...balance,
      fiatPrice,
      balanceInUsd: fiatPrice && denomInfo ? fromAtomic(denomInfo, Number(balance.amount)) * fiatPrice : 0,
      denomInfo,
    };
  });

  balancesInUsd.sort((a, b) => (a.balanceInUsd > b.balanceInUsd ? -1 : 1));

  return (
    <>
      <Grid templateRows="repeat(1, 1fr)" templateColumns="repeat(2, 1fr)" gap={2}>
        <GridItem colSpan={1}>
          <Text fontSize="xs" noOfLines={1}>
            Balance
          </Text>
        </GridItem>
        <GridItem colSpan={1}>
          <Text textStyle="body-xs" ml={4}>
            Asset
          </Text>
        </GridItem>
        <GridItem colSpan={2}>
          <Divider />
        </GridItem>
      </Grid>
      <Stack overflow="auto" maxH={220}>
        <Grid templateRows="repeat(1, 1fr)" templateColumns="repeat(3, 1fr)" gap={2}>
          {balancesInUsd
            .filter((balance) => balance?.denomInfo?.name !== balance?.denomInfo?.id)
            .map((balance: Coin) => (
              <CoinBalance balance={balance} key={balance.denom} />
            ))}
        </Grid>
      </Stack>
    </>
  );
}
