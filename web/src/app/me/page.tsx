"use client";

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import Link from "next/link";
import { CONTRACT_ABI, CONTRACT_ADDRESS, Campaign, EXPLORER_BASE } from "@/lib/contract";
import { useDonationEvents } from "@/lib/events";
import { CampaignCard } from "@/components/CampaignCard";
import { CardGridSkeleton } from "@/components/Skeleton";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { fmtEth } from "@/lib/format";

export default function MePage() {
  const { address, isConnected } = useAccount();

  const { data: campaigns, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "listCampaigns",
    args: [0n, 1000n],
    query: { refetchInterval: 15_000, enabled: isConnected },
  }) as { data: Campaign[] | undefined; isLoading: boolean };

  const { events: allDonations } = useDonationEvents();

  const myCampaigns = useMemo(() => {
    if (!address || !campaigns) return [];
    return campaigns
      .filter((c) => c.beneficiary.toLowerCase() === address.toLowerCase())
      .sort((a, b) => Number(b.createdAt - a.createdAt));
  }, [address, campaigns]);

  const myDonations = useMemo(() => {
    if (!address || !allDonations) return [];
    return allDonations.filter(
      (d) => d.donor.toLowerCase() === address.toLowerCase()
    );
  }, [address, allDonations]);

  const totalDonated = myDonations.reduce((acc, d) => acc + d.amount, 0n);
  const totalRaised = myCampaigns.reduce((acc, c) => acc + c.raised, 0n);

  if (!isConnected) {
    return (
      <div className="card text-center max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-2">Your dashboard</h1>
        <p className="text-sm text-muted mb-5">
          Connect your wallet to see campaigns you&apos;ve started and donations
          you&apos;ve made.
        </p>
        <div className="inline-block">
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Your dashboard</h1>
        <p className="text-sm text-muted">
          Connected as <span className="font-mono">{address}</span>
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Campaigns started" value={myCampaigns.length.toString()} />
        <Stat label="Total raised" value={`${fmtEth(totalRaised, 4)} zkLTC`} />
        <Stat label="Donations made" value={myDonations.length.toString()} />
        <Stat label="Total donated" value={`${fmtEth(totalDonated, 4)} zkLTC`} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">My campaigns</h2>
          <Link href="/new" className="btn-secondary text-xs">
            + New campaign
          </Link>
        </div>
        {isLoading && <CardGridSkeleton count={3} />}
        {!isLoading && myCampaigns.length === 0 && (
          <div className="card text-center py-10 text-muted text-sm">
            You haven&apos;t started any campaigns yet.
          </div>
        )}
        {myCampaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCampaigns.map((c) => (
              <CampaignCard key={c.id.toString()} c={c} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">My donations</h2>
        {allDonations === null && (
          <div className="text-xs text-muted">Loading…</div>
        )}
        {allDonations !== null && myDonations.length === 0 && (
          <div className="card text-center py-10 text-muted text-sm">
            You haven&apos;t donated yet.
          </div>
        )}
        {myDonations.length > 0 && (
          <ul className="space-y-2">
            {myDonations.map((d) => (
              <li
                key={`${d.txHash}-${d.donor}`}
                className="rounded-lg border border-border bg-panel/60 p-3 text-sm"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <span className="text-white font-semibold">
                      {fmtEth(d.amount, 4)} zkLTC
                    </span>{" "}
                    <span className="text-muted">to</span>{" "}
                    <Link
                      href={`/campaign/${d.campaignId.toString()}`}
                      className="text-accent hover:underline"
                    >
                      Campaign #{d.campaignId.toString()}
                    </Link>
                  </div>
                  <a
                    href={`${EXPLORER_BASE}/tx/${d.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-muted hover:text-white"
                  >
                    tx ↗
                  </a>
                </div>
                {d.message && (
                  <div className="mt-1 text-xs text-zinc-400 italic">
                    &ldquo;{d.message}&rdquo;
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-[11px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
