import type { Metadata } from "next";
import { Manrope, Montserrat } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";
import Header from "@/components/Header";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Opto - DeFi Investment Bot",
  description:
    "Your DeFi investment copilot. Build a risk-diversified DeFi portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${montserrat.variable}`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
