"use client";

import { useState } from "react";
import { usePublicClient } from "wagmi";
import type { Hash, TransactionReceipt } from "viem";
import { humanError } from "./errors";

/** Wraps "send a tx, wait for it, show one plain-language error". */
export function useTx() {
  const client = usePublicClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastHash, setLastHash] = useState<Hash | null>(null);

  async function run(label: string, send: () => Promise<Hash>): Promise<TransactionReceipt | undefined> {
    setBusy(label);
    setError(null);
    try {
      const hash = await send();
      setLastHash(hash);
      const receipt = await client!.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("The transaction failed on-chain.");
      return receipt;
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  }

  return { run, busy, error, setError, lastHash };
}
