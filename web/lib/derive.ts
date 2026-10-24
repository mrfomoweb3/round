import type { Address } from "viem";
import type { CircleState } from "./useCircle";

/** Everything the circle page needs to decide what to show, computed from on-chain state + the clock. */
export function derive(c: CircleState, me: Address | undefined, now: number) {
  const r = c.currentRound; // 1-based, 0 = not started
  const idx = r - 1;
  const recipient = r > 0 ? c.members[idx] : undefined;
  const skipped = !!recipient?.defaulted;
  const roundEnd = c.roundStart + c.roundDuration;
  const graceEnd = roundEnd + c.gracePeriod;
  const active = c.started && !c.completed;

  const allActivePaid =
    active && c.members.every((m, i) => i === idx || m.defaulted || c.paid[idx]?.[i]);
  const canSettle = active && (skipped || allActivePaid || now >= graceEnd);

  const myIdx = me ? c.members.findIndex((m) => m.address.toLowerCase() === me.toLowerCase()) : -1;
  const mine = myIdx >= 0 ? c.members[myIdx] : undefined;
  const iOwe = active && !!mine && !mine.defaulted && myIdx !== idx && !skipped && !c.paid[idx]?.[myIdx];
  const iPaid = active && myIdx >= 0 && !!c.paid[idx]?.[myIdx];

  const label = (i: number) => (i === myIdx ? "You" : `Member ${i + 1}`);
  const unpaid = active
    ? c.members.filter((m, i) => i !== idx && !m.defaulted && !c.paid[idx]?.[i]).length
    : 0;

  return { r, idx, recipient, skipped, roundEnd, graceEnd, active, allActivePaid, canSettle, myIdx, mine, iOwe, iPaid, label, unpaid };
}

export type Derived = ReturnType<typeof derive>;
