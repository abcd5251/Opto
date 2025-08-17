import { useCallback, useMemo, useState } from "react";
import type { Address } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ERC20_ABI } from "@/constants/abis/erc20";
import { KITTY_ABI } from "@/constants/abis/kitty";
import { KITTY_CONTRACTS } from "@/constants/protocols/kitty";
import type { KittySupportedChains } from "@/constants/protocols/kitty";

export type ExecuteKittyParams = {
  chainId: number;
  user: Address;
  asset: Address; // token to approve
  amount: bigint; // in smallest units
};

export function useKitty() {
  const { writeContractAsync } = useWriteContract();

  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>();
  const [liquidityHash, setLiquidityHash] = useState<
    `0x${string}` | undefined
  >();
  const [error, setError] = useState<Error | null>(null);

  const approving = useMemo(
    () => !!approveHash && !liquidityHash,
    [approveHash, liquidityHash]
  );
  const pending = useMemo(
    () => approving || !!liquidityHash,
    [approving, liquidityHash]
  );

  const { data: approveReceipt } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: { enabled: !!approveHash },
  });
  const { data: liquidityReceipt } = useWaitForTransactionReceipt({
    hash: liquidityHash,
    query: { enabled: !!liquidityHash },
  });

  const execute = useCallback(
    async ({ chainId, user, asset, amount }: ExecuteKittyParams) => {
      setError(null);
      setApproveHash(undefined);
      setLiquidityHash(undefined);

      // Access with a widened index type to satisfy TS when chainId is number
      const kitty = (KITTY_CONTRACTS as Record<number, { kitty: Address }>)[
        chainId
      ]?.kitty as Address | undefined;
      if (!kitty) throw new Error(`Chain ${chainId} not supported by Kitty`);

      // 1) Approve token spend by Kitty contract
      const approveTx = await writeContractAsync({
        address: asset,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [kitty, amount],
      });
      setApproveHash(approveTx);

      // 2) Add liquidity after approval is mined
      // If you want to strictly wait, you can await receipt via viem client, but
      // here we optimistically proceed; dapp UIs typically also show the pending state
      const liqTx = await writeContractAsync({
        address: kitty,
        abi: KITTY_ABI,
        functionName: "add_liquidity",
        args: [[0n, amount], 0n, user],
      });
      setLiquidityHash(liqTx);

      return { approveTxHash: approveTx, addLiquidityTxHash: liqTx };
    },
    [writeContractAsync]
  );

  return {
    execute,
    approving,
    pending,
    approveHash,
    liquidityHash,
    approveReceipt,
    liquidityReceipt,
    error,
  };
}
