import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FormEvent, useState } from "react";
import { USDC } from "@/constants/coins";
import { MoonLoader } from "react-spinners";
import { Token } from "@/types";
import { useChainId, useBalance } from "wagmi";
import { formatUnits } from "viem";

const invest = async () => {
  console.log("ok");
};

const handleSubmit = (e: FormEvent) => {
  e.preventDefault();

  invest();
};

export default function InvestmentForm() {
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Token>(USDC);

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

  console.log("balance", data?.value);

  const handleCurrencyChange = (tokenName: string) => {
    console.log("ok");
  };

  const handleSetMax = () => {
    setAmount(formatUnits(data?.value!, currency.decimals));
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
      <div className="bg-gray-100 rounded-2xl border border-gray-300">
        <div className="flex items-center w-full gap-2">
          <input
            type="text"
            name="amount"
            id="amount"
            className="flex-1 min-w-0 bg-transparent text-gray-500 block px-6 py-4 text-lg font-semibold focus:outline-none focus:ring-0 focus:border-0 placeholder:text-gray-500"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="shrink-0 md:min-w-[100px]">
            <Select value={USDC.name} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="text-black text-sm md:text-lg bg-transparent border-none shadow-none px-3 md:px-6 py-3 font-semibold hover:bg-gray-200 focus:ring-0 focus:ring-offset-0">
                <div className="flex items-center gap-1 md:gap-2">
                  <SelectValue placeholder="Select asset" />
                </div>
              </SelectTrigger>
              <SelectContent className="border-none">
                {[USDC].map((token) => (
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

        <div className="flex gap-2 items-center w-full my-3 px-6">
          <span className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <span>Balance: </span>
            <span>
              {isLoadingBalance ? (
                <MoonLoader size={10} />
              ) : (
                formatAmount(
                  Number(formatUnits(data?.value!, currency.decimals)),
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
        </div>

        {/* Invest button - inside container */}
        <div className="px-6 pb-6">
                      <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-[10px] shadow-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
            >
              Invest
          </button>
        </div>
      </div>
    </div>
  );
};
