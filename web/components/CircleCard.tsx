"use client";

import Link from "next/link";
import { useCircle } from "@/lib/useCircle";
import { btc, duration, usd } from "@/lib/format";
import { Card } from "./ui";

/** One-line summary of a circle: "4 people · $100/round · lock 0.0021 BTC · get $300 in round 2". */
export function CircleCard({ id, highlight = false }: { id: bigint; highlight?: boolean }) {
  const { circle } = useCircle(id);
  if (!circle) {
    return <Card className="h-28 animate-pulse bg-white/60">{null}</Card>;
  }
  const pot = circle.contribution * BigInt(circle.size - 1);
  const open = !circle.started && circle.members.length < circle.size;
  const nextSlot = circle.members.length + 1;
  const status = circle.completed
    ? "Completed"
    : circle.started
      ? `Round ${circle.currentRound} of ${circle.size}`
      : `${circle.size - circle.members.length} spot${circle.size - circle.members.length === 1 ? "" : "s"} left`;

  return (
    <Link href={`/circle/${id}`} className="block">
      <Card className={`transition hover:border-leaf/50 ${highlight ? "ring-2 ring-leaf/30" : ""}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-stone-500">Circle #{id.toString()}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${open ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-600"}`}>
            {status}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-lg">
          <span className="font-semibold">{circle.size} people</span>
          <span className="text-stone-400">·</span>
          <span className="font-semibold">{usd(circle.contribution)}/round</span>
          <span className="text-stone-400">·</span>
          <span>every {duration(circle.roundDuration)}</span>
        </div>
        <div className="mt-1 text-stone-600">
          {open ? (
            <>
              Lock {circle.requiredCollateral !== undefined ? btc(circle.requiredCollateral, 4) : "… BTC"} · get{" "}
              <span className="font-semibold text-stone-900">{usd(pot)}</span> in round {nextSlot}
            </>
          ) : (
            <>Pot: {usd(pot)} per round</>
          )}
        </div>
      </Card>
    </Link>
  );
}
