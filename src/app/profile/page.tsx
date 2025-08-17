"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CryptoIcon from "@/components/CryptoIcon";
import { DonutChart } from "@/components/DonutChart";
import { RefreshCw, ArrowDownToLine, ArrowUpFromLine, Eye } from "lucide-react";

interface Asset {
  symbol: string;
  amount: string;
  value: string;
  chain: string;
  icon: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Assets");
  const [inputValue, setInputValue] = useState("");

  const assets: Asset[] = [
    {
      symbol: "ETH",
      amount: "1.38",
      value: "4763",
      chain: "Sepolia",
      icon: "/crypto-icons/ETH.png",
    },
    {
      symbol: "USDC",
      amount: "5",
      value: "5",
      chain: "Hedera",
      icon: "/crypto-icons/USDC.png",
    },
    {
      symbol: "FLOW",
      amount: "2.99",
      value: "1.3",
      chain: "Flow",
      icon: "/crypto-icons/chains/747.svg",
    },
    {
      symbol: "USDF",
      amount: "0.593",
      value: "0.593",
      chain: "Flow",
      icon: "/crypto-icons/usdf.png",
    },
    {
      symbol: "HBAR",
      amount: "148.94",
      value: "37.83",
      chain: "Hedera",
      icon: "/crypto-icons/chains/295.svg",
    },
  ];

  const chartData = [
    { name: "USDC", percentage: Number(assets["1"]["value"]), color: "#4A9FE8" },
    { name: "FLOW", percentage: Number(assets["2"]["value"]), color: "#4AE8D9" },
    { name: "HBAR", percentage: Number(assets["4"]["value"]), color: "#000000" },
    { name: "ETH", percentage: Number(assets["0"]["value"]), color: "#627EEA" },
    { name: "USDF", percentage: Number(assets["3"]["value"]), color: "#2BB673" },
  ];

  return (
    <div className="">
      {/* Main Layout */}
      <div className="px-10 py-10">
        <div className="flex justify-center">
          {/* Portfolio Panel */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-white/15 to-white/8 border border-white/20 rounded-2xl p-8 backdrop-blur-2xl shadow-xl">
              <div>
                {/* Left Column and Chart Row */}
                <div className="flex gap-16 mb-8 mt-8 ml-8 mr-8">
                  {/* Left Column - Metrics and Actions */}
                  <div className="flex flex-col gap-8 w-[45%]">
                    {/* Three Financial Metrics */}
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-xs text-white/60 mb-2 flex items-center gap-2">
                          Total Asset Value
                          <Eye size={14} className="text-white/60" />
                        </div>
                        <div className="text-xl font-bold">$4821.45</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/60 mb-2 flex items-center gap-2">
                          Total Position Value
                          <Eye size={14} className="text-white/60" />
                        </div>
                        <div className="text-xl font-bold">$4801.45</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/60 mb-2 flex items-center gap-2">
                          Total Profit
                          <Eye size={14} className="text-white/60" />
                        </div>
                        <div className="text-xl font-bold text-green-400">
                          +$2.2
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {[
                        { icon: RefreshCw, label: "Bridge" },
                        { icon: ArrowDownToLine, label: "Deposit" },
                        { icon: ArrowUpFromLine, label: "Withdraw" },
                      ].map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                          <button
                            key={index}
                            className="flex flex-col items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all cursor-pointer flex-1"
                          >
                            <div className="w-8 h-8 flex items-center justify-center">
                              <IconComponent size={24} className="text-white" />
                            </div>
                            <div className="text-xs text-white/80 font-medium">
                              {stat.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart and Legend Container */}
                  <div className="flex items-center gap-12 w-[55%]">
                    {/* Donut Chart */}
                    <div className="flex-shrink-0">
                      <DonutChart
                        data={chartData}
                        size={180}
                        strokeWidth={50}
                      />
                    </div>

                    {/* Asset Legend */}
                    <div className="bg-white/3 backdrop-blur rounded-xl p-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        {chartData.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-xs text-white/80 font-medium flex-1">
                              {item.name}
                            </span>
                            <span className="text-xs text-white/80 font-medium">
                              {item.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 px-8">
                <div className="flex border-b border-white/10">
                  {["Assets", "Strategies", "Transactions"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-semibold transition-colors relative flex-1 ${
                        activeTab === tab
                          ? "text-white"
                          : "text-white/60 hover:text-white/80"
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assets Table */}
              <div className="px-8">
                {/* Table Headers */}
                <div className="grid grid-cols-4 gap-4 pb-3 mb-4 border-b border-white/10">
                  <div className="text-xs text-white/60 font-medium">Coin</div>
                  <div className="text-xs text-white/60 font-medium">Chain</div>
                  <div className="text-xs text-white/60 font-medium">
                    Amount
                  </div>
                  <div className="text-xs text-white/60 font-medium">
                    Action
                  </div>
                </div>

                {/* Table Rows */}
                <div className="space-y-4">
                  {assets.map((asset, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-4 items-center py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={asset.icon}
                          alt={asset.symbol}
                          width={36}
                          height={36}
                        />
                        <div className="text-sm font-semibold">
                          {asset.symbol}
                        </div>
                      </div>
                      <div className="text-sm text-white/80">{asset.chain}</div>
                      <div className="text-left">
                        <div className="text-sm">{asset.amount}</div>
                        <div className="text-xs text-white/60">
                          $ {asset.value}
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <button className="py-2 bg-white text-black hover:bg-white/90 rounded-lg text-xs font-semibold transition-colors w-28 flex items-center justify-center">
                          Deposit
                        </button>
                        <button className="py-2 border border-white/20 hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors w-28 flex items-center justify-center">
                          Withdraw
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
