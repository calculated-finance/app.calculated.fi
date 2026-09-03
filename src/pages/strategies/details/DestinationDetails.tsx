import { CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Heading,
  GridItem,
  Text,
  Badge,
  Button,
  Link as ChakraLink,
  Icon,
  useClipboard,
  useToast,
  Flex,
  Spinner,
  Code,
} from '@chakra-ui/react';
import { Strategy } from '@models/Strategy';
import { useWallet } from '@hooks/useWallet';
import { getMarsUrl } from '@helpers/chains';
import {
  getStrategyPostSwapType,
  getStrategyReinvestStrategyId,
  getStrategyValidatorAddress,
} from '@helpers/destinations';
import { PostPurchaseOptions } from '@models/PostPurchaseOptions';
import { generateStrategyConfigureUrl } from '@components/TopPanel/generateStrategyConfigureUrl';
import { getStrategyResultingDenom, isStrategyCancelled } from '@helpers/strategy';
import useStrategy from '@hooks/useStrategy';
import useValidator from '@hooks/useValidator';
import { HiOutlineCube } from 'react-icons/hi';
import LinkWithQuery from '@components/LinkWithQuery';
import { ChainId } from '@models/ChainId';
import { truncate } from '@helpers/truncate';
import { isChainRetired } from 'src/constants';

export function ConfigureButton({ strategy }: { strategy: Strategy }) {
  const isHidden = isStrategyCancelled(strategy) || isChainRetired(strategy.chainId);

  return (
    <GridItem visibility={isHidden ? 'hidden' : 'visible'}>
      <Flex justify="end">
        <LinkWithQuery href={generateStrategyConfigureUrl(strategy.id, strategy.chainId)}>
          <Button size="xs" variant="ghost" colorScheme="brand" leftIcon={<Icon fontSize="md" as={HiOutlineCube} />}>
            Configure
          </Button>
        </LinkWithQuery>
      </Flex>
    </GridItem>
  );
}

export function ReinvestDetails({ strategy }: { strategy: Strategy }) {
  const id = getStrategyReinvestStrategyId(strategy);
  const { data: reinvestStrategy } = useStrategy(id);
  const checkLoopedStrategy = reinvestStrategy && getStrategyReinvestStrategyId(reinvestStrategy);
  const isLooped = checkLoopedStrategy === strategy.id;

  return (
    <>
      <GridItem colSpan={1}>
        <Heading size="xs">{isLooped ? 'Looping into' : 'Reinvesting into'}</Heading>
      </GridItem>
      <GridItem colSpan={1}>
        {!reinvestStrategy ? (
          <Spinner size="xs" />
        ) : (
          <ChakraLink isExternal href={`/strategies/details/?id=${id}`}>
            <Text fontSize="sm" data-testid="strategy-receiving-address">
              <Code
                bg="abyss.200"
                fontSize="x-small"
                as={ChakraLink}
                color="blue.200"
                display={{ base: 'none', lg: 'contents' }}
              >
                {getStrategyResultingDenom(reinvestStrategy).name} Strategy | id: {id} <ExternalLinkIcon />
              </Code>
              <Code
                bg="abyss.200"
                fontSize="xx-small"
                as={ChakraLink}
                color="blue.200"
                display={{ base: 'contents', lg: 'none' }}
                whiteSpace="nowrap"
              >
                id: {id} <ExternalLinkIcon />
              </Code>
            </Text>
          </ChakraLink>
        )}
      </GridItem>
      <ConfigureButton strategy={strategy} />
    </>
  );
}

export function ValidatorDetails({ strategy }: { strategy: Strategy }) {
  const validatorAddress = getStrategyValidatorAddress(strategy);
  const { validator, isLoading } = useValidator(validatorAddress);

  return (
    <>
      <GridItem colSpan={1}>
        <Heading size="xs">Auto staking status</Heading>
      </GridItem>
      <GridItem colSpan={2} data-testid="strategy-auto-staking-status">
        <Badge colorScheme="green">Active</Badge>
      </GridItem>
      <GridItem colSpan={1}>
        <Heading size="xs">Validator name</Heading>
      </GridItem>
      <GridItem colSpan={1}>
        <Text fontSize="sm" data-testid="strategy-validator-name">
          {isLoading ? <Spinner size="sm" /> : validator?.description?.moniker}
        </Text>
      </GridItem>
      <ConfigureButton strategy={strategy} />
    </>
  );
}

export function DestinationDetails({ strategy, chainId }: { strategy: Strategy; chainId: ChainId }) {
  const { destinations } = strategy.rawData;

  const { address } = useWallet();

  const { onCopy } = useClipboard(destinations[0].address || '');
  const toast = useToast();

  const postSwapExecutionType = getStrategyPostSwapType(strategy, chainId);

  const handleCopy = () => {
    onCopy();
    toast({
      title: 'Address copied to clipboard',
      position: 'top',
      status: 'success',
      duration: 9000,
      isClosable: true,
      variant: 'subtle',
    });
  };

  if (postSwapExecutionType === PostPurchaseOptions.Stake) {
    return <ValidatorDetails strategy={strategy} />;
  }

  if (postSwapExecutionType === PostPurchaseOptions.GenerateYield) {
    return (
      <>
        <GridItem colSpan={1}>
          <Heading size="xs">Depositing to</Heading>
        </GridItem>
        <GridItem colSpan={1}>
          <ChakraLink isExternal href={getMarsUrl(chainId)}>
            <Text fontSize="sm">Mars</Text>
          </ChakraLink>
        </GridItem>
        <ConfigureButton strategy={strategy} />
      </>
    );
  }

  if (postSwapExecutionType === PostPurchaseOptions.Reinvest) {
    return <ReinvestDetails strategy={strategy} />;
  }

  if (destinations[0].address !== address) {
    return (
      <>
        <GridItem colSpan={1}>
          <Heading size="xs">Sending to </Heading>
        </GridItem>
        <GridItem colSpan={1}>
          <Button
            variant="link"
            colorScheme="blue"
            rightIcon={<Icon as={CopyIcon} />}
            fontSize="sm"
            data-testid="strategy-receiving-address"
            onClick={handleCopy}
          >
            {truncate(destinations[0].address)}
          </Button>
        </GridItem>
        <ConfigureButton strategy={strategy} />
      </>
    );
  }

  return (
    <>
      <GridItem colSpan={1}>
        <Heading size="xs">Post-swap action</Heading>
      </GridItem>
      <GridItem colSpan={1}>
        <Badge>None</Badge>
      </GridItem>
      <ConfigureButton strategy={strategy} />
    </>
  );
}
