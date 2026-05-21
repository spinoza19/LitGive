import { formatEther } from "viem";

export function fmtEth(wei: bigint, digits = 4): string {
  return Number(formatEther(wei)).toFixed(digits);
}

export function shortAddr(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function timeAgo(unixSeconds: bigint | number): string {
  const ts = Number(unixSeconds) * 1000;
  const diff = Date.now() - ts;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function timeLeft(unixDeadline: bigint | number): {
  text: string;
  urgent: boolean;
  passed: boolean;
} {
  const ts = Number(unixDeadline) * 1000;
  const diff = ts - Date.now();
  if (diff <= 0) return { text: "ended", urgent: false, passed: true };
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const days = Math.floor(hr / 24);
  const urgent = days < 3;
  if (days >= 1) return { text: `${days}d left`, urgent, passed: false };
  if (hr >= 1) return { text: `${hr}h left`, urgent: true, passed: false };
  return { text: `${min}m left`, urgent: true, passed: false };
}

export function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    charity: "💚",
    creator: "🎨",
    "public-good": "🛠️",
    personal: "🙏",
    religious: "🕌",
    emergency: "🚨",
    other: "✨",
  };
  return map[cat] ?? "✨";
}
