'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePrivy } from "@privy-io/react-auth"
import ConnectWalletButton from "@/components/ConnectWalletButton"

export default function Home() {
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const { ready: privyReady, authenticated, user } = usePrivy()
  type MessageType = "input" | "strategy" | "end" | undefined
  type Message = {
    role: "user" | "assistant" | "system"
    content: string
    type?: MessageType
    next?: Message
  }
  const [messages, setMessages] = useState<Message[]>([])
  const [hasSent, setHasSent] = useState(false)
  const [usdcAmount, setUsdcAmount] = useState("")

  const loggedIn = privyReady && authenticated && user?.wallet?.address

  const prompts = ["Help me find some best DeFi strategies"]

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt)
  }

  const handleNewChat = () => {
    setMessages([])
    setHasSent(false)
    setUsdcAmount("")
    setInputValue("")
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text || !loggedIn) return
    // append user message and switch to conversation view
    setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", content: text },
      {
        role: "assistant",
        type: "input",
        content:
          "Great, I can help build a diversified strategy. Enter your USDC amount to proceed:",
      },
    ])
    setHasSent(true)
    setInputValue("")
  }

  const handleUsdcSubmit = () => {
    const amount = usdcAmount.trim()
    if (!amount) return
    setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", type: "input", content: `${amount} USDC` },
      {
        role: "assistant",
        type: "strategy",
        content:
          "Here is a draft diversified strategy across stable yields and blue-chip protocols. (Example content)",
      },
    ])
    setUsdcAmount("")
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-10 py-7 border-b border-white/10">
        <div className="font-montserrat font-bold text-2xl cursor-pointer text-white" onClick={() => router.push('/')}>
          Opto
        </div>
        <ConnectWalletButton />
      </nav>

      {/* Main Content with Flex Layout */}
      <div className="text-white flex gap-x-2 min-h-screen">
        {/* Chat Area */}
        <div className="p-5 max-w-4xl mx-auto relative">
        <main className="space-y-20">
        {/* Welcome Section */}
        <section className="space-y-8">
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-3 text-white">👋 Welcome to Opto DeFi Bot</h2>
            <p className="text-sm opacity-90 leading-relaxed text-white">
              I'm your DeFi investment copilot. You can build a risk-diversified DeFi portfolio, or ask me anything about DeFi investment.
            </p>
          </div>

          {/* Conversation Area */}
          {hasSent && (
            <div className="glass-card p-6">
              <div className="space-y-6 overflow-y-auto max-h-[40vh] pb-6 pr-1 scrollbar-thin">
                {messages.map((m, idx) => {
                  if (m.role === "user") {
                    return (
                      <div className="flex justify-end" key={idx}>
                        <div className="max-w-[70%] bg-white text-black rounded-lg px-4 py-3 shadow">
                          {m.content}
                        </div>
                      </div>
                    )
                  }
                  // assistant messages
                  if (m.type === "input") {
                    return (
                      <div className="flex justify-start" key={idx}>
                        <div className="max-w-[80%] text-white/90">
                          <p className="mb-3 text-sm">{m.content}</p>
                          {/* Only render input control for the latest 'input' step */}
                          {idx === messages.length - 1 && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                inputMode="decimal"
                                placeholder="Enter USDC amount"
                                className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white outline-none w-60"
                                value={usdcAmount}
                                onChange={(e) => setUsdcAmount(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleUsdcSubmit()
                                }}
                              />
                              <span className="text-sm text-white">USDC</span>
                              <button
                                onClick={handleUsdcSubmit}
                                className="px-3 py-2 rounded-md bg-white/15 border border-white/20 text-xs hover:bg-white/20 text-white"
                              >
                                Submit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  if (m.type === "strategy") {
                    return (
                      <div className="flex justify-start" key={idx}>
                        <div className="max-w-[80%] text-white/90">
                          <p className="mb-3 text-sm">{m.content}</p>
                        </div>
                      </div>
                    )
                  }
                  if (m.type === "end") {
                    return (
                      <div className="flex justify-start" key={idx}>
                        <div className="max-w-[80%] text-white/70 text-sm">
                          {m.content}
                        </div>
                      </div>
                    )
                  }
                  // default assistant text
                  return (
                    <div className="flex justify-start" key={idx}>
                      <div className="max-w-[80%] text-white/90 text-sm">
                        {m.content}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={handleNewChat}
                  className="block mx-auto px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors border border-white/20"
                >
                  Start a new chat
                </button>
              </div>
            </div>
          )}

          {/* Steps - Only show when not in conversation */}
          {!hasSent && (
            <div className="grid grid-cols-2 gap-5">
              <div className="glass-card p-5 cursor-pointer hover:scale-[1.02] transition-transform group relative">
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">Step 1</div>
                <div className="text-base font-semibold leading-relaxed mb-5 text-white">
                  Create an account, or login existing account
                </div>
                <div className="absolute bottom-5 right-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-80 group-hover:opacity-100 transition-opacity">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="glass-card p-5 cursor-pointer hover:scale-[1.02] transition-transform group relative">
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">Step 2</div>
                <div className="text-base font-semibold leading-relaxed mb-5 text-white">
                  Create a Cross-Chain, Multi-Protocols Yield Portfolio
                </div>
                <div className="absolute bottom-5 right-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-80 group-hover:opacity-100 transition-opacity">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Chat Section - Only show when not in conversation */}
        {!hasSent && (
          <section className="space-y-4 pb-20">
            <div className="bg-white/5 rounded-2xl p-5">
              <div className={`rounded-xl p-4 flex items-center justify-between mb-5 ${loggedIn ? "bg-white" : "bg-gray-300"}`}>
                <input
                  type="text"
                  value={inputValue}
                  disabled={!loggedIn}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about DeFi investment"
                  className="flex-1 bg-transparent outline-none text-black placeholder-gray-500 text-sm"
                />
                <button 
                  onClick={handleSend} 
                  disabled={!loggedIn}
                  className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <Image src="/icons/send.svg" alt="Send" width={20} height={20} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/60">Prompts</span>
                {prompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    disabled={!loggedIn}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-xs hover:bg-white/15 transition-colors disabled:opacity-50 text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </section>
                )}
        </main>
        </div>

        {/* Logged in - Dashboard */}
        {loggedIn && (
          <div className="pb-5">
            <div className="bg-[#242A39] rounded-2xl space-y-8 h-full">
              <div className="rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-3 text-white">
                  👋 Welcome to Opto DeFi Bot
                </h2>
                <p className="text-sm opacity-90 leading-relaxed text-white">
                  I'm your DeFi investment copilot. You can build a
                  risk-diversified DeFi portfolio, or ask me anything about DeFi
                  investment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
