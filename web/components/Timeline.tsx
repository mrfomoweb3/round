import type { CircleState } from "@/lib/useCircle";
import type { Derived } from "@/lib/derive";
import { duration, short } from "@/lib/format";
import { Card } from "./ui";

type Mark = "paid" | "pending" | "missed" | "receives" | "none";

const MARK_STYLE: Record<Mark, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  missed: "bg-red-100 text-red-700",
  receives: "bg-forest text-white",
  none: "bg-stone-100 text-stone-400",
};
const MARK_ICON: Record<Mark, string> = { paid: "✓", pending: "⏳", missed: "✗", receives: "★", none: "·" };

export function Timeline({ c, d, now }: { c: CircleState; d: Derived; now: number }) {

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Rounds</h2>
        <div className="flex flex-wrap gap-3 text-xs text-stone-500">
          <span>★ receives</span>
          <span>✓ paid</span>
          <span>⏳ pending</span>
          <span>✗ missed (covered by BTC)</span>
        </div>
      </div>
      <ol className="mt-4 space-y-2">
        {Array.from({ length: c.size }, (_, k) => {
          const round = k + 1;
          const rec = c.members[k];
          const isPast = c.completed || (c.started && round < c.currentRound);
          const isNow = d.active && round === c.currentRound;
          const skipped = !!rec?.defaulted && !rec.received;

          let note: string;
          if (!rec) note = "Open spot";
          else if (isPast) note = skipped ? "Skipped — recipient defaulted" : "Paid out";
          else if (isNow) {
            if (d.skipped) note = "Skipped — recipient defaulted";
            else if (now < d.roundEnd) note = `Now · ends in ${duration(d.roundEnd - now)}`;
            else if (now < d.graceEnd) note = `Grace period · ${duration(d.graceEnd - now)} left`;
            else note = "Ready to settle";
          } else note = skipped ? "Will be skipped" : "Upcoming";

          return (
            <li
              key={round}
              className={`rounded-xl px-3 py-2.5 ${isNow ? "bg-mint ring-1 ring-leaf/40" : "bg-stone-50"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-sm font-semibold text-stone-500">Round {round}</span>
                  <span className="font-medium">{rec ? `${d.label(k)}` : "—"}</span>
                  {rec && <span className="text-xs text-stone-400">{short(rec.address)}</span>}
                </div>
                <span className={`text-sm ${isNow ? "font-medium text-forest" : "text-stone-500"}`}>{note}</span>
              </div>
              {c.started && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.members.map((m, i) => {
                    const mark = markFor(c, k, i, isPast, isNow);
                    return (
                      <span
                        key={m.address}
                        title={`${d.label(i)}: ${mark}`}
                        className={`rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums ${MARK_STYLE[mark]}`}
                      >
                        {i === d.myIdx ? "You" : `M${i + 1}`} {MARK_ICON[mark]}
                      </span>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function markFor(c: CircleState, k: number, i: number, isPast: boolean, isNow: boolean): Mark {
  const rec = c.members[k];
  if (i === k) return "receives";
  if (rec?.defaulted && !rec.received) return "none"; // skipped round
  if (c.paid[k]?.[i]) return "paid";
  if (isPast) return "missed";
  if (isNow) return c.members[i].defaulted ? "missed" : "pending";
  return "none";
}
