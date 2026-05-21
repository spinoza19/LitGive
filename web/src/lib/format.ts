import { formatEther } from "viem";

export function fmtEth(wei: bigint, digits = 4): string {
  return Number(formatEther(wei)).toFixed(digits);
}

export function formatLTC(n: number, frac = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  });
}

export function shortAddr(a: string): string {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function timeAgo(unixSeconds: bigint | number): string {
  const ts = typeof unixSeconds === "bigint" ? Number(unixSeconds) * 1000 : unixSeconds;
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function timeLeft(unixDeadline: bigint | number): string {
  const ts =
    typeof unixDeadline === "bigint" ? Number(unixDeadline) * 1000 : unixDeadline;
  const s = Math.max(0, Math.floor((ts - Date.now()) / 1000));
  if (s === 0) return "ended";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    charity: "Humanitarian",
    creator: "Creators",
    "public-good": "Public Good",
    personal: "Medical",
    education: "Education",
    emergency: "Emergency",
    other: "Other",
  };
  return map[cat] ?? cat ?? "Uncategorized";
}
