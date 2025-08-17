import { Token } from "@/types";
import { sepolia, hedera } from "viem/chains";

export const USDC = {
  name: "USDC",
  icon: "/crypto-icons/usdc.svg",
  decimals: 6,
  isNativeToken: false,
  chains: {
    [sepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    [hedera.id]: "0x000000000000000000000000000000000006f89a",
  },
} as const satisfies Token;
