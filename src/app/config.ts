import { mainnet } from "viem/chains";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet],
  connectors: [injected()],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [mainnet.id]: http(),
  },
});
