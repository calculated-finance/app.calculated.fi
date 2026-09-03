import { Box, Button, Grid, GridItem, Heading, HStack, Icon, Image, Stack, Text, VStack } from '@chakra-ui/react';
import { getSidebarLayout } from '@components/Layout';
import LinkWithQuery from '@components/LinkWithQuery';
import RetirementNotice from '@components/RetirementNotice';
import SimpleDcaIn from '@components/SimpleDcaInForm';
import { KnowledgeIcon } from '@fusion-icons/react/interface';
import { useChainId } from '@hooks/useChainId';
import { isChainRetired, OSMOSIS_CHAINS } from 'src/constants';

function RujiraPanel() {
  return (
    <Box layerStyle="panel" p={8} h="full">
      <Stack spacing={8}>
        <HStack spacing={2}>
          <Image src="/images/denoms/ruji.svg" w={6} h={6} />
          <Heading size="md">Try CALC on Rujira</Heading>
        </HStack>
        <Stack spacing={1}>
          <Text fontSize="sm">Start a cross-chain DCA strategy on Rujira using Thorchain secured assets.</Text>
          <Text fontSize="sm" textStyle="body">
            Native BTC, ETH, AVAX, USDC, USDT, and many more...
          </Text>
        </Stack>
        <Stack direction={{ base: 'column', sm: 'row' }}>
          <Button
            as="a"
            href="https://rujira.network/trade/RUJI/USDC?order=recurring"
            target="_blank"
            rel="noreferrer"
            px={9}
            size="sm"
            bgColor="blue.200"
            _hover={{ bgColor: 'blue.300' }}
          >
            Start trading Cross Chain
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export function LearnAboutCalcPanel() {
  return (
    <Box
      layerStyle="panel"
      p={8}
      h="full"
      backgroundImage="/images/backgrounds/twist-thin-blue.svg"
      backgroundSize="cover"
    >
      <VStack alignItems="left" spacing={8}>
        <HStack>
          <Icon as={KnowledgeIcon} stroke="blue.200" strokeWidth={5} w={6} h={6} />
          <Heading size="md">New to CALC?</Heading>
        </HStack>
        <Stack spacing={1}>
          <Text fontSize="sm">
            Find out why people are raving about their experiences leveraging CALC to make smarter swaps.
          </Text>
          <Text fontSize="sm" textStyle="body">
            DCA | DCA+ | Weighted Scale
          </Text>
        </Stack>
        <Stack direction={{ base: 'column', sm: 'row' }}>
          <LinkWithQuery passHref href="/learn-about-calc">
            <Button px={12} maxWidth={402} size="sm" bgColor="blue.200" _hover={{ bgColor: 'blue.300' }}>
              Learn how CALC works
            </Button>
          </LinkWithQuery>
        </Stack>
      </VStack>
    </Box>
  );
}

function Home() {
  const { chainId } = useChainId();
  const chainIsRetired = isChainRetired(chainId);
  const showOsmosisForm = OSMOSIS_CHAINS.includes(chainId);

  return (
    <>
      <Box pb={8}>
        <Heading size="lg" mb={2}>
          Welcome to CALC
        </Heading>
        <Text textStyle="body">
          {chainIsRetired
            ? 'Manage and recover funds from your existing CALC strategies.'
            : 'Define your strategy up front, and leave the rest to CALC.'}
        </Text>
      </Box>

      {chainIsRetired && <RetirementNotice />}

      <Grid gap={4} mt={chainIsRetired ? 8 : 0} templateColumns="repeat(10, 1fr)" alignItems="stretch">
        {showOsmosisForm && (
          <GridItem colSpan={[10, 10, 10, 10, 5, 5]} rowSpan={2}>
            <SimpleDcaIn />
          </GridItem>
        )}
        <GridItem colSpan={[10, 10, 10, 10, 5, 5]}>
          <RujiraPanel />
        </GridItem>
        <GridItem colSpan={[10, 10, 10, 10, 5, 5]}>
          <LearnAboutCalcPanel />
        </GridItem>
      </Grid>
    </>
  );
}

Home.getLayout = getSidebarLayout;

export default Home;
