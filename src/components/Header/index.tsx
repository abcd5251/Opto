"use client";

import ConnectWalletButton from "../ConnectWalletButton";

export default function Header() {
  return (
    <header className="flex justify-between items-center px-5 md:px-20 py-6">
      <div className="text-white font-bold text-lg">Opto</div>

      <div className="flex items-center gap-4">
        <ConnectWalletButton />
      </div>
    </header>
  );
}
