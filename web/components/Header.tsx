"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#protection", label: "Protection" },
  { href: "/circles", label: "Circles" },
  { href: "/#faq", label: "FAQ" },
];

const pill =
  "whitespace-nowrap rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:bg-mint sm:px-6 sm:text-base";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-20 mx-auto max-w-6xl px-4 py-6 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-10 text-white/90 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <WalletButton />
          <button
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/30 bg-white/10 text-white md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="absolute inset-x-4 top-full rounded-2xl bg-white p-2 shadow-xl md:hidden">
          {[...NAV, { href: "/create", label: "Start a circle" }].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 font-medium text-ink hover:bg-mint"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal, openAccountModal, openChainModal }) => {
        if (!mounted) return <span className={`${pill} invisible`}>Connect wallet</span>;
        if (!account)
          return (
            <button className={pill} onClick={openConnectModal}>
              Connect wallet
            </button>
          );
        if (chain?.unsupported)
          return (
            <button className={pill} onClick={openChainModal}>
              Switch to Mezo
            </button>
          );
        return (
          <button className={pill} onClick={openAccountModal}>
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
