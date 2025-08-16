import { createConfig } from "@privy-io/wagmi";
import { sepolia } from "viem/chains";
import { http } from "wagmi";

export const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    ),
  },
});

// Create a mapped type for chain IDs from wagmiConfig.chains
export type SupportedChainIds = (typeof wagmiConfig.chains)[number]["id"];
