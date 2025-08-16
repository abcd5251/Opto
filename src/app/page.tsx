"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { RotateCcw } from "lucide-react";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import InvestmentForm from "@/components/InvestmentForm";

export default function Home() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const { ready: privyReady, authenticated, user } = usePrivy();
  type MessageType = "input" | "strategy" | "end" | undefined;
  type Message = {
    role: "user" | "assistant" | "system";
    content: string;
    type?: MessageType;
    next?: Message;
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasSent, setHasSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loggedIn = privyReady && authenticated && user?.wallet?.address;

  const prompts = ["Help me find some best DeFi strategies"];

  const handleStrategyClick = (strategyType: "multi" | "single") => {
    if (!loggedIn || isLoading) return;

    const message =
      strategyType === "multi"
        ? "Help me create a cross-chain, multi-protocols yield portfolio"
        : "Help me explore single DeFi strategy";

    // Add user message and start loading
    setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", content: message },
    ]);
    setHasSent(true);
    setInputValue("");
    setIsLoading(true);

    // Simulate loading and then add bot response
    setTimeout(() => {
      setMessages((prev: Message[]) => [
        ...prev,
        {
          role: "assistant",
          type: "input",
          content:
            "We will diversify your token into reputable and secured yield protocols based on your preference. \n What's your investment size (amount)?",
        },
      ]);
      setIsLoading(false);
    }, 2000);
  };

  const handleNewChat = () => {
    setMessages([]);
    setHasSent(false);
    setInputValue("");
    setIsLoading(false);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || !loggedIn || isLoading) return;

    // Add user message and start loading
    setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", content: text },
    ]);
    setHasSent(true);
    setInputValue("");
    setIsLoading(true);

    // Simulate loading and then add bot response
    setTimeout(() => {
      setMessages((prev: Message[]) => [
        ...prev,
        {
          role: "assistant",
          type: "input",
          content:
            "We will diversify your token into reputable and secured yield protocols based on your preference. \n What's your investment size (amount)?",
        },
      ]);
      setIsLoading(false);
    }, 2000); // 2 seconds delay for realistic loading experience
  };

  return (
    <div className="h-[calc(100vh-101px)] flex flex-col relative">
      {/* Main Content */}
      <div className="text-white flex-1 flex flex-col relative">
        {/* Chat Area - Scrollable Content */}
        <div className="flex-1 max-h-[calc(100vh-101px-158px)] overflow-y-scroll">
          <div className="p-5 max-w-4xl mx-auto">
            <main className="space-y-20 pb-6">
              {/* Welcome Section */}
              <section className="space-y-8">
                {/* Welcome Message */}
                {!loggedIn ? (
                  // 未登入時：全寬 Welcome
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-3 text-white">
                      👋 Welcome to Opto DeFi Bot
                    </h2>
                    <p className="text-sm opacity-90 leading-relaxed text-white">
                      I'm your DeFi investment copilot. You can build a
                      risk-diversified DeFi portfolio, or ask me anything about
                      DeFi investment.
                    </p>
                  </div>
                ) : (
                  // 登入時：限制寬度的 Welcome，不顯示標題，加上機器人頭像
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                        <Image
                          src="/crypto-icons/chains/296.svg"
                          alt="Bot"
                          width={32}
                          height={32}
                        />
                      </div>
                      <div className="max-w-[70%] bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-2xl px-4 py-3">
                        <p className="text-base opacity-90 leading-relaxed text-white">
                          I'm your DeFi investment copilot. You can build a
                          risk-diversified DeFi portfolio, or ask me anything
                          about DeFi investment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversation Area */}
                {hasSent && (
                  <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-1">
                    {messages.map((m, idx) => {
                      if (m.role === "user") {
                        return (
                          <div className="flex justify-end" key={idx}>
                            <div className="max-w-[70%] bg-white text-black rounded-lg px-4 py-3 shadow">
                              {m.content}
                            </div>
                          </div>
                        );
                      }
                      // assistant messages
                      if (m.type === "input") {
                        return (
                          <div
                            className="flex justify-start flex-col gap-4"
                            key={idx}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                                <Image
                                  src="/crypto-icons/chains/296.svg"
                                  alt="Bot"
                                  width={32}
                                  height={32}
                                />
                              </div>
                              <div className="max-w-[70%] bg-white/5 rounded-2xl px-4 py-3">
                                <p className="text-base text-white/90">
                                  {m.content}
                                </p>
                              </div>
                            </div>
                            {/* Only render input control for the latest 'input' step */}
                            {idx === messages.length - 1 && (
                              <div className="flex items-center gap-2 ml-11">
                                <div className={`w-full max-w-sm py-3`}>
                                  <div>
                                    <InvestmentForm />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      if (m.type === "strategy") {
                        return (
                          <div className="flex justify-start" key={idx}>
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
                                <p className="mb-3 text-base text-white/90">
                                  {m.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (m.type === "end") {
                        return (
                          <div className="flex justify-start" key={idx}>
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
                                <div className="text-white/70 text-sm">
                                  {m.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      // default assistant text
                      return (
                        <div className="flex justify-start" key={idx}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                              <Image
                                src="/crypto-icons/chains/296.svg"
                                alt="Bot"
                                width={20}
                                height={20}
                              />
                            </div>
                            <div className="max-w-[80%] bg-white/5 rounded-2xl p-6">
                              <div className="text-white/90 text-sm">
                                {m.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Loading message */}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                            <Image
                              src="/crypto-icons/chains/296.svg"
                              alt="Bot"
                              width={32}
                              height={32}
                            />
                          </div>
                          <div className="max-w-[70%] bg-white/5 rounded-2xl px-4 py-3">
                            <div className="flex items-center text-white/90">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Login Steps - Only show when not logged in and not in conversation */}
                {!hasSent && !loggedIn && (
                  <div className="grid grid-cols-2 gap-5">
                    <div className="glass-card p-5 cursor-pointer hover:scale-[1.02] transition-transform group relative">
                      <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
                        Step 1
                      </div>
                      <div className="text-base font-semibold leading-relaxed mb-5 text-white">
                        Create an account, or login existing account
                      </div>
                      <div className="absolute bottom-5 right-5">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="opacity-80 group-hover:opacity-100 transition-opacity"
                        >
                          <path
                            d="M7 17L17 7M17 7H7M17 7V17"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="glass-card p-5 cursor-pointer hover:scale-[1.02] transition-transform group relative">
                      <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
                        Step 2
                      </div>
                      <div className="text-base font-semibold leading-relaxed mb-5 text-white">
                        Create a Cross-Chain, Multi-Protocols Yield Portfolio
                      </div>
                      <div className="absolute bottom-5 right-5">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="opacity-80 group-hover:opacity-100 transition-opacity"
                        >
                          <path
                            d="M7 17L17 7M17 7H7M17 7V17"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strategy Selection - Only show when not in conversation and logged in */}
                {!hasSent && loggedIn && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 flex-shrink-0"></div>
                      <div className="max-w-[70%] w-full">
                        <div className="grid grid-cols-2 gap-5">
                          <div
                            onClick={() => handleStrategyClick("multi")}
                            className="glass-card p-5 cursor-pointer hover:scale-[1.02] transition-transform group relative disabled:opacity-50"
                          >
                            <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
                              MULTI STRATEGIES
                            </div>
                            <div className="text-base font-semibold leading-relaxed mb-5 text-white">
                              Create a Cross-Chain, Multi-Protocols Yield
                              Portfolio
                            </div>
                            <div className="absolute bottom-5 right-5">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="opacity-80 group-hover:opacity-100 transition-opacity"
                              >
                                <path
                                  d="M7 17L17 7M17 7H7M17 7V17"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>

                          <div
                            onClick={() => handleStrategyClick("single")}
                            className="glass-card p-5 cursor-pointer hover:scale-[1.02] transition-transform group relative disabled:opacity-50"
                          >
                            <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
                              SINGLE STRATEGY
                            </div>
                            <div className="text-base font-semibold leading-relaxed mb-5 text-white">
                              Explore single DeFi Strategy
                            </div>
                            <div className="absolute bottom-5 right-5">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="opacity-80 group-hover:opacity-100 transition-opacity"
                              >
                                <path
                                  d="M7 17L17 7M17 7H7M17 7V17"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>

        {/* Fixed Chat Section at Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-4xl mx-auto p-5">
            {/* New Chat button - above input container when conversation exists */}
            {hasSent && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={handleNewChat}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/15 transition-colors text-white flex items-center gap-2"
                >
                  <Image
                    src="/icons/send.svg"
                    alt="Send"
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            )}

            <div
              className={`rounded-lg p-4 flex items-center justify-between ${
                loggedIn ? "bg-white" : "bg-gray-300"
              }`}
            >
              <input
                type="text"
                value={inputValue}
                disabled={!loggedIn || isLoading}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isLoading
                    ? "Loading..."
                    : "Ask me anything about DeFi investment"
                }
                className="flex-1 bg-transparent outline-none text-black placeholder-gray-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!loggedIn || isLoading}
                className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
              >
                <Image
                  src="/icons/send.svg"
                  alt="Send"
                  width={20}
                  height={20}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
