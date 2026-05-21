"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS, Campaign } from "@/lib/contract";
import { useDonationEvents } from "@/lib/events";
import { fmtEth } from "@/lib/format";
import { StatSkeleton } from "./Skeleton";
import { formatEther } from "viem";

export function StatsBanner() {
  const { data: campaigns, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "listCampaigns",
    args: [0n, 1000n],
    query: { refetchInterval: 30_000 },
  }) as { data: Campaign[] | undefined; isLoading: boolean };

  const { events: donations } = useDonationEvents();

  if (isLoading || !campaigns || donations === null) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
    );
  }

  const totalCampaigns = campaigns.length;
  const totalRaised = campaigns.reduce((acc, c) => acc + c.raised, 0n);
  const activeCampaigns = campaigns.filter((c) => c.status === 0).length;
  const uniqueDonors = new Set(donations.map((d) => d.donor.toLowerCase())).size;

  const stats = [
    {
      label: "Total raised",
      value: `${Number(formatEther(totalRaised)).toFixed(4)} zkLTC`,
    },
    { label: "Campaigns", value: totalCampaigns.toString() },
    { label: "Active now", value: activeCampaigns.toString() },
    { label: "Unique donors", value: uniqueDonors.toString() },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="card">
          <div className="text-[11px] uppercase tracking-wider text-muted">
            {s.label}
          </div>
          <div className="mt-1 text-xl md:text-2xl font-bold tracking-tight">
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
