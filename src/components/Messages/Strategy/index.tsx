import Image from "next/image";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Percent, ArrowUpRight, AlertCircle } from "lucide-react";
import { Message, StrategyPieChartData } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function StrategyMessage({
  message,
  pieData,
  onSubmit,
}: {
  message: Message;
  pieData: StrategyPieChartData[];
  onSubmit: (data: string) => void;
}) {
  const [isDisabled, setIsDisabled] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState(pieData);
  const [draft, setDraft] = useState(pieData);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const total = draft.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const isExact = total === 100;
  const exceeds = total > 100;
  const remaining = 100 - total;

  const updateDraft = (index: number, nextVal: number) => {
    setDraft((prev) =>
      prev.map((item, i) => (i === index ? { ...item, value: nextVal } : item))
    );
  };

  const handleBuildPortfolio = async () => {
    setIsDisabled(true);
    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      const response = await fetch("/api/execute-swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute swap script");
      }

      setExecutionResult(data.message + "\n" + data.output);
      onSubmit(data.message + "\n" + data.output);
      setIsDisabled(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setExecutionError(message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col justify-start">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
          <Image
            src="/crypto-icons/chains/296.svg"
            alt="Bot"
            width={32}
            height={32}
          />
        </div>
        <div className="max-w-[80%] bg-white/5 rounded-2xl px-4 py-3">
          <p className="mb-3 text-base text-white/90">{message.content}</p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="mt-2 flex items-center gap-6">
        <div className="w-44 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                stroke="none"
              >
                {data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {!editing ? (
          <ul className="space-y-2 text-sm text-white/90">
            {data.map((d) => (
              <li key={d.name} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: d.color }}
                />
                <span className="font-medium">{d.name}</span>
                <span className="text-white/60">{d.value}%</span>
                <span>
                  <Image src={d.icon} alt={d.name} width={20} height={20} />
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle size={14} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="rounded-md bg-white text-black py-2 px-3 shadow-lg">
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="font-medium">APY:</span> {d.apy}%
                        </div>
                        {d.tvl && (
                          <div>
                            <span className="font-medium">TVL:</span> {d.tvl}
                          </div>
                        )}
                        {d.risk && (
                          <div>
                            <span className="font-medium">Risk:</span> {d.risk}
                          </div>
                        )}
                        <div className="text-black/80">{d.description}</div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3">
            {draft.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3 text-sm">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: d.color }}
                />
                <span className="font-medium">{d.name}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={d.value}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    updateDraft(
                      i,
                      isNaN(v) ? 0 : Math.max(0, Math.min(100, v))
                    );
                  }}
                  className="w-20 rounded-md bg-white/10 border border-white/20 px-2 py-1 text-white placeholder-white/40 focus:outline-none"
                />
                <span className="text-white/60">%</span>
              </div>
            ))}
            <div className="text-xs">
              <span
                className={
                  exceeds
                    ? "text-red-400"
                    : isExact
                    ? "text-green-400"
                    : "text-white/60"
                }
              >
                Total: {total}%
              </span>
              {total < 100 && (
                <span className="ml-2 text-white/40">
                  Remaining: {Math.max(0, remaining)}%
                </span>
              )}
              {exceeds && (
                <span className="ml-2 text-red-400">
                  Total cannot exceed 100%
                </span>
              )}
              {!isExact && !exceeds && (
                <span className="ml-2 text-white/60">
                  Total must equal 100% to confirm
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!editing ? (
        <div className="flex gap-2">
          <button
            className="border border-[#5FECF9] rounded-lg flex items-center gap-2 bg-transparent text-[#5FECF9] px-4 py-2"
            onClick={() => {
              setDraft(data);
              setEditing(true);
            }}
            disabled={isDisabled}
          >
            <Percent size={15} color="#5FECF9" />
            Change Percentage
          </button>
          <button
            className="bg-[#5FECF9] flex items-center gap-2 text-black px-4 py-2 rounded-lg"
            onClick={handleBuildPortfolio}
            disabled={isDisabled}
          >
            <ArrowUpRight size={15} />
            Start Building Portfolio
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            className="border border-white/20 text-white px-4 py-2 rounded-lg"
            onClick={() => {
              setDraft(data);
              setEditing(false);
            }}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              isExact
                ? "bg-[#5FECF9] text-black"
                : "bg-[#5FECF9]/40 text-black/60 cursor-not-allowed"
            }`}
            disabled={!isExact}
            onClick={() => {
              setData(draft);
              setEditing(false);
            }}
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
