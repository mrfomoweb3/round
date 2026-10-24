import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EXPLORER, ROUND_ADDRESS, isConfigured } from "@/lib/contracts";
import { Logo } from "./Logo";

type Item = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; items: Item[] }[] = [
  {
    title: "Product",
    items: [
      { label: "Browse circles", href: "/circles" },
      { label: "Start a circle", href: "/create" },
      { label: "How it works", href: "/#how" },
      { label: "Protection", href: "/#protection" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Get started",
    items: [
      { label: "Test BTC faucet", href: "https://faucet.test.mezo.org", external: true },
      { label: "Get test MUSD", href: "https://testnet.mezo.org", external: true },
      { label: "Mezo explorer", href: EXPLORER, external: true },
    ],
  },
  {
    title: "Built on Mezo",
    items: [
      { label: "About Mezo", href: "https://mezo.org", external: true },
      { label: "Mezo docs", href: "https://mezo.org/docs", external: true },
      { label: "MUSD", href: "https://github.com/mezo-org/musd", external: true },
      ...(isConfigured ? [{ label: "Round contract", href: `${EXPLORER}/address/${ROUND_ADDRESS}`, external: true }] : []),
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-8 bg-forest text-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-white/70">
              Bitcoin-secured savings circles. Save in dollars with your people, without selling your Bitcoin.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-leaf-light" />
              Built for Mezo testnet
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-leaf-light">{col.title}</div>
              <ul className="mt-5 space-y-3">
                {col.items.map((it) => (
                  <li key={it.label}>
                    {it.external ? (
                      <a
                        href={it.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-white/75 transition hover:text-white"
                      >
                        {it.label}
                        <ArrowUpRight size={14} className="opacity-60" />
                      </a>
                    ) : (
                      <Link href={it.href} className="text-white/75 transition hover:text-white">
                        {it.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Round · Built for the Mezo Buildathon</span>
          <span>Testnet only. Test funds have no value. No admin keys, no custody.</span>
        </div>
      </div>
    </footer>
  );
}
