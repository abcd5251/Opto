import type { Address } from "viem";

export type Token = {
  name: string;
  icon: string;
  decimals: number;
  isNativeToken: boolean;
  chains?: {
    [key: number]: Address;
  };
};

export type MessageType = "input" | "strategy" | "end" | undefined;

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  type?: MessageType;
  next?: Message;
};

export type StrategyPieChartData = {
  name: string;
  value: number;
  color: string;
};
