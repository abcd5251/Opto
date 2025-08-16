import { createConfig } from "@privy-io/wagmi";
import { hedera } from "viem/chains";
import { http } from "wagmi";

export const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export const wagmiConfig = createConfig({
  chains: [hedera],
  transports: {
    [hedera.id]: http(`https://mainnet.hashio.io/api`),
  },
});

// Create a mapped type for chain IDs from wagmiConfig.chains
export type SupportedChainIds = (typeof wagmiConfig.chains)[number]["id"];
