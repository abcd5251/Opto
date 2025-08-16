"use client";

import ConnectWalletButton from "../ConnectWalletButton";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  return (
    <nav className="flex justify-between items-center px-10 py-7 border-b border-white/10">
      <div
        className="font-montserrat font-bold text-2xl cursor-pointer text-white"
        onClick={() => router.push("/")}
      >
        Opto
      </div>
      <ConnectWalletButton />
    </nav>
  );
}
