import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FormEvent, useState } from "react";
import { USDC, ETH } from "@/constants/coins";
import { MoonLoader } from "react-spinners";
import { Token } from "@/types";
import { useChainId, useBalance } from "wagmi";
import { formatUnits } from "viem";

export default function InvestmentForm({
  onSubmit,
}: {
  onSubmit: (amount: string, currency: Token) => void;
}) {
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Token>(ETH);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onSubmit(amount, currency);
  };

  return (
    <form onSubmit={handleSubmit}>
      <AmountInput
        amount={amount}
        setAmount={setAmount}
        currency={currency}
        setCurrency={setCurrency}
      />
    </form>
  );
}

interface AmountInputProps {
  amount: string;
  setAmount: (amount: string) => void;
  currency: Token;
  setCurrency: (currency: Token) => void;
}

const AmountInput = ({
  amount,
  setAmount,
  currency,
  setCurrency,
}: AmountInputProps) => {
  const chainId = useChainId();

  const {
    data,
    isError,
    isLoading: isLoadingBalance,
  } = useBalance({
    address: currency.chains![chainId],
  });

  const handleCurrencyChange = (value: string | Token) => {
    if (typeof value === "string") {
      const found = [ETH, USDC].find((t) => t.name === value);
      if (found) setCurrency(found);
    } else {
      setCurrency(value);
    }
  };

  const handleSetMax = () => {
    setAmount(formatUnits(data!.value!, currency.decimals));
  };

  const formatAmount = (amount: number, fixed: number = 2) => {
    if (amount === 0) return "0";
    if (amount < 0.01) {
      return "<0.01";
    }
    return `${Number(amount.toFixed(fixed))}`;
  };

  return (
    <div>
      <div className="bg-gray-100 rounded-md border border-gray-300">
        <div className="flex items-center w-full gap-2">
          <input
            type="text"
            name="amount"
            id="amount"
            className="flex-1 min-w-0 bg-transparent text-gray-500 block px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-0 focus:border-0 placeholder:text-gray-500"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="shrink-0 md:min-w-[100px]">
            <Select value={currency.name} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="text-black text-sm md:text-lg bg-transparent border-none shadow-none px-2 md:px-4 py-2 font-semibold hover:bg-gray-200 focus:ring-0 focus:ring-offset-0">
                <div className="flex items-center gap-1 md:gap-2">
                  <SelectValue placeholder="Select asset" />
                </div>
              </SelectTrigger>
              <SelectContent className="border-none">
                {[ETH, USDC].map((token) => (
                  <SelectItem
                    key={token.name}
                    value={token.name}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={token.icon}
                        alt={token.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 object-contain"
                      />
                      {token.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* <div className="flex gap-2 items-center w-full my-4 px-4">
          <span className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <span>Balance: </span>
            <span>
              {isLoadingBalance ? (
                <MoonLoader size={10} />
              ) : (
                formatAmount(
                  Number(formatUnits(data!.value!, currency.decimals)),
                  4
                )
              )}
            </span>
            <span>{currency.name}</span>
          </span>

          <button
            type="button"
            onClick={handleSetMax}
            disabled={isLoadingBalance}
            className="text-xs md:text-sm font-medium text-[#464646] hover:text-[#4A64DC] focus:outline-none ml-2 border-0 bg-transparent cursor-pointer disabled:opacity-50"
          >
            MAX
          </button>
        </div> */}
      </div>

      {/* Invest button */}
      <button
        type="submit"
        className="w-full flex justify-center mt-3 py-3 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-[#5FECF9] hover:bg-[#4A64DC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        Invest
      </button>
    </div>
  );
};
