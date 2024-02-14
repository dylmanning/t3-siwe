"use client";

import type { ReactNode } from "react";

import { type State, WagmiProvider } from "wagmi";

import { TRPCReactProvider } from "~/trpc/react";

import { config } from "./config";
import { SessionProvider } from "next-auth/react";

type Props = {
  children: ReactNode;
  initialState?: State;
};

export default function Providers({ children, initialState }: Props) {
  return (
    <TRPCReactProvider>
      <WagmiProvider config={config} initialState={initialState}>
        <SessionProvider>{children}</SessionProvider>
      </WagmiProvider>
    </TRPCReactProvider>
  );
}
