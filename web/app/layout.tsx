import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Round — Bitcoin-secured savings circles",
  description: "Save together in dollars. Keep your Bitcoin. Savings circles on Mezo, secured by BTC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans text-ink antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
