import { Center, ChakraProvider, Heading, Image, Text } from '@chakra-ui/react';
import { AgreementAcceptanceDetector } from '@components/AgreementAcceptanceDetector';
import { ChainProvider } from '@components/ChainProvider';
import { getSidebarLayout } from '@components/Layout';
import RetirementNotice from '@components/RetirementNotice';
import { ToastContainer } from '@components/ToastContainer';
import '@fontsource/karla';
import { useChainId } from '@hooks/useChainId';
import '@interchain-ui/react/styles';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactElement, ReactNode } from 'react';
import { isChainRetired, RETIRED_ROUTE_PREFIXES } from 'src/constants';
import theme from 'src/theme';
import { queryClient } from './queryClient';

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

Sentry.init({
  dsn: 'https://c9fd7738c4244fbba9ece76de612785b@o4505139619364864.ingest.sentry.io/4505140076281856',
  integrations: [],
  environment: process.env.NODE_ENV,
  enabled: process.env.NEXT_PUBLIC_APP_ENV === 'production',
});

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const { chainId } = useChainId();
  const { pathname } = useRouter();
  const isRetiredRoute =
    isChainRetired(chainId) && RETIRED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const getLayout = isRetiredRoute ? getSidebarLayout : Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <title>CALC - Calculated Finance</title>
      </Head>
      <ChakraProvider theme={theme}>
        <Sentry.ErrorBoundary
          beforeCapture={(scope) => {
            scope.setTag('location', 'error boundary');
            scope.setTag('chain', chainId);
          }}
          fallback={
            <Center m={8} layerStyle="panel" p={8} flexDirection="column" gap={6}>
              <Heading size="lg">Something went wrong</Heading>
              <Image w={28} h={28} src="/images/notConnected.png" />
              <Text>Please try again in a new session</Text>
            </Center>
          }
        >
          <ChainProvider>
            <QueryClientProvider client={queryClient}>
              {getLayout(isRetiredRoute ? <RetirementNotice /> : <Component {...pageProps} />)}
              <AgreementAcceptanceDetector />
            </QueryClientProvider>
            <ToastContainer />
          </ChainProvider>
        </Sentry.ErrorBoundary>
      </ChakraProvider>
    </>
  );
}

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export default MyApp;
