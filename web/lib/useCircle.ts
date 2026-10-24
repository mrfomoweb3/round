"use client";

import { useReadContract, useReadContracts } from "wagmi";
import type { Address } from "viem";
import { roundAbi } from "./roundAbi";
import { MUSD_ADDRESS, ROUND_ADDRESS, musdAbi } from "./contracts";

const round = { address: ROUND_ADDRESS, abi: roundAbi } as const;
const REFRESH = 5_000;

export type MemberState = {
  address: Address;
  collateral: bigint;
  defaulted: boolean;
  received: boolean;
};

export type CircleState = {
  id: bigint;
  creator: Address;
  contribution: bigint;
  size: number;
  currentRound: number;
  paidCount: number;
  roundDuration: number;
  gracePeriod: number;
  collateralRatioBps: number;
  penaltyBps: number;
  roundStart: number;
  completed: boolean;
  started: boolean;
  members: MemberState[];
  /** paid[roundIndex][memberIndex] for rounds 1..size */
  paid: boolean[][];
  requiredCollateral?: bigint;
};

export function useCircle(id: bigint | undefined) {
  const enabled = id !== undefined;
  const base = useReadContracts({
    allowFailure: true,
    contracts: enabled
      ? [
          { ...round, functionName: "circles", args: [id] },
          { ...round, functionName: "getMembers", args: [id] },
          { ...round, functionName: "requiredCollateral", args: [id] },
        ]
      : [],
    query: { enabled, refetchInterval: REFRESH },
  });

  const info = base.data?.[0]?.result as
    | readonly [Address, bigint, number, number, number, number, number, number, number, bigint, boolean]
    | undefined;
  const addrs = (base.data?.[1]?.result as readonly Address[] | undefined) ?? [];
  const size = info ? Number(info[2]) : 0;

  const detail = useReadContracts({
    allowFailure: true,
    contracts:
      enabled && info
        ? [
            ...addrs.map((a) => ({ ...round, functionName: "memberOf" as const, args: [id, a] as const })),
            ...Array.from({ length: size }, (_, r) =>
              addrs.map((a) => ({ ...round, functionName: "paid" as const, args: [id, r + 1, a] as const })),
            ).flat(),
          ]
        : [],
    query: { enabled: enabled && !!info, refetchInterval: REFRESH },
  });

  let circle: CircleState | undefined;
  if (enabled && info && Number(info[2]) > 0) {
    const n = addrs.length;
    const members: MemberState[] = addrs.map((a, i) => {
      const m = detail.data?.[i]?.result as readonly [bigint, boolean, boolean, boolean] | undefined;
      return { address: a, collateral: m?.[0] ?? 0n, defaulted: m?.[2] ?? false, received: m?.[3] ?? false };
    });
    const paid = Array.from({ length: size }, (_, r) =>
      addrs.map((_, i) => Boolean(detail.data?.[n + r * n + i]?.result)),
    );
    circle = {
      id,
      creator: info[0],
      contribution: info[1],
      size,
      currentRound: Number(info[3]),
      paidCount: Number(info[4]),
      roundDuration: Number(info[5]),
      gracePeriod: Number(info[6]),
      collateralRatioBps: Number(info[7]),
      penaltyBps: Number(info[8]),
      roundStart: Number(info[9]),
      completed: info[10],
      started: Number(info[3]) > 0,
      members,
      paid,
      requiredCollateral: base.data?.[2]?.result as bigint | undefined,
    };
  }

  const refetch = () => Promise.all([base.refetch(), detail.refetch()]);
  // Only a successful read of an empty slot means "doesn't exist"; a failed read keeps retrying.
  const notFound = enabled && base.data?.[0]?.status === "success" && Number(info?.[2] ?? 0) === 0;
  return { circle, isLoading: base.isLoading, notFound, refetch };
}

/** The connected wallet's personal numbers for a circle. */
export function useMyPosition(id: bigint | undefined, me: Address | undefined) {
  const enabled = id !== undefined && !!me;
  const q = useReadContracts({
    allowFailure: true,
    contracts: enabled
      ? [
          { ...round, functionName: "memberOf", args: [id, me] },
          { ...round, functionName: "pendingWithdrawals", args: [me] },
          { ...round, functionName: "health", args: [id, me] },
          { ...round, functionName: "remainingObligations", args: [id, me] },
          { address: MUSD_ADDRESS, abi: musdAbi, functionName: "balanceOf", args: [me] },
          { address: MUSD_ADDRESS, abi: musdAbi, functionName: "nonces", args: [me] },
        ]
      : [],
    query: { enabled, refetchInterval: REFRESH },
  });
  const m = q.data?.[0]?.result as readonly [bigint, boolean, boolean, boolean] | undefined;
  return {
    joined: m?.[1] ?? false,
    collateral: m?.[0] ?? 0n,
    defaulted: m?.[2] ?? false,
    received: m?.[3] ?? false,
    pending: (q.data?.[1]?.result as bigint | undefined) ?? 0n,
    health: q.data?.[2]?.result as bigint | undefined,
    remaining: (q.data?.[3]?.result as bigint | undefined) ?? 0n,
    musdBalance: (q.data?.[4]?.result as bigint | undefined) ?? 0n,
    nonce: (q.data?.[5]?.result as bigint | undefined) ?? 0n,
    refetch: q.refetch,
  };
}

export function useCircleCount() {
  return useReadContract({ ...round, functionName: "circleCount", query: { refetchInterval: 10_000 } });
}
