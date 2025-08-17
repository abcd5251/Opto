"use client";

import Link from "next/link";
import ConnectWalletButton from "../ConnectWalletButton";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

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
      <div className="flex items-center gap-5">
        <Link
          href="/profile"
          className="flex items-center gap-2 text-white px-4 py-2 hover:underline underline-offset-4"
        >
          Profile
          <ArrowUpRight size={15} />
        </Link>

        <ConnectWalletButton />
      </div>
    </nav>
  );
}
