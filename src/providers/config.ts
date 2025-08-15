import { createConfig } from "@privy-io/wagmi";
import { hedera, hederaTestnet } from "viem/chains";
import { http } from "wagmi";

export const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export const wagmiConfig = createConfig({
  chains: [hedera, hederaTestnet],
  transports: {
    [hedera.id]: http(`https://mainnet.hedera.com`),
    [hederaTestnet.id]: http(`https://testnet.hedera.com`),
  },
});

// Create a mapped type for chain IDs from wagmiConfig.chains
export type SupportedChainIds = (typeof wagmiConfig.chains)[number]["id"];
