import { GasPrice } from '@cosmjs/stargate';
import { ChainId } from '@models/ChainId';
import {
  ARCHWAY_MAINNET_RPC,
  ARCHWAY_TESTNET_RPC,
  COSMOS_KIT_ARCHWAY_MAINNET,
  COSMOS_KIT_ARCHWAY_TESTNET,
  COSMOS_KIT_KUJIRA_MAINNET,
  COSMOS_KIT_NEUTRON_MAINNET,
  COSMOS_KIT_NEUTRON_TESTNET,
  COSMOS_KIT_OSMOSIS_MAINNET,
  COSMOS_KIT_OSMOSIS_TESTNET,
  NEUTRON_MAINNET_RPC,
  OSMOSIS_MAINNET_RPC,
  OSMOSIS_TESTNET_RPC,
} from 'src/constants';

export function getGasPrice(chain: ChainId) {
  return GasPrice.fromString(
    {
      'osmosis-1': '0.004uosmo',
      'osmo-test-5': '0.004uosmo',
      'kaiyo-1': '0.004ukuji',
      'archway-1': '140000000000aarch',
      'constantine-3': '140000000000aconst',
      'neutron-1': '0.0053untrn',
      'pion-1': '0.004untrn',
    }[chain],
  );
}

export function getChainEndpoint(chain: ChainId): string {
  if (chain === 'kaiyo-1') {
    throw new Error('Kujira is offline');
  }

  if (chain === 'pion-1') {
    throw new Error('Neutron Pion testnet has been decommissioned');
  }

  return {
    'osmosis-1': OSMOSIS_MAINNET_RPC,
    'osmo-test-5': OSMOSIS_TESTNET_RPC,
    'archway-1': ARCHWAY_MAINNET_RPC,
    'constantine-3': ARCHWAY_TESTNET_RPC,
    'neutron-1': NEUTRON_MAINNET_RPC,
  }[chain];
}

export function getDCAContractAddress(chainId: ChainId) {
  return {
    'osmosis-1': 'osmo1zacxlu90sl6j2zf90uctpddhfmux84ryrw794ywnlcwx2zeh5a4q67qtc9',
    'osmo-test-5': 'osmo1sk0qr7kljlsas09tn8lgh4zfcskwx76p4gypmwtklq2883pun3gs8rhs7f',
    'kaiyo-1': 'kujira1e6fjnq7q20sh9cca76wdkfg69esha5zn53jjewrtjgm4nktk824stzyysu',
    'archway-1': 'archway1delmknshmvfuhv07uetes90crzrj32za23pgd9cvjtc5mrzfjauq3jqrpa',
    'constantine-3': 'archway1p0w6hpxhcdxvhl6r02wslqgjhrtq60ljs4tky6da2s6ncpha0v0s2s2f6r',
    'neutron-1': 'neutron1cc5adah6vekm2nz5yp6qs332g704q90jgc03v8zxpzaqh297jvqqae2eez',
    'pion-1': 'neutron1taf86htl6uymn2dvy8yyje6rh926aesuqadg86m7kd925sapd3fqw2wkvj',
  }[chainId];
}

export function getAutoCompoundStakingRewardsAddress(chainId: ChainId): string {
  return {
    'osmosis-1': 'osmo1xqr6ew6x4qkxe832hhjmfpu9du9vnkhx626kj2',
    'osmo-test-5': 'osmo1xqr6ew6x4qkxe832hhjmfpu9du9vnkhx626kj2',
    'kaiyo-1': 'kujira1xqr6ew6x4qkxe832hhjmfpu9du9vnkhxret7fj',
    'archway-1': '',
    'constantine-3': '',
    'neutron-1': '',
    'pion-1': '',
  }[chainId];
}

export function getFeeTakerAddress(chainId: ChainId) {
  return {
    'osmosis-1': 'osmo1263dq8542dgacr5txhdrmtxpup6px7g7tteest',
    'osmo-test-5': 'osmo1263dq8542dgacr5txhdrmtxpup6px7g7tteest',
    'kaiyo-1': 'kujira1vq6vrr4nu0w4mmu36pkznzqddmdlf4r5w3qpxy',
    'archway-1': 'archway15ads3d0eve59f8nhtyyckv9t2r3zxsmj6nrz6h',
    'constantine-3': 'archway15ads3d0eve59f8nhtyyckv9t2r3zxsmj6nrz6h',
    'neutron-1': 'neutron1vrzedty5989ydkthh4t99979lc256zyklpuymw',
    'pion-1': 'neutron1vrzedty5989ydkthh4t99979lc256zyklpuymw',
  }[chainId];
}

export function getChainCosmosName(chainId: ChainId) {
  return {
    'osmosis-1': COSMOS_KIT_OSMOSIS_MAINNET,
    'osmo-test-5': COSMOS_KIT_OSMOSIS_TESTNET,
    'kaiyo-1': COSMOS_KIT_KUJIRA_MAINNET,
    'archway-1': COSMOS_KIT_ARCHWAY_MAINNET,
    'constantine-3': COSMOS_KIT_ARCHWAY_TESTNET,
    'neutron-1': COSMOS_KIT_NEUTRON_MAINNET,
    'pion-1': COSMOS_KIT_NEUTRON_TESTNET,
  }[chainId];
}

export function getChainId(chainName: string) {
  return {
    osmosis: 'osmosis-1',
    osmosistestnet: 'osmo-test-5',
    kujira: 'kaiyo-1',
    archway: 'archway-1',
    archwaytestnet: 'constantine-3',
    neutron: 'neutron-1',
    neutrontestnet: 'pion-1',
  }[chainName];
}

export function getChainDexName(chainId: ChainId) {
  return {
    'osmosis-1': 'Osmosis',
    'osmo-test-5': 'Osmosis',
    'kaiyo-1': 'FIN',
    'archway-1': 'Astrovault',
    'constantine-3': 'Astrovault',
    'neutron-1': 'Astroport',
    'pion-1': 'Astroport',
  }[chainId];
}

export function getChainName(chainId: ChainId) {
  return {
    'osmosis-1': 'Osmosis',
    'osmo-test-5': 'Osmosis',
    'kaiyo-1': 'Kujira',
    'archway-1': 'Archway',
    'constantine-3': 'Archway',
    'neutron-1': 'Neutron',
    'pion-1': 'Neutron',
  }[chainId];
}

export function getAddressPrefix(chainId: ChainId) {
  return {
    'osmosis-1': 'osmo',
    'osmo-test-5': 'osmo',
    'kaiyo-1': 'kujira',
    'archway-1': 'archway',
    'constantine-3': 'archway',
    'neutron-1': 'neutron',
    'pion-1': 'neutron',
  }[chainId];
}

export function getChainMinimumSwapValue(chainId: ChainId) {
  return (
    {
      'kaiyo-1': 25.0,
      'archway-1': 35.0,
      'neutron-1': 10.0,
    }[chainId as string] ?? 1.0
  );
}

export function getChainAddressLength(chainId: ChainId) {
  return {
    'osmosis-1': [43, 63],
    'osmo-test-5': [43, 63],
    'kaiyo-1': [45, 65],
    'archway-1': [46, 66],
    'constantine-3': [46, 66],
    'neutron-1': [46, 66],
    'pion-1': [46, 66],
  }[chainId];
}

export function getStrategiesFetchLimit(chainId: ChainId) {
  return (
    {
      'osmosis-1': process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 1000 : 100,
    }[chainId as string] ?? 100
  );
}

export function getEventsFetchLimit(chainId: ChainId) {
  return (
    {
      'osmosis-1': process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 1000 : 200,
    }[chainId as string] ?? 200
  );
}

export function getPairsFetchLimit(chainId: ChainId) {
  return (
    {
      'osmosis-1': process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 1000 : 200,
    }[chainId as string] ?? 200
  );
}

export function getOsmosisWebUrl(chainId: ChainId) {
  return {
    'osmosis-1': 'https://app.osmosis.zone',
    'osmo-test-5': 'https://testnet.osmosis.zone',
  }[chainId as string];
}

export function getOsmosisRouterUrl(chainId: ChainId) {
  return {
    'osmosis-1': 'https://sqs.osmosis.zone',
    'osmo-test-5': 'https://sqs.testnet.osmosis.zone',
  }[chainId as string];
}

export function getRedBankAddress(chainId: ChainId) {
  return {
    'osmosis-1': 'osmo1c3ljch9dfw5kf52nfwpxd2zmj2ese7agnx0p9tenkrryasrle5sqf3ftpg',
    'osmo-test-5': 'osmo1dl4rylasnd7mtfzlkdqn2gr0ss4gvyykpvr6d7t5ylzf6z535n9s5jjt8u',
  }[chainId as string];
}

export function getMarsParamsAddress(chainId: ChainId) {
  return {
    'osmosis-1': 'osmo1nlmdxt9ctql2jr47qd4fpgzg84cjswxyw6q99u4y4u4q6c2f5ksq7ysent',
    'osmo-test-5': 'osmo1h334tvddn82m4apm08rm9k6kt32ws7vy0c4n30ngrvu6h6yxh8eq9l9jfh',
  }[chainId as string];
}

export function getMarsUrl(chainId: ChainId) {
  return {
    'osmosis-1': 'https://mars.osmosis.zone',
    'osmo-test-5': 'https://testnet-osmosis.marsprotocol.io/',
  }[chainId as string];
}

export function getNeutronApiUrl(chainId: ChainId) {
  return {
    'neutron-1': 'https://app.astroport.fi',
    'pion-1': 'https://testnet.astroport.fi',
  }[chainId as string];
}

export type ChainConfig = {
  id: ChainId;
  contractAddress: string;
  feeTakerAddress: string;
  autoCompoundStakingRewardsAddress: string;
};

export function getChainConfig(chainId: ChainId | undefined) {
  if (!chainId) {
    return undefined;
  }
  return {
    id: chainId,
    contractAddress: getDCAContractAddress(chainId),
    feeTakerAddress: getFeeTakerAddress(chainId),
    autoCompoundStakingRewardsAddress: getAutoCompoundStakingRewardsAddress(chainId),
  };
}
