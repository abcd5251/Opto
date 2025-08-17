import { Address } from "viem";

export abstract class BaseStrategy<T extends number> {
  public readonly chainId: T;

  constructor(chainId: number) {
    if (!this.isSupported(chainId)) {
      throw new Error("Chain not supported");
    } else {
      this.chainId = chainId as T;
    }
  }

  abstract execute(
    user: Address,
    asset: Address,
    amount: bigint
  ): Promise<string>;

  abstract isSupported(chainId: number): boolean;
}
