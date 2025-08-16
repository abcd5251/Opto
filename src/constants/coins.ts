import { Token } from "@/types";
import { sepolia, hedera } from "viem/chains";

export const USDC = {
  name: "USDC",
  icon: "/crypto-icons/usdc.svg",
  decimals: 6,
  isNativeToken: false,
  chains: {
    [sepolia.id]: "0x000000000000000000000000000000000006f89a",
    [hedera.id]: "0x000000000000000000000000000000000006f89a",
  },
} as const satisfies Token;
