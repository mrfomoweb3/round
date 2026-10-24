import type { CircleState, useMyPosition } from "@/lib/useCircle";
import type { Derived } from "@/lib/derive";
import { btc, duration, musd } from "@/lib/format";
import { Card, Stat } from "./ui";

type Position = ReturnType<typeof useMyPosition>;

export function MyStatus({ c, d, me, now }: { c: CircleState; d: Derived; me: Position; now: number }) {
  if (!me.joined) return null;
  const healthPct = me.health === undefined ? undefined : me.health > 10n ** 12n ? Infinity : Number(me.health) / 100;
  const healthText =
    healthPct === undefined ? "…" : healthPct === Infinity ? "Fully covered" : `${healthPct.toFixed(0)}%`;
  const healthHint =
    healthPct === undefined
      ? "Oracle refreshing"
      : healthPct === Infinity
        ? "Nothing left to pay"
        : healthPct < 120
          ? "Low — add BTC to stay covered"
          : "BTC value ÷ what you still owe";

  let next: string;
  let nextHint: string | undefined;
  if (me.defaulted) {
    next = "Defaulted";
    nextHint = "Your BTC covers your remaining payments";
  } else if (!c.started) {
    next = "Not started";
    nextHint = `Starts when ${c.size - c.members.length} more join`;
  } else if (d.iOwe) {
    next = musd(c.contribution);
    nextHint = now < d.roundEnd ? `Due in ${duration(d.roundEnd - now)}` : "Overdue";
  } else if (me.remaining > 0n) {
    next = "Paid ✓";
    nextHint = `${me.remaining.toString()} payment${me.remaining === 1n ? "" : "s"} left`;
  } else {
    next = "All paid";
    nextHint = me.received ? "You've received your pot" : `You receive in round ${d.myIdx + 1}`;
  }

  return (
    <Card>
      <h2 className="font-semibold">My status</h2>
      <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3">
        <Stat label="BTC locked" value={btc(me.collateral, 5)} />
        <Stat
          label="Health"
          value={<span className={healthPct !== undefined && healthPct < 120 ? "text-red-600" : ""}>{healthText}</span>}
          hint={healthHint}
        />
        <Stat label="Next payment" value={next} hint={nextHint} />
      </div>
    </Card>
  );
}
