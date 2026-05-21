import { DEPLOYMENT } from "./deployment";
import { DONATION_PLATFORM_ABI } from "./abi";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  DEPLOYMENT.address) as `0x${string}`;

export const CONTRACT_ABI = DONATION_PLATFORM_ABI;

export const EXPLORER_BASE = "https://liteforge.explorer.caldera.xyz";

export type CampaignMode = 0 | 1; // 0 = KWYR, 1 = AON
export type CampaignStatus = 0 | 1 | 2 | 3; // Active, Cancelled, Successful, Failed

export const MODE_LABEL: Record<number, string> = {
  0: "Keep what you raise",
  1: "All or nothing",
};

export const STATUS_LABEL: Record<number, string> = {
  0: "Active",
  1: "Cancelled",
  2: "Successful",
  3: "Failed",
};

export type Campaign = {
  id: bigint;
  beneficiary: `0x${string}`;
  title: string;
  description: string;
  imageURI: string;
  category: string;
  goal: bigint;
  deadline: bigint;
  raised: bigint;
  withdrawn: bigint;
  createdAt: bigint;
  mode: CampaignMode;
  status: CampaignStatus;
};
