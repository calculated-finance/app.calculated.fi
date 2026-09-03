import { Alert, AlertIcon, Flex, Heading, Text } from '@chakra-ui/react';
import Spinner from '@components/Spinner';
import { useWallet } from '@hooks/useWallet';
import { getSidebarLayout } from '@components/Layout';
import ConnectWallet from '@components/ConnectWallet';
import {
  StrategyAccordionItem,
  StrategiesAccordionButton,
  StrategyAccordionPanel,
  StrategyAccordion,
} from '@components/StrategyAccordion';
import { useStrategies } from '@hooks/useStrategies';
import { StrategyList } from './StrategyList';
import { sortAndCategorizeStrategies } from './sortAndCategorizeStrategies';

function StrategyAccordions() {
  const { data: strategies, isLoading } = useStrategies();
  const { active, scheduled, completed, cancelled } = sortAndCategorizeStrategies(strategies);

  return (
    <StrategyAccordion>
      <StrategyAccordionItem>
        <StrategiesAccordionButton>
          <Heading pb={2} size="md">
            Active Strategies ({active.length || 0})
          </Heading>
          <Text pb={2} textStyle="body">
            Strategies actively swapping.
          </Text>
        </StrategiesAccordionButton>
        <StrategyAccordionPanel>
          {!active.length ? (
            <Flex bg="gray.900" justifyContent="center" py={8} px={4} layerStyle="panel">
              {isLoading ? <Spinner /> : <Text>No active strategies</Text>}
            </Flex>
          ) : (
            <StrategyList strategies={active} />
          )}
        </StrategyAccordionPanel>
      </StrategyAccordionItem>
      {Boolean(scheduled.length) && (
        <StrategyAccordionItem>
          <StrategiesAccordionButton>
            <Heading pb={2} size="md">
              Scheduled Strategies ({scheduled.length})
            </Heading>
            <Text pb={2} textStyle="body">
              Strategies with triggers that are waiting to be executed.
            </Text>
          </StrategiesAccordionButton>
          <StrategyAccordionPanel>
            {!scheduled.length ? (
              <Flex bg="gray.900" justifyContent="center" py={8} px={4} layerStyle="panel">
                {isLoading ? <Spinner /> : <Text>No scheduled strategies</Text>}
              </Flex>
            ) : (
              <StrategyList strategies={scheduled} />
            )}
          </StrategyAccordionPanel>
        </StrategyAccordionItem>
      )}
      <StrategyAccordionItem>
        <StrategiesAccordionButton>
          <Heading size="md" pb={2}>
            Completed Strategies ({completed.length})
          </Heading>
          <Text pb={2} textStyle="body">
            Strategies that have fully executed their swaps.
          </Text>
        </StrategiesAccordionButton>
        <StrategyAccordionPanel>
          {!completed.length ? (
            <Flex bg="gray.900" justifyContent="center" py={8} px={4} layerStyle="panel">
              {isLoading ? <Spinner /> : <Text>No completed strategies</Text>}
            </Flex>
          ) : (
            <StrategyList strategies={completed} />
          )}
        </StrategyAccordionPanel>
      </StrategyAccordionItem>
      <StrategyAccordionItem>
        <StrategiesAccordionButton>
          <Heading size="md" pb={2}>
            Cancelled Strategies ({cancelled.length})
          </Heading>
          <Text pb={2} textStyle="body">
            Strategies that have been closed, and the funds returned.
          </Text>
        </StrategiesAccordionButton>
        <StrategyAccordionPanel>
          {!cancelled.length ? (
            <Flex bg="gray.900" justifyContent="center" py={8} px={4} layerStyle="panel">
              {isLoading ? <Spinner /> : <Text>No cancelled strategies</Text>}
            </Flex>
          ) : (
            <StrategyList strategies={cancelled} />
          )}
        </StrategyAccordionPanel>
      </StrategyAccordionItem>
    </StrategyAccordion>
  );
}

function Page() {
  const { connected } = useWallet();

  return (
    <>
      <Heading size="lg" pb={12}>
        My CALC Strategies
      </Heading>

      <Alert status="warning" mb={8} borderRadius="xl">
        <AlertIcon />
        <Text>
          CALC is retired on Archway and Neutron. Kujira is offline. Cancel available Archway or Neutron strategies to
          recover their balance. Osmosis remains active.
        </Text>
      </Alert>

      {!connected ? <ConnectWallet layerStyle="panel" /> : <StrategyAccordions />}
    </>
  );
}

Page.getLayout = getSidebarLayout;

export default Page;
