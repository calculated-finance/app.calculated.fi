import { Box, Button, Heading, HStack, Image, Stack, Text } from '@chakra-ui/react';
import LinkWithQuery from '@components/LinkWithQuery';
import { getChainName } from '@helpers/chains';
import { useChainId } from '@hooks/useChainId';
import { ChainId } from '@models/ChainId';

const chainIcons: Record<ChainId, string> = {
  'osmosis-1': '/images/denoms/osmo.svg',
  'osmo-test-5': '/images/denoms/osmo.svg',
  'kaiyo-1': '/images/denoms/kuji.svg',
  'archway-1': '/images/denoms/archway.svg',
  'constantine-3': '/images/denoms/archway.svg',
  'neutron-1': '/images/denoms/neutron.svg',
  'pion-1': '/images/denoms/neutron.svg',
};

export default function RetirementNotice() {
  const { chainId } = useChainId();
  const chainName = getChainName(chainId);

  return (
    <Box layerStyle="panel" p={8}>
      <Stack spacing={8}>
        <HStack spacing={2}>
          <Image src={chainIcons[chainId]} alt={`${chainName} icon`} boxSize={6} />
          <Heading size="md">CALC is being retired on {chainName}</Heading>
        </HStack>
        <Stack spacing={1}>
          <Text fontSize="sm">New strategies, strategy changes, and additional deposits are disabled.</Text>
          <Text fontSize="sm" textStyle="body">
            Existing strategies remain visible. Connect the wallet that owns a strategy to review it and cancel it to
            recover its available vault balance.
          </Text>
        </Stack>
        <Stack direction={{ base: 'column', sm: 'row' }}>
          <LinkWithQuery href="/strategies" passHref>
            <Button as="a" px={9} size="sm" colorScheme="red">
              View and cancel my strategies
            </Button>
          </LinkWithQuery>
        </Stack>
      </Stack>
    </Box>
  );
}
