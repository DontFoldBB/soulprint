import type { Metadata } from "next";
import { Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Soulprint — your wallet's living on-chain identity",
  description:
    "Not an AI caption for your wallet — an identity primitive other agents can build on. On-chain Somnia agents read your wallet and mint a soulbound dossier that self-evolves forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Ambient drifting halftone blobs (Somnia-style background motion) */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
          <div className="blob" style={{ width: "36rem", height: "24rem", top: "-7rem", left: "-9rem", animation: "drift1 26s ease-in-out infinite" }} />
          <div className="blob" style={{ width: "28rem", height: "20rem", top: "28%", right: "-8rem", animation: "drift2 34s ease-in-out infinite" }} />
          <div className="blob" style={{ width: "32rem", height: "22rem", bottom: "-9rem", left: "22%", animation: "drift3 40s ease-in-out infinite" }} />
        </div>
        {children}
      </body>
    </html>
  );
}
