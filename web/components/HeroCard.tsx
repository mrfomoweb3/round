"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { PRICE_FEED_ADDRESS, priceFeedAbi } from "@/lib/contracts";
import { useCircle } from "@/lib/useCircle";
import { btc, duration, musd, usd } from "@/lib/format";

/** The hero's "form" card: a live circle when one exists, otherwise a 4-person $100 example priced live. */
export function HeroCard({ id }: { id?: bigint }) {
  const { circle } = useCircle(id);
  const { data: price } = useReadContract({
    address: PRICE_FEED_ADDRESS,
    abi: priceFeedAbi,
    functionName: "fetchPrice",
    query: { enabled: !circle, refetchInterval: 30_000 },
  });

  const contribution = circle?.contribution ?? 100n * 10n ** 18n;
  const size = circle?.size ?? 4;
  const pot = contribution * BigInt(size - 1);
  const exampleLock = price ? (pot * 15n * 10n ** 18n) / (10n * price) : undefined;
  const lock = circle?.requiredCollateral ?? exampleLock;
  const open = circle ? !circle.started && circle.members.length < circle.size : true;
  const slot = circle ? circle.members.length + 1 : 2;
  const href = circle ? `/circle/${circle.id}` : "/circles";

  return (
    <div className="relative overflow-hidden rounded-[2rem] p-4 sm:p-10">
      {/* brush-stroke panel behind the card */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[repeating-linear-gradient(97deg,rgba(255,255,255,0.10)_0_5px,transparent_5px_17px),repeating-linear-gradient(83deg,rgba(10,45,15,0.18)_0_3px,transparent_3px_23px),linear-gradient(160deg,#1f6b33_0%,#3f9d55_45%,#cfeedb_100%)]"
      />
      <div className="relative rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-leaf/25">
            <span className="h-2.5 w-2.5 rounded-full bg-leaf" />
          </span>
          <span className="grid h-10 w-12 place-items-center rounded-lg border border-stone-200">
            <span className="h-5 w-5 rounded-full border-4 border-ink" />
          </span>
          <span className="text-xl font-medium">{circle ? `Circle #${circle.id}` : "Savings circle"}</span>
        </div>

        <div className="mt-6 text-sm font-medium text-stone-700">Each person pays</div>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3.5 text-lg">
          <span className="tabular-nums">{musd(contribution)}</span>
          <span className="rounded-md bg-mint px-2 py-0.5 text-xs font-semibold text-forest">
            {circle ? `every ${duration(circle.roundDuration)}` : `${size} people`}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="You lock" value={lock !== undefined ? btc(lock, 4) : "…"} />
          <Field label={open ? `You get (round ${slot})` : "Pot each round"} value={usd(pot)} />
        </div>

        <div className="mt-5 flex items-center gap-3 text-sm text-stone-700">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-leaf text-xs text-white">✓</span>
          Locked BTC covers anyone who misses a payment
        </div>

        <Link
          href={href}
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink py-4 text-lg font-semibold text-white transition hover:bg-ink/90"
        >
          <LockIcon />
          {open ? `Join · lock ${lock !== undefined ? btc(lock, 4) : "BTC"}` : "View circle"}
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-medium text-stone-700">{label}</div>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-stone-200 px-3.5 py-3.5 text-base tabular-nums sm:text-[1.05rem]">
        <span className="truncate">{value}</span>
        <span className="shrink-0 text-leaf">✓</span>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden>
      <rect x="2" y="9" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M6 9V6a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}
