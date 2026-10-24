"use client";

import { useAccount, useSignTypedData, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseSignature } from "viem";
import { ROUND_ADDRESS, musdPermitDomain } from "@/lib/contracts";
import { roundAbi } from "@/lib/roundAbi";
import type { CircleState, useMyPosition } from "@/lib/useCircle";
import type { Derived } from "@/lib/derive";
import { btc, duration, musd } from "@/lib/format";
import { useTx } from "@/lib/useTx";
import { Button, Card, ErrorNote } from "./ui";

const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

type Position = ReturnType<typeof useMyPosition>;

/** One primary button that changes with state: Join → Pay → Settle → Withdraw. */
export function ActionPanel({
  c,
  d,
  me,
  now,
  onDone,
}: {
  c: CircleState;
  d: Derived;
  me: Position;
  now: number;
  onDone: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const tx = useTx();
  const round = { address: ROUND_ADDRESS, abi: roundAbi } as const;
  const id = c.id;

  const after = async (p: Promise<unknown>) => {
    if (await p) {
      onDone();
      me.refetch();
    }
  };

  const join = () => {
    // 0.5% buffer so a price tick between read and inclusion doesn't fail the join; extra stays as collateral.
    const value = ((c.requiredCollateral ?? 0n) * 1005n) / 1000n;
    after(tx.run("Locking BTC…", () => writeContractAsync({ ...round, functionName: "join", args: [id], value })));
  };

  const pay = () =>
    after(
      tx.run("Sign to pay…", async () => {
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60);
        const signature = await signTypedDataAsync({
          domain: musdPermitDomain,
          types: PERMIT_TYPES,
          primaryType: "Permit",
          message: { owner: address!, spender: ROUND_ADDRESS, value: c.contribution, nonce: me.nonce, deadline },
        });
        const { r, s, v, yParity } = parseSignature(signature);
        return writeContractAsync({
          ...round,
          functionName: "contributeWithPermit",
          args: [id, deadline, Number(v ?? BigInt(yParity + 27)), r, s],
        });
      }),
    );

  const settle = () => after(tx.run("Settling…", () => writeContractAsync({ ...round, functionName: "settle", args: [id] })));
  const withdraw = () =>
    after(tx.run("Withdrawing BTC…", () => writeContractAsync({ ...round, functionName: "withdrawCollateral", args: [id] })));
  const claim = () => after(tx.run("Claiming…", () => writeContractAsync({ ...round, functionName: "claim" })));
  const topUp = () => {
    const value = (c.requiredCollateral ?? 0n) / 4n;
    after(tx.run("Adding BTC…", () => writeContractAsync({ ...round, functionName: "topUpCollateral", args: [id], value })));
  };

  const open = !c.started && c.members.length < c.size;
  const canWithdraw =
    me.joined && me.collateral > 0n && c.started && (c.completed || (!me.defaulted && me.remaining === 0n));
  const lowHealth = me.joined && d.active && me.health !== undefined && me.health < 12_000n;

  let primary: React.ReactNode;
  let hint: React.ReactNode = null;
  const busy = !!tx.busy;

  if (!isConnected) {
    primary = <ConnectButton label="Connect wallet to join" />;
  } else if (!me.joined && open) {
    primary = (
      <Button className="w-full" disabled={busy || c.requiredCollateral === undefined} onClick={join}>
        {tx.busy ?? `Join (lock ${c.requiredCollateral !== undefined ? btc((c.requiredCollateral * 1005n) / 1000n, 5) : "… BTC"})`}
      </Button>
    );
    hint = `You'll receive the pot in round ${c.members.length + 1}.`;
  } else if (me.joined && !c.started) {
    primary = (
      <Button className="w-full" disabled>
        Waiting for {c.size - c.members.length} more {c.size - c.members.length === 1 ? "person" : "people"}
      </Button>
    );
    hint = (
      <button className="underline" disabled={busy} onClick={withdraw}>
        Leave and take my BTC back
      </button>
    );
  } else if (d.iOwe) {
    const short = me.musdBalance < c.contribution;
    primary = (
      <Button className="w-full" disabled={busy || short} onClick={pay}>
        {tx.busy ?? `Pay ${musd(c.contribution)}`}
      </Button>
    );
    hint = short ? (
      <>
        You have {musd(me.musdBalance)}. Get test MUSD at{" "}
        <a className="underline" href="https://testnet.mezo.org" target="_blank" rel="noreferrer">
          testnet.mezo.org
        </a>
        .
      </>
    ) : now < d.roundEnd ? (
      `Due in ${duration(d.roundEnd - now)} · one signature, no approval step`
    ) : (
      `Late — pay now, before the round is settled`
    );
  } else if (d.canSettle) {
    primary = (
      <Button className="w-full" disabled={busy} onClick={settle}>
        {tx.busy ?? `Settle round ${d.r}`}
      </Button>
    );
    hint = d.skipped
      ? "This round's recipient defaulted, so it's skipped."
      : d.unpaid > 0
        ? `${d.unpaid} unpaid — their BTC collateral will cover it. Anyone can settle.`
        : "Everyone paid. Anyone can settle.";
  } else if (canWithdraw) {
    primary = (
      <Button className="w-full" disabled={busy} onClick={withdraw}>
        {tx.busy ?? `Withdraw ${btc(me.collateral, 5)}`}
      </Button>
    );
    hint = me.defaulted ? "What's left after covering your missed payments." : "All your payments are done.";
  } else if (c.completed) {
    primary = (
      <Button className="w-full" disabled>
        Circle complete
      </Button>
    );
  } else if (d.active) {
    primary = (
      <Button className="w-full" disabled>
        {d.iPaid ? "Paid ✓ " : ""}Waiting for {d.unpaid} {d.unpaid === 1 ? "payment" : "payments"}
      </Button>
    );
    hint =
      now < d.graceEnd
        ? `Settling opens in ${duration(d.graceEnd - now)} if anyone hasn't paid.`
        : null;
  } else {
    primary = (
      <Button className="w-full" disabled>
        Circle is full
      </Button>
    );
  }

  return (
    <Card>
      {primary}
      {hint && <p className="mt-2 text-center text-sm text-stone-600">{hint}</p>}
      <ErrorNote message={tx.error} />
      {(me.pending > 0n || lowHealth) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
          {me.pending > 0n && (
            <Button variant="secondary" disabled={busy} onClick={claim}>
              Claim {btc(me.pending, 6)} penalty share
            </Button>
          )}
          {lowHealth && (
            <Button variant="secondary" disabled={busy} onClick={topUp}>
              Add {btc((c.requiredCollateral ?? 0n) / 4n, 5)}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
