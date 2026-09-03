import { Button, Flex, Grid, GridItem, Heading, HStack, Image, Stack, Text, useDisclosure } from '@chakra-ui/react';
import { PlusSquareIcon } from '@chakra-ui/icons';
import Icon from '@components/Icon';
import { ArrowRightIcon, CloseBoxedIcon } from '@fusion-icons/react/interface';
import { invalidateStrategies } from '@hooks/useStrategies';
import { Strategy } from '@models/Strategy';

import {
  getStrategyExecutionInterval,
  getStrategyName,
  getStrategyType,
  getSwapAmount,
  isStrategyCancelled,
} from '@helpers/strategy';
import { isDcaPlus } from '@helpers/strategy/isDcaPlus';
import { fromAtomic } from '@utils/getDenomInfo';
import React from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { isChainRetired } from 'src/constants';
import CancelStrategyModal from './CancelStrategyModal';
import DenomIcon from './DenomIcon';
import LinkWithQuery from './LinkWithQuery';
import { StrategyStatusBadge } from './StrategyStatusBadge';
import { generateStrategyDetailUrl } from './TopPanel/generateStrategyDetailUrl';
import { generateStrategyTopUpUrl } from './TopPanel/generateStrategyTopUpUrl';

function CancelButton({ strategy }: { strategy: Strategy }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    onOpen();
  };

  return (
    <>
      <Button
        pointerEvents="auto"
        size="xs"
        variant={{ base: 'outline', sm: 'ghost' }}
        colorScheme="red"
        leftIcon={<Icon as={CloseBoxedIcon} stroke="red.200" width={4} height={4} />}
        onClick={handleClick}
        width={{ base: 'full', xl: 'initial' }}
      >
        Cancel
      </Button>
      <CancelStrategyModal isOpen={isOpen} onClose={onClose} onCancel={invalidateStrategies} strategy={strategy} />
    </>
  );
}

const imageMap = {
  'osmosis-1': '/images/denoms/osmo.svg',
  'osmo-test-5': '/images/denoms/osmo.svg',
  'kaiyo-1': '/images/denoms/kuji.svg',
  'archway-1': '/images/denoms/archway.svg',
  'constantine-3': '/images/denoms/archway.svg',
  'neutron-1': '/images/denoms/neutron.svg',
  'pion-1': '/images/denoms/neutron.svg',
};

function StrategyRow({ strategy }: { strategy: Strategy }) {
  const { initialDenom, resultingDenom } = strategy;

  return (
    <LinkWithQuery href={generateStrategyDetailUrl(strategy.id, strategy.chainId)}>
      <Grid
        templateRows="repeat(1, 1fr)"
        templateColumns="repeat(15, 1fr)"
        rowGap={6}
        columnGap={2}
        bg="gray.900"
        py={4}
        px={8}
        layerStyle="panel"
        borderWidth={isDcaPlus(strategy) ? 1 : 0}
        borderColor="brand.200"
        _hover={{ cursor: 'pointer', bg: 'abyss.200' }}
      >
        <GridItem colSpan={{ base: 15, sm: 8, xl: 4 }} rowStart={{ base: 1, sm: 1, xl: 'auto' }}>
          <HStack>
            <Image src={imageMap[strategy.chainId]} w={4} />
            <Heading size="md">{strategy.rawData.label || getStrategyType(strategy)}</Heading>
          </HStack>
          <Text textStyle="body-xs"> {getStrategyName(strategy)}</Text>
        </GridItem>
        <GridItem colSpan={{ base: 7, sm: 4, xl: 2 }}>
          <Text fontSize="sm" pb={1}>
            Assets:
          </Text>
          <HStack spacing={1}>
            <DenomIcon showTooltip denomInfo={initialDenom} />
            <Icon as={ArrowRightIcon} stroke="grey" />
            <DenomIcon showTooltip denomInfo={resultingDenom} />
          </HStack>
        </GridItem>
        <GridItem colSpan={{ base: 8, sm: 3, xl: 2 }}>
          <Text fontSize="sm">Status:</Text>
          <StrategyStatusBadge strategy={strategy} />
        </GridItem>
        <GridItem colSpan={{ base: 7, sm: 4, xl: 2 }}>
          <Text fontSize="sm">Interval:</Text>
          <Text textStyle="body-xs">
            <Text as="span">{getStrategyExecutionInterval(strategy)}</Text>:{' '}
            {fromAtomic(strategy.initialDenom, getSwapAmount(strategy))} {initialDenom.name}
          </Text>
        </GridItem>
        <GridItem colSpan={{ base: 7, sm: 4, xl: 2 }}>
          <Text fontSize="sm">Balance:</Text>
          <Text textStyle="body-xs">
            {fromAtomic(strategy.initialDenom, Number(strategy.rawData.balance.amount))} {initialDenom.name}
          </Text>
        </GridItem>
        <GridItem
          visibility={isStrategyCancelled(strategy) ? 'hidden' : 'visible'}
          colSpan={{ base: 15, sm: 7, xl: 1 }}
          rowStart={{ base: 0, sm: 1, xl: 'auto' }}
        >
          <Flex justifyContent={{ base: 'left', sm: 'end' }} alignItems="center" h="full">
            <Stack direction={{ base: 'column', sm: 'row' }} w="full">
              {!isChainRetired(strategy.chainId) && (
                <LinkWithQuery href={generateStrategyTopUpUrl(strategy.id, strategy.chainId)}>
                  <Button
                    size="xs"
                    variant={{ base: 'outline', sm: 'ghost' }}
                    leftIcon={<Icon as={PlusSquareIcon} stroke="brand.200" width={4} height={4} />}
                    width={{ base: 'full', xl: 'initial' }}
                  >
                    Top up
                  </Button>
                </LinkWithQuery>
              )}
              <CancelButton strategy={strategy} />
            </Stack>
          </Flex>
        </GridItem>
        <GridItem colSpan={{ base: 15, sm: 15, xl: 2 }}>
          <Flex justifyContent="end" alignItems="center" h="full">
            <LinkWithQuery href={generateStrategyDetailUrl(strategy.id, strategy.chainId)}>
              <Button width={{ base: 'full', xl: 'initial' }}>
                <HStack>
                  <Text>View</Text>
                  <FiExternalLink />
                </HStack>
              </Button>
            </LinkWithQuery>
          </Flex>
        </GridItem>
      </Grid>
    </LinkWithQuery>
  );
}

export default StrategyRow;
