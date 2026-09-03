import { MainWalletBase } from '@cosmos-kit/core';
import { wallets as keplrWallets } from '@cosmos-kit/keplr';
import { wallets as leapWallets } from '@cosmos-kit/leap';
import { ChainProvider as CosmosKitChainProvider } from '@cosmos-kit/react';
import { wallets as xdefiWallets } from '@cosmos-kit/xdefi';
import { getChainId, getGasPrice } from '@helpers/chains';
import { ChildrenProp } from '@helpers/ChildrenProp';
import { Keplr, Window as KeplrWindow } from '@keplr-wallet/types';
import { ChainId } from '@models/ChainId';
import { assets, chains } from 'chain-registry';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import {
  ARCHWAY_MAINNET_RPC,
  ARCHWAY_TESTNET_RPC,
  CHAINS,
  MAINNET_CHAINS,
  NEUTRON_MAINNET_RPC,
  OSMOSIS_MAINNET_RPC,
  OSMOSIS_TESTNET_RPC,
} from 'src/constants';

declare global {
  interface Window extends KeplrWindow {
    xfi: { keplr: Keplr };
    leap: any;
    keplr: any;
  }
}

export function ChainProvider({ children }: ChildrenProp) {
  const [wallets, setWallets] = useState<MainWalletBase[]>([]);

  useEffect(() => {
    setWallets(
      [...(window.leap || isMobile ? leapWallets : []), ...keplrWallets, ...(window.xfi ? xdefiWallets : [])].filter(
        (wallet) => (isMobile ? !wallet.isModeExtension : wallet.isModeExtension),
      ),
    );
  }, []);

  const supportedChains = chains.filter((chain) =>
    (process.env.NEXT_PUBLIC_APP_ENV === 'production' ? MAINNET_CHAINS : CHAINS).includes(chain.chain_id as ChainId),
  );

  return wallets.length > 0 ? (
    <CosmosKitChainProvider
      chains={supportedChains}
      assetLists={assets}
      wallets={wallets}
      endpointOptions={{
        isLazy: true,
        endpoints: {
          osmosis: {
            rpc: [OSMOSIS_MAINNET_RPC],
          },
          archway: {
            rpc: [ARCHWAY_MAINNET_RPC],
          },
          neutron: {
            rpc: [NEUTRON_MAINNET_RPC],
          },
          ...(process.env.NEXT_PUBLIC_APP_ENV !== 'production'
            ? {
                osmosistestnet: {
                  rpc: [OSMOSIS_TESTNET_RPC],
                },
                archwaytestnet: {
                  rpc: [ARCHWAY_TESTNET_RPC],
                },
              }
            : {}),
        },
      }}
      throwErrors={false}
      signerOptions={{
        signingCosmwasm: (chain) =>
          ({
            gasPrice: getGasPrice(getChainId(typeof chain === 'string' ? chain : chain.chain_name) as ChainId),
          } as any),
      }}
      walletConnectOptions={{
        signClient: {
          projectId: '50fa0187387c8c2f72d360c6ba9f3333',
          relayUrl: 'wss://relay.walletconnect.org',
          metadata: {
            name: 'Calculated Finance',
            description: 'Calculated Finance',
            icons: [],
            url: 'https://app.calculated.fi',
          },
        },
      }}
    >
      {children}
    </CosmosKitChainProvider>
  ) : null;
}
