import Link from "next/link";

/** Wordmark: a ring (the circle) with a small notch (the payout) + "round". */
export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const color = tone === "light" ? "text-leaf-light" : "text-forest";
  return (
    <Link href="/" className={`flex items-center gap-2 text-2xl font-bold tracking-tight ${color}`} aria-label="Round home">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <circle cx="13" cy="13" r="9.5" stroke="currentColor" strokeWidth="5" />
        <circle cx="21.5" cy="5" r="3" fill="currentColor" />
      </svg>
      round
    </Link>
  );
}
