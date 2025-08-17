import { writeContract } from "@wagmi/core";
import type { Address } from "viem";

import { wagmiConfig as config } from "@/providers/config";
import { BaseStrategy } from "./base";
import { KITTY_ABI } from "@/constants/abis/kitty";
import { ERC20_ABI } from "@/constants/abis/erc20";
import {
  KITTY_CONTRACTS,
  KittySupportedChains,
} from "../constants/protocols/kitty";

export class KittyStrategy extends BaseStrategy<KittySupportedChains> {
  public readonly kitty: Address;

  constructor(chainId: number) {
    super(chainId);

    this.kitty = KITTY_CONTRACTS[this.chainId].kitty;
  }

  async execute(user: Address, asset: Address, amount: bigint) {
    await writeContract(config, {
      address: asset,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [this.kitty, amount],
    });

    const result = await writeContract(config, {
      address: this.kitty,
      abi: KITTY_ABI,
      functionName: "add_liquidity",
      args: [[BigInt(0), amount], BigInt(0), user],
    });

    console.log(result);

    return "Kitty strategy executed successfully";
  }

  isSupported(chainId: number): boolean {
    return Object.keys(KITTY_CONTRACTS).map(Number).includes(chainId);
  }
}
