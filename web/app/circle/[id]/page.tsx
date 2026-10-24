"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { ActionPanel } from "@/components/ActionPanel";
import { Activity } from "@/components/Activity";
import { MyStatus } from "@/components/MyStatus";
import { Timeline } from "@/components/Timeline";
import { Card, NotConfigured, Stat } from "@/components/ui";
import { EXPLORER, ROUND_ADDRESS, isConfigured } from "@/lib/contracts";
import { derive } from "@/lib/derive";
import { btc, duration, usd } from "@/lib/format";
import { useCircle, useMyPosition } from "@/lib/useCircle";

function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function CirclePage() {
  const params = useParams<{ id: string }>();
  const id = /^\d+$/.test(params.id) ? BigInt(params.id) : undefined;
  const { address } = useAccount();
  const now = useNow();
  const { circle: c, notFound, refetch } = useCircle(id);
  const me = useMyPosition(id, address);
  const [copied, setCopied] = useState(false);

  if (!isConfigured) return <NotConfigured />;
  if (id === undefined || notFound) return <p className="pt-10 text-lg text-white/85">This circle doesn&apos;t exist.</p>;
  if (!c) return <div className="mt-10 h-64 animate-pulse rounded-2xl bg-white/20" />;

  const d = derive(c, address, now);
  const pot = c.contribution * BigInt(c.size - 1);

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-white/75">Circle #{c.id.toString()}</div>
          <h1 className="text-4xl font-light tracking-[-0.03em] text-white sm:text-5xl">
            {c.completed
              ? "Complete"
              : c.started
                ? `Round ${c.currentRound} of ${c.size}`
                : `${c.members.length} of ${c.size} joined`}
          </h1>
        </div>
        <button onClick={share} className="rounded-xl border border-white/40 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25">
          {copied ? "Link copied ✓" : "Copy invite link"}
        </button>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Pay each round" value={usd(c.contribution)} hint="in MUSD" />
          <Stat label="Pot" value={usd(pot)} hint={`to 1 of ${c.size} people`} />
          <Stat label="Round length" value={duration(c.roundDuration)} hint={`+ ${duration(c.gracePeriod)} grace`} />
          <Stat
            label="Lock to join"
            value={c.requiredCollateral !== undefined ? btc(c.requiredCollateral, 4) : "…"}
            hint={`${c.collateralRatioBps / 100}% cover · Mezo oracle`}
          />
        </div>
      </Card>

      <ActionPanel c={c} d={d} me={me} now={now} onDone={refetch} />
      <MyStatus c={c} d={d} me={me} now={now} />
      <Timeline c={c} d={d} now={now} />
      <Activity c={c} label={d.label} />

      <p className="text-center text-xs text-forest/60">
        Contract{" "}
        <a className="underline" href={`${EXPLORER}/address/${ROUND_ADDRESS}`} target="_blank" rel="noreferrer">
          {ROUND_ADDRESS}
        </a>
      </p>
    </div>
  );
}
