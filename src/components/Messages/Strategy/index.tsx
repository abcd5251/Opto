import Image from "next/image";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Percent, ArrowUpRight } from "lucide-react";
import { Message } from "@/types";

export default function StrategyMessage({
  message,
  pieData,
  onSubmit,
}: {
  message: Message;
  pieData: { name: string; value: number; color: string }[];
  onSubmit: () => void;
}) {
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
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                stroke="none"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2 text-sm text-white/90">
          {pieData.map((d) => (
            <li key={d.name} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: d.color }}
              />
              <span className="font-medium">{d.name}</span>
              <span className="text-white/60">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          className="border border-[#5FECF9] rounded-lg flex items-center gap-2 bg-transparent text-[#5FECF9] px-4 py-2"
          onClick={() => {
            // Handle action button click
          }}
        >
          <Percent size={15} color="#5FECF9" />
          Change Percentage
        </button>
        <button
          className="bg-[#5FECF9] flex items-center gap-2 text-black px-4 py-2 rounded-lg"
          onClick={() => {
            // Handle action button click
          }}
        >
          <ArrowUpRight size={15} />
          Start Building Portfolio
        </button>
      </div>
    </div>
  );
}
