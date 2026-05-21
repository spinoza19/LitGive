"use client";

import { useMemo, useState } from "react";
import { useReadContract } from "wagmi";
import Link from "next/link";
import { CONTRACT_ABI, CONTRACT_ADDRESS, Campaign } from "@/lib/contract";
import { CampaignCard } from "@/components/CampaignCard";
import { CardGridSkeleton } from "@/components/Skeleton";
import { StatsBanner } from "@/components/StatsBanner";
import { Filters, DEFAULT_FILTERS, FilterState } from "@/components/Filters";
import { DonationsFeed } from "@/components/DonationsFeed";

export default function HomePage() {
  const {
    data: campaigns,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "listCampaigns",
    args: [0n, 1000n],
    query: { refetchInterval: 10_000 },
  }) as { data: Campaign[] | undefined; isLoading: boolean; error: Error | null; refetch: () => void };

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    if (!campaigns) return [];
    let list = [...campaigns];

    if (filters.category !== "all") {
      list = list.filter((c) => c.category === filters.category);
    }
    if (filters.status !== "all") {
      const map = { active: 0, cancelled: 1, successful: 2, failed: 3 } as const;
      const target = map[filters.status];
      list = list.filter((c) => c.status === target);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    switch (filters.sort) {
      case "newest":
        list.sort((a, b) => Number(b.createdAt - a.createdAt));
        break;
      case "oldest":
        list.sort((a, b) => Number(a.createdAt - b.createdAt));
        break;
      case "most-raised":
        list.sort((a, b) => Number(b.raised - a.raised));
        break;
      case "ending-soon":
        list = list.filter((c) => c.deadline > 0n && c.status === 0);
        list.sort((a, b) => Number(a.deadline - b.deadline));
        break;
    }
    return list;
  }, [campaigns, filters]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-panel to-bg p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Onchain donations on <span className="text-accent">LitVM</span>
            </h1>
            <p className="mt-2 text-muted max-w-xl">
              Launch a campaign for any cause — charity, creators, public goods,
              personal — and accept zkLTC with full transparency. No accounts,
              no middlemen, settlement in seconds.
            </p>
          </div>
          <Link href="/new" className="btn-primary self-start whitespace-nowrap">
            Start a campaign →
          </Link>
        </div>
      </section>

      <StatsBanner />

      <section>
        <Filters
          state={filters}
          onChange={setFilters}
          resultsCount={filtered.length}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Browse campaigns</h2>
          <button onClick={() => refetch()} className="btn-ghost text-xs">
            Refresh
          </button>
        </div>

        {isLoading && <CardGridSkeleton count={6} />}

        {error && (
          <div className="card text-rose-400 text-sm">
            Failed to load: {error.message}
          </div>
        )}

        {!isLoading && !error && (!campaigns || campaigns.length === 0) && (
          <div className="card text-center py-12">
            <div className="text-muted mb-3">No campaigns yet.</div>
            <Link href="/new" className="btn-primary">
              Be the first →
            </Link>
          </div>
        )}

        {!isLoading && filtered.length === 0 && campaigns && campaigns.length > 0 && (
          <div className="card text-center py-10">
            <div className="text-muted">No campaigns match your filters.</div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CampaignCard key={c.id.toString()} c={c} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Latest activity</h2>
        <DonationsFeed limit={10} showCampaignLink />
      </section>
    </div>
  );
}
