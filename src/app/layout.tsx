import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Opto",
  description: "Your cross-chain DeFI protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          background:
            "linear-gradient(180deg, #000001 0%, #001b31 25%, #1d6d98 75%, #66aebf 100%)",
        }}
      >
        <Providers>
          <div className="w-full">
            <div className="mx-auto">
              <Header />
              <div className="pt-5 mx-auto px-5 md:px-20 relative">
                {children}
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
