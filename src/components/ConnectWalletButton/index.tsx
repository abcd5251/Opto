"use client";

import Image from "next/image";
import { usePrivy, useLogout } from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConnectWalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { ready: privyReady, authenticated, linkWallet, user } = usePrivy();

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

  const handleButtonOnClick = () => {
    if (!buttonReady) return;
    if (!loggedIn) {
      if (authenticated) {
        // User is authenticated but wallet not connected, use linkWallet instead
        linkWallet();
      } else {
        console.log("user is not authenticated");
        // User is not authenticated, use regular login
        // login();
      }
      return;
    }
  };

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
    if (!user?.smartWallet?.address) return;
    setAddress(user.smartWallet.address);
  }, [user]);

  const backgroundStyle = {
    background:
      "linear-gradient(-86.667deg, rgba(95, 121, 241, 30%) 18%, rgba(253, 164, 175, 30%) 100%)",
  };

  return (
    <div
      className={`relative flex items-center justify-center text-center gap-x-1 ${
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
              <div className="flex items-center justify-between w-full">
                {/* User info with wallet */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* User info */}
                  <div className="flex flex-col items-start min-w-0">
                    <span className="font-bold text-[13px] text-[#3B446A] tracking-wider truncate">
                      {user?.google?.name}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <span className="text-center text-white font-medium text-sm">
                  Connect
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

      {/* DROPDOWN */}
      {isDropdownOpen && (
        <div
          data-state={isDropdownOpen ? "open" : "closed"}
          className="absolute top-full right-0 w-full rounded-b-[12px] shadow-lg overflow-hidden z-10 origin-top-right data-[state=closed]:pointer-events-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2"
          style={{
            ...backgroundStyle,
            boxShadow: "0px 4px 20px 0px rgba(96, 167, 255, 0.25)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="w-full">
            {/* Menu items */}
            <div className="w-full">
              {/* Profile */}
              <button
                onClick={() => router.push("/profile")}
                className="cursor-pointer w-full flex items-center gap-2 px-5 py-3 hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                <Image
                  src="/dropdown-icons/profile-icon.svg"
                  alt="Profile"
                  width={20}
                  height={20}
                />
                <span className="font-[var(--font-bricolage-grotesque)] text-xs text-black">
                  Profile
                </span>
              </button>

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className="cursor-pointer w-full flex items-center gap-2 px-5 py-3 hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                <Image
                  src="/dropdown-icons/logout-icon.svg"
                  alt="Disconnect"
                  width={20}
                  height={20}
                />
                <span className="font-[var(--font-bricolage-grotesque)] text-xs text-[#FF4560]">
                  Disconnect
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
