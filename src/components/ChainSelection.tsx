import {
  Button,
  HStack,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useChainId } from '@hooks/useChainId';
import { ChainId } from '@models/ChainId';
import { useRouter } from 'next/router';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { OFFLINE_CHAINS } from 'src/constants';

const chainSelectionAllowedUrls = [
  '/',
  '/create-strategy',
  '/stats-and-totals',
  '/bridge-assets',
  '/how-it-works',
  '/learn-about-calc',
  '/experimental-features',
  '/create-strategy/streaming-swap/assets',
];

const imageMap = {
  'osmosis-1': '/images/denoms/osmo.svg',
  'osmo-test-5': '/images/denoms/osmo.svg',
  'kaiyo-1': '/images/denoms/kuji.svg',
  'archway-1': '/images/denoms/archway.svg',
  'constantine-3': '/images/denoms/archway.svg',
  'neutron-1': '/images/denoms/neutron.svg',
  'pion-1': '/images/denoms/neutron.svg',
};

export function ChainSelection() {
  const { isOpen, onClose } = useDisclosure();
  const { chainId, setChain } = useChainId();
  const router = useRouter();

  const chains = [
    { id: 'thorchain', name: 'Rujira', imageSrc: '/images/denoms/ruji.svg', isTestnet: false },
    { id: 'kaiyo-1', name: 'Kujira', imageSrc: '/images/denoms/kuji.svg', isTestnet: false },
    { id: 'osmosis-1', name: 'Osmosis', imageSrc: '/images/denoms/osmo.svg', isTestnet: false },
    { id: 'archway-1', name: 'Archway', imageSrc: '/images/denoms/archway.svg', isTestnet: false },
    { id: 'neutron-1', name: 'Neutron', imageSrc: '/images/denoms/neutron.svg', isTestnet: false },
    { id: 'osmo-test-5', name: 'Osmosis', imageSrc: '/images/denoms/osmo.svg', isTestnet: true },
    { id: 'constantine-3', name: 'Archway', imageSrc: '/images/denoms/archway.svg', isTestnet: true },
  ];

  const isChainSelectionAllowed = chainSelectionAllowedUrls.includes(router.pathname);

  return (
    <Menu>
      {isChainSelectionAllowed && (
        <MenuButton
          as={Button}
          variant="ghost"
          rightIcon={isOpen ? <Icon as={FiChevronUp} /> : <Icon as={FiChevronDown} />}
        >
          <Image src={imageMap[chainId]} w={5} />
        </MenuButton>
      )}
      <MenuList fontSize="sm">
        {chains
          .filter((chain) => !chain.isTestnet || process.env.NEXT_PUBLIC_APP_ENV !== 'production')
          .map((chain) =>
            chain.id === 'thorchain' ? (
              <MenuItemOption
                key={chain.id}
                _checked={{ bg: 'blue.500', color: 'navy' }}
                isChecked={false}
                onClick={() => {
                  window.open('https://rujira.network/trade/RUJI/USDC?order=recurring', '_blank');
                  onClose();
                }}
              >
                <HStack>
                  <Image src={chain.imageSrc} w={5} />
                  <Text>
                    {chain.name}
                    {chain.isTestnet ? ' (testnet)' : ''}
                  </Text>
                </HStack>
              </MenuItemOption>
            ) : (
              <MenuItemOption
                key={chain.id}
                _checked={{ bg: 'blue.500', color: 'navy' }}
                isChecked={chainId === chain.id}
                isDisabled={OFFLINE_CHAINS.includes(chain.id as ChainId)}
                onClick={() => {
                  if (OFFLINE_CHAINS.includes(chain.id as ChainId)) return;
                  setChain(chain.id as ChainId);
                  onClose();
                }}
              >
                <HStack>
                  <Image src={chain.imageSrc} w={5} />
                  <Text>
                    {chain.name}
                    {OFFLINE_CHAINS.includes(chain.id as ChainId) ? ' (offline)' : chain.isTestnet ? ' (testnet)' : ''}
                  </Text>
                </HStack>
              </MenuItemOption>
            ),
          )}
      </MenuList>
    </Menu>
  );
}
