"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { DEV_CLIENT_MIDDLEWARE_MANIFEST } from "next/dist/shared/lib/constants";

export default function ChatArea() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const { ready: privyReady, authenticated, user } = usePrivy();

  const loggedIn = privyReady && authenticated && user?.wallet?.address;

  const prompts = [
    "Help me find some best DeFi strategies",
    "What's DeFi strategies",
    "Analyze current crypto market",
  ];

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      console.log("Sending message:", inputValue);
      setInputValue("");
    }
  };

  const handleLogin = () => {
    router.push("/dashboard");
  };

  return (
    <div className="text-white flex gap-x-2 min-h-screen">
      {/* Chat Area */}
      <div className="p-5 max-w-4xl mx-auto">
        <main className="space-y-20">
          <section className="rounded-2xl space-y-8">
            <div className="rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-3">
                👋 Welcome to Opto DeFi Bot
              </h2>
              <p className="text-sm opacity-90 leading-relaxed">
                I'm your DeFi investment copilot. You can build a
                risk-diversified DeFi portfolio, or ask me anything about DeFi
                investment.
              </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-2 gap-5">
              <div className="border border-gray-300 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-transform group relative">
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
                  Step 1
                </div>
                <div className="text-base font-semibold leading-relaxed mb-5">
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

              <div className="border border-gray-300 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-transform group relative">
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
                  Step 2
                </div>
                <div className="text-base font-semibold leading-relaxed mb-5">
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
          </section>

          {/* Chat Section */}
          <section className="space-y-4 pb-20">
            <div className="bg-white/5 rounded-2xl p-5">
              <div
                className={`rounded-xl p-4 flex items-center justify-between mb-5 ${
                  loggedIn ? "bg-white" : "bg-gray-300"
                }`}
              >
                <input
                  type="text"
                  value={inputValue}
                  disabled={!loggedIn}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything about DeFi investment"
                  className="text-gray-500 flex-1 bg-transparent outline-none text-primary-dark placeholder-gray-500 text-sm"
                />
                <button
                  onClick={handleSend}
                  className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Image
                    src="/icons/send.svg"
                    alt="Send"
                    width={20}
                    height={20}
                  />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/60">Prompts</span>
                {prompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    disabled={!loggedIn}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-xs hover:bg-white/15 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Logged in - Dashboard */}
      {loggedIn && (
        <div className="pb-5">
          <div className="bg-[#242A39] rounded-2xl space-y-8 h-full">
            <div className="rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-3">
                👋 Welcome to Opto DeFi Bot
              </h2>
              <p className="text-sm opacity-90 leading-relaxed">
                I'm your DeFi investment copilot. You can build a
                risk-diversified DeFi portfolio, or ask me anything about DeFi
                investment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
