/**
 * Adapter: maps the raw on-chain `Campaign` struct (BigInts, raw fields)
 * into a UI-friendly `DisplayCampaign` (numbers, derived fields, URL-safe id).
 */
import type { Campaign as OnchainCampaign } from "./contract";
import { CONTRACT_ADDRESS } from "./contract";

export type CampaignMode = "KWYR" | "AON";
export type CampaignStatus = "live" | "funded" | "ended" | "cancelled";

export interface DisplayCampaign {
  id: string;
  rawId: bigint;
  issue: number;
  title: string;
  category: string;
  mode: CampaignMode;
  status: CampaignStatus;
  beneficiary: `0x${string}`;
  goal: number;
  raised: number;
  donors: number; // best-effort; pass donors map externally if available
  deadline: number; // unix ms
  createdAt: number; // unix ms
  image: string; // raw URL or empty
  excerpt: string;
  description: string;
  pull: string;
}

export function toDisplayCampaign(
  c: OnchainCampaign,
  donorCount = 0,
): DisplayCampaign {
  const id = c.id.toString();
  const goal = Number(c.goal) / 1e18;
  const raised = Number(c.raised) / 1e18;

  // First sentence becomes the excerpt; rest becomes the body.
  const desc = c.description?.trim() || "";
  const firstStop = Math.min(
    ...[". ", ".\n", "! ", "? "]
      .map((sep) => {
        const i = desc.indexOf(sep);
        return i === -1 ? Infinity : i + 1;
      }),
  );
  const excerpt =
    desc.length === 0
      ? "Onchain campaign on LitVM."
      : firstStop !== Infinity
        ? desc.slice(0, firstStop)
        : desc.slice(0, 160);

  // Pull-quote: heuristic — the shortest sentence under 100 chars, else excerpt.
  const sentences = desc
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 18 && s.length < 110);
  const pull = sentences[0] || excerpt;

  let mode: CampaignMode = "KWYR";
  let mode_n: number = c.mode as unknown as number;
  if (typeof mode_n === "bigint") mode_n = Number(mode_n);
  if (mode_n === 1) mode = "AON";

  let status: CampaignStatus = "live";
  let s_n: number = c.status as unknown as number;
  if (typeof s_n === "bigint") s_n = Number(s_n);
  if (s_n === 1) status = "cancelled";
  else if (s_n === 2) status = "funded";
  else if (s_n === 3) status = "ended";

  return {
    id,
    rawId: c.id,
    issue: Number(c.id),
    title: c.title,
    category: c.category || "other",
    mode,
    status,
    beneficiary: c.beneficiary,
    goal,
    raised,
    donors: donorCount,
    deadline: Number(c.deadline) * 1000,
    createdAt: Number(c.createdAt) * 1000,
    image: c.imageURI || "",
    excerpt,
    description: desc,
    pull,
  };
}

export const NETWORK = {
  chainId: 4441,
  name: "LitVM LiteForge",
  contract: CONTRACT_ADDRESS,
  explorer: "https://liteforge.explorer.caldera.xyz",
  blockTime: 2,
};
