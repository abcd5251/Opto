"use client";

import { usePrivy, useLogin, useLogout } from "@privy-io/react-auth";
import { useDisconnect, useChainId } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ConnectWalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chainId = useChainId();
  const router = useRouter();

  const { ready: privyReady, authenticated, linkWallet, user } = usePrivy();

  const { login } = useLogin();

  const { logout } = useLogout({
    onSuccess: () => {
      if (
        localStorage.getItem("onboarding-dialog-shown") !== "never-show-again"
      )
        localStorage.setItem(`onboarding-dialog-shown`, "false");
    },
  });

  const { disconnect } = useDisconnect();

  // business logic
  const buttonReady = privyReady && !isLoading;
  const loggedIn = privyReady && authenticated && address;

  const handleDisconnect = async () => {
    try {
      setIsDropdownOpen(false);
      setIsLoading(true);
      await logout();
      disconnect();
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonOnClick = () => {
    if (!buttonReady) return;
    if (!loggedIn) {
      if (authenticated) {
        // User is authenticated but wallet not connected, use linkWallet instead
        linkWallet();
      } else {
        // User is not authenticated, use regular login
        login();
      }
      return;
    } else {
      handleDisconnect();
    }
  };

  // DROPDOWN - close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log(user);
    if (!user?.wallet?.address) return;
    setAddress(user.wallet.address);
  }, [user]);

  return (
    <button 
      onClick={handleButtonOnClick}
      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#020102]/60 via-[#2A1F3E]/60 via-[#5888C4]/60 to-[#020102]/60 border-2 border-white/20 border-solid rounded-2xl hover:opacity-90 transition-all"
      ref={dropdownRef}
    >
      {buttonReady ? (
        loggedIn ? (
          <>
            <Image
              src={`/crypto-icons/chains/${chainId}.svg`}
              alt="chain"
              width={20}
              height={20}
            />
            <span className="font-semibold text-sm tracking-wide text-white">
              {user?.wallet?.address.slice(0, 6) +
                "..." +
                user?.wallet?.address.slice(-4)}
            </span>
          </>
        ) : (
          <span className="font-semibold text-sm tracking-wide uppercase text-white">
            Signup / Login
          </span>
        )
      ) : (
        <span className="font-semibold text-sm tracking-wide text-white">
          Loading...
        </span>
      )}
    </button>
  );
}
