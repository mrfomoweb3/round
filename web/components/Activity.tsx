"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { EXPLORER, ROUND_ADDRESS, ROUND_DEPLOY_BLOCK } from "@/lib/contracts";
import { roundAbi } from "@/lib/roundAbi";
import type { CircleState } from "@/lib/useCircle";
import { btc, musd, usd } from "@/lib/format";
import { Card } from "./ui";

const MAX_RANGE = 9_999n; // Mezo RPC caps eth_getLogs at 10,000 blocks
const MAX_CHUNKS = 30n;

export function Activity({ c, label }: { c: CircleState; label: (i: number) => string }) {
  const client = usePublicClient();
  const { data: events, isLoading } = useQuery({
    queryKey: ["activity", ROUND_ADDRESS, c.id.toString()],
    refetchInterval: 8_000,
    enabled: !!client,
    queryFn: async () => {
      const latest = await client!.getBlockNumber();
      const floor = latest > MAX_RANGE * MAX_CHUNKS ? latest - MAX_RANGE * MAX_CHUNKS : 0n;
      let from = ROUND_DEPLOY_BLOCK > floor ? ROUND_DEPLOY_BLOCK : floor;
      const all = [];
      while (from <= latest) {
        const to = from + MAX_RANGE > latest ? latest : from + MAX_RANGE;
        all.push(...(await client!.getContractEvents({ address: ROUND_ADDRESS, abi: roundAbi, fromBlock: from, toBlock: to })));
        from = to + 1n;
      }
      return all.filter((e) => "id" in (e.args as object) && (e.args as { id: bigint }).id === c.id).reverse();
    },
  });

  const who = (a: string) => {
    const i = c.members.findIndex((m) => m.address.toLowerCase() === a.toLowerCase());
    return i >= 0 ? label(i) : `${a.slice(0, 6)}…`;
  };

  return (
    <Card>
      <h2 className="font-semibold">Activity</h2>
      {isLoading && <p className="mt-3 text-sm text-stone-500">Loading…</p>}
      {events && events.length === 0 && <p className="mt-3 text-sm text-stone-500">Nothing yet.</p>}
      <ul className="mt-3 divide-y divide-stone-100">
        {events?.map((e) => {
          const a = e.args as Record<string, never>;
          let text: React.ReactNode;
          let tone = "";
          switch (e.eventName) {
            case "CircleCreated":
              text = `Circle created by ${who(a.creator)}`;
              break;
            case "Joined":
              text = `${who(a.member)} joined, locking ${btc(a.collateral, 5)}`;
              break;
            case "CircleStarted":
              text = "Circle is full — round 1 started";
              break;
            case "Contributed":
              text = `${who(a.member)} paid ${musd(a.amount)} for round ${a.round}`;
              break;
            case "RoundSettled":
              text =
                a.musdPaid === 0n && a.btcPaid === 0n
                  ? `Round ${a.round} skipped`
                  : `Round ${a.round} settled: ${who(a.recipient)} received ${musd(a.musdPaid)}${a.btcPaid > 0n ? ` + ${btc(a.btcPaid, 6)}` : ""}`;
              tone = "font-medium";
              break;
            case "Defaulted":
              text = `${who(a.member)} missed round ${a.round} — ${btc(a.btcTaken, 6)} taken from their collateral`;
              tone = "text-red-700";
              break;
            case "Shortfall":
              text = `${usd(a.usdUncovered, 2)} not covered — ${who(a.member)}'s collateral ran out`;
              tone = "text-red-700 font-medium";
              break;
            case "CollateralToppedUp":
              text = `${who(a.member)} added ${btc(a.amount, 5)}`;
              break;
            case "CollateralWithdrawn":
              text = `${who(a.member)} withdrew ${btc(a.amount, 5)}`;
              break;
            case "CircleCompleted":
              text = "Circle complete 🎉";
              tone = "font-medium";
              break;
            default:
              return null;
          }
          return (
            <li key={`${e.transactionHash}-${e.logIndex}`} className="flex items-start justify-between gap-3 py-2 text-sm">
              <span className={tone}>{text}</span>
              <a
                className="shrink-0 text-xs text-stone-400 hover:text-leaf"
                href={`${EXPLORER}/tx/${e.transactionHash}`}
                target="_blank"
                rel="noreferrer"
              >
                tx ↗
              </a>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
