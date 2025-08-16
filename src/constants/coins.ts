import { Token } from "@/types";
import { hedera } from "viem/chains";

export const USDC = {
  name: "USDC",
  icon: "/crypto-icons/usdc.svg",
  decimals: 6,
  isNativeToken: false,
  chains: {
    [hedera.id]: "0x000000000000000000000000000000000006f89a",
  },
} as const satisfies Token;
