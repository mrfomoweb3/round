"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEventLogs, parseUnits } from "viem";
import { Button, Card, ErrorNote, NotConfigured } from "@/components/ui";
import { PRICE_FEED_ADDRESS, ROUND_ADDRESS, isConfigured, priceFeedAbi } from "@/lib/contracts";
import { roundAbi } from "@/lib/roundAbi";
import { btc, usd } from "@/lib/format";
import { useTx } from "@/lib/useTx";

const DURATIONS = [
  { label: "5 minutes (demo)", seconds: 5 * 60 },
  { label: "1 week", seconds: 7 * 86400 },
  { label: "2 weeks", seconds: 14 * 86400 },
  { label: "30 days", seconds: 30 * 86400 },
];
const GRACES = [
  { label: "60 seconds (demo)", seconds: 60 },
  { label: "1 day", seconds: 86400 },
  { label: "3 days", seconds: 3 * 86400 },
];
const PENALTY_BPS = 1_000;

export default function CreateCircle() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const tx = useTx();

  const [amount, setAmount] = useState("100");
  const [size, setSize] = useState(4);
  const [roundDuration, setRoundDuration] = useState(DURATIONS[0].seconds);
  const [grace, setGrace] = useState(GRACES[0].seconds);
  const [ratio, setRatio] = useState(150);

  const { data: price } = useReadContract({
    address: PRICE_FEED_ADDRESS,
    abi: priceFeedAbi,
    functionName: "fetchPrice",
    query: { refetchInterval: 15_000, retry: true },
  });

  let contribution = 0n;
  try {
    contribution = parseUnits(amount || "0", 18);
  } catch {}
  const valid = contribution > 0n && size >= 2 && size <= 12 && ratio >= 100;
  const exposure = (contribution * BigInt(size - 1) * BigInt(ratio)) / 100n;
  const required = price ? (exposure * 10n ** 18n + price - 1n) / price : undefined;

  async function create() {
    const receipt = await tx.run("Creating circle…", () =>
      writeContractAsync({
        address: ROUND_ADDRESS,
        abi: roundAbi,
        functionName: "createCircle",
        args: [contribution, size, roundDuration, grace, ratio * 100, PENALTY_BPS],
      }),
    );
    if (!receipt) return;
    const [created] = parseEventLogs({ abi: roundAbi, eventName: "CircleCreated", logs: receipt.logs });
    if (created) router.push(`/circle/${created.args.id}?created=1`);
  }

  if (!isConfigured) return <NotConfigured />;

  const field = "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-lg focus:border-leaf focus:outline-none";
  return (
    <div className="pt-10">
      <h1 className="text-4xl font-light tracking-[-0.03em] text-white sm:text-5xl">Start a circle</h1>
      <p className="mt-3 text-lg text-white/85">Pick the basics. You&apos;ll share a link so others can join.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_22rem]">
        <Card className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Each person pays, every round</span>
            <div className="relative">
              <input className={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">MUSD</span>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium">People in the circle</span>
            <input className={field} type="number" min={2} max={12} value={size} onChange={(e) => setSize(Number(e.target.value))} />
            <span className="text-xs text-stone-500">2 to 12. Payout order is join order.</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Round length</span>
            <select className={field} value={roundDuration} onChange={(e) => setRoundDuration(Number(e.target.value))}>
              {DURATIONS.map((d) => (
                <option key={d.seconds} value={d.seconds}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Grace period before a missed payment counts</span>
            <select className={field} value={grace} onChange={(e) => setGrace(Number(e.target.value))}>
              {GRACES.map((g) => (
                <option key={g.seconds} value={g.seconds}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Collateral ratio</span>
            <div className="relative">
              <input className={field} type="number" min={100} step={10} value={ratio} onChange={(e) => setRatio(Number(e.target.value))} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">%</span>
            </div>
            <span className="text-xs text-stone-500">BTC locked, as a share of the most a member could owe. 150% is a safe default.</span>
          </label>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Each member locks</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">{required !== undefined && valid ? btc(required, 5) : "—"}</div>
            <div className="mt-1 text-sm text-stone-600">
              ≈ {valid ? usd(exposure) : "—"} at {price ? usd(price) : "…"}/BTC
            </div>
            <hr className="my-4 border-stone-200" />
            <div className="text-sm text-stone-700">
              Pot each round: <span className="font-semibold">{valid ? usd(contribution * BigInt(size - 1)) : "—"}</span>
            </div>
            <div className="mt-1 text-xs text-stone-500">Priced live by Mezo&apos;s BTC/USD oracle. Missed payments carry a 10% penalty.</div>
          </Card>
          {isConnected ? (
            <Button className="w-full" disabled={!valid || !!tx.busy} onClick={create}>
              {tx.busy ?? "Create circle"}
            </Button>
          ) : (
            <ConnectButton />
          )}
          <ErrorNote message={tx.error} />
        </div>
      </div>
    </div>
  );
}
