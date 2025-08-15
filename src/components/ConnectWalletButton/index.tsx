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

  const backgroundStyle = {
    background:
      "linear-gradient(-86.667deg, #020102 0%, #2A1F3E 27%, #5888C4 60%, #020102 100%)",
  };

  return (
    <div
      className={`border-[0.7px] border-gray-300 relative flex items-center justify-center text-center gap-x-1 text-white uppercase tracking-wider ${
        isDropdownOpen ? "rounded-t-[10px]" : "rounded-[10px]"
      } py-2 px-3 w-[150px] md:w-[190px] h-[48px]`}
      style={backgroundStyle}
      ref={dropdownRef}
    >
      <div
        onClick={handleButtonOnClick}
        className="pl-1 cursor-pointer flex items-center justify-between w-full h-full"
      >
        <div className="flex items-center gap-3 w-full mr-2">
          {buttonReady ? (
            loggedIn ? (
              <div className="flex items-center justify-center w-full">
                {/* chain image */}
                <span className="mr-2">
                  <Image
                    src={`/crypto-icons/chains/${chainId}.svg`}
                    alt="chain"
                    width={20}
                    height={20}
                  />
                </span>
                <span className="text-center text-white font-medium text-sm">
                  {user?.wallet?.address.slice(0, 6) +
                    "..." +
                    user?.wallet?.address.slice(-4)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <span className="text-center text-white font-medium text-sm">
                  Sign up / Login
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center w-full">
              <span className="text-center text-white font-medium text-sm">
                Loading...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
