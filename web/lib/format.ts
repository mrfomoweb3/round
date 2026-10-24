import { formatUnits } from "viem";

export const usd = (wei: bigint, digits = 0) =>
  `$${Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;

export const musd = (wei: bigint) =>
  `${Number(formatUnits(wei, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })} MUSD`;

export const btc = (wei: bigint, digits = 6) => `${Number(formatUnits(wei, 18)).toFixed(digits)} BTC`;

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function duration(seconds: number) {
  if (seconds <= 0) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}
