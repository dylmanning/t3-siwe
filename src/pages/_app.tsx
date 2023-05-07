import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { WagmiConfig, createClient, configureChains } from "wagmi";
import { mainnet, goerli } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

import { api } from "y/utils/api";

import "y/styles/globals.css";

export const { chains, provider } = configureChains(
  [mainnet, goerli],
  [publicProvider()]
);

const client = createClient({
  autoConnect: true,
  provider,
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <WagmiConfig client={client}>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </WagmiConfig>
  );
};

export default api.withTRPC(MyApp);
