"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS, Campaign } from "@/lib/contract";
import { useDonationEvents } from "@/lib/events";
import { toDisplayCampaign, NETWORK } from "@/lib/display";
import { CampaignCard } from "@/components/CampaignCard";
import { MarqueeTicker } from "@/components/MarqueeTicker";
import { StatTile } from "@/components/StatTile";
import { DonationItem } from "@/components/DonationItem";
import { Filters, DEFAULT_FILTERS, FilterState } from "@/components/Filters";
import { useBlockHeight } from "@/components/BlockHeight";
import { shortAddr } from "@/lib/format";

export default function HomePage() {
  const { data: campaigns } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "listCampaigns",
    args: [0n, 1000n],
    query: { refetchInterval: 10_000 },
  }) as { data: Campaign[] | undefined };

  const { events: allDonations } = useDonationEvents();

  // Build a per-campaign donor count map from events
  const donorCounts = useMemo(() => {
    if (!allDonations) return new Map<string, number>();
    const m = new Map<string, Set<string>>();
    for (const d of allDonations) {
      const key = d.campaignId.toString();
      if (!m.has(key)) m.set(key, new Set());
      m.get(key)!.add(d.donor.toLowerCase());
    }
    return new Map(Array.from(m.entries()).map(([k, v]) => [k, v.size]));
  }, [allDonations]);

  const display = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.map((c) =>
      toDisplayCampaign(c, donorCounts.get(c.id.toString()) ?? 0),
    );
  }, [campaigns, donorCounts]);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const filtered = useMemo(() => {
    let list = [...display];
    if (filters.category !== "all") {
      list = list.filter((c) => c.category === filters.category);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.beneficiary.toLowerCase().includes(q),
      );
    }
    switch (filters.sort) {
      case "newest":
        list.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "oldest":
        list.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "most-raised":
        list.sort((a, b) => b.raised - a.raised);
        break;
      case "ending-soon":
        list = list.filter((c) => c.deadline > 0 && c.status === "live");
        list.sort((a, b) => a.deadline - b.deadline);
        break;
    }
    return list;
  }, [display, filters]);

  // Featured = newest active campaign, falling back to first
  const featured = useMemo(() => {
    return (
      display.find((c) => c.status === "live") ?? display[0] ?? undefined
    );
  }, [display]);
  const rest = useMemo(
    () => filtered.filter((c) => !featured || c.id !== featured.id),
    [filtered, featured],
  );

  // Stats
  const totalRaised = display.reduce((acc, c) => acc + c.raised, 0);
  const liveCount = display.filter((c) => c.status === "live").length;
  const uniqueDonors = new Set(
    (allDonations ?? []).map((d) => d.donor.toLowerCase()),
  ).size;
  const totalGiven = (allDonations ?? []).reduce(
    (acc, d) => acc + Number(formatEther(d.amount)),
    0,
  );

  return (
    <>
      <Hero campaignCount={display.length} />
      <MarqueeTicker />

      <section className="border-b border-rule">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <StatTile
            label="Total raised"
            value={totalRaised}
            decimals={4}
            suffix=" zkLTC"
            note="All-time, onchain"
          />
          <StatTile
            label="Campaigns live"
            value={liveCount}
            note={`Of ${display.length} total`}
          />
          <StatTile
            label="Unique donors"
            value={uniqueDonors}
            note="Connected wallets"
          />
          <StatTile
            label="Donations made"
            value={(allDonations ?? []).length}
            note={`${totalGiven.toFixed(4)} zkLTC volume`}
          />
        </div>
      </section>

      {featured && (
        <section className="mt-24">
          <SectionHeader
            eyebrow="Featured this issue"
            title="The case for public ledgers."
          />
          <CampaignCard c={featured} size="feature" />
        </section>
      )}

      <section className="mt-24">
        <SectionHeader
          eyebrow="The directory"
          title={`${display.length} campaign${display.length === 1 ? "" : "s"}. Every transaction visible.`}
        />
        <Filters
          state={filters}
          onChange={setFilters}
          totalCount={display.length}
        />
        {rest.length > 0 ? (
          <div className="px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {rest.map((c, i) => (
              <div key={c.id} className="bg-background">
                <CampaignCard c={c} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-20 text-center">
            <div className="eyebrow">No matches</div>
            <p className="mt-3 text-muted-foreground">
              Try clearing the filters or{" "}
              <Link
                href="/new"
                className="underline underline-offset-4 hover:text-gold"
              >
                publish your own campaign
              </Link>
              .
            </p>
          </div>
        )}
      </section>

      <section className="mt-24 border-t border-rule">
        <div className="grid lg:grid-cols-12">
          <div className="lg:col-span-5 p-8 lg:p-12 border-r border-border">
            <div className="eyebrow mb-6">Live · onchain</div>
            <h2 className="display-lg">
              Every gift,
              <br />
              posted in real time.
            </h2>
            <p className="text-muted-foreground mt-6 max-w-md leading-relaxed">
              Donations stream in as they&apos;re mined. No editorial discretion,
              no moderation queue. If it&apos;s on the ledger, it&apos;s on the
              page.
            </p>
            <div className="mt-10 space-y-3 text-sm">
              <KV k="Latest block" v={<LiveBlock />} />
              <KV
                k="Network"
                v={
                  <span className="num">
                    {NETWORK.name} · {NETWORK.chainId}
                  </span>
                }
              />
              <KV k="Block time" v={<span className="num">~2.0s</span>} />
            </div>
          </div>
          <div className="lg:col-span-7 p-8 lg:p-12">
            <div className="flex items-center justify-between mb-4">
              <div className="eyebrow">Activity feed</div>
              <div className="eyebrow num">
                {(allDonations ?? []).length} total
              </div>
            </div>
            {allDonations === null ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 border-b border-border" />
                ))}
              </div>
            ) : allDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No donations yet. Be the first.
              </p>
            ) : (
              <div>
                {allDonations.slice(0, 8).map((d, i) => (
                  <DonationItem key={`${d.txHash}-${i}`} d={d} flash={i === 0} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-24 px-6">
        <div className="max-w-4xl mx-auto py-20 text-center space-y-10">
          <div className="eyebrow">A note from the protocol</div>
          <p className="display-lg">
            &quot;Hard money for soft hands. The fee is two percent. The receipts
            are forever.&quot;
          </p>
          <div className="eyebrow num">
            · LitGive contract{" "}
            <a
              className="underline underline-offset-2 hover:text-gold"
              href={`${NETWORK.explorer}/address/${NETWORK.contract}`}
              target="_blank"
              rel="noreferrer"
            >
              {shortAddr(NETWORK.contract)}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function Hero({ campaignCount }: { campaignCount: number }) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <section className="relative border-b border-rule overflow-hidden">
      <div
        className="absolute inset-0 halftone opacity-[0.18] pointer-events-none"
        aria-hidden
      />
      <div className="relative px-6 pt-16 pb-12 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <div className="eyebrow flex items-center gap-3 flex-wrap">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Vol. I · No. 042 · {today}
          </div>
          <h1 className="display-xl mt-8">
            Donations,
            <br />
            <span className="italic">transparent</span> by default.
            <sup className="font-mono text-base align-top text-gold">[01]</sup>
          </h1>
          <p className="mt-10 max-w-xl text-lg text-muted-foreground leading-relaxed">
            A donation marketplace on{" "}
            <span className="text-foreground">LitVM</span>. Litecoin&apos;s
            first ZK rollup. Anyone can launch a campaign. Every transaction is
            public. Fees are taken once, at withdrawal.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="#directory"
              className="inline-flex items-center gap-3 bg-foreground text-background px-6 py-3.5 font-mono text-xs uppercase tracking-[0.18em] hover:bg-gold hover:text-gold-foreground transition-colors"
            >
              Browse {campaignCount} campaigns
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/new"
              className="inline-flex items-center gap-3 border border-border-strong px-6 py-3.5 font-mono text-xs uppercase tracking-[0.18em] hover:bg-foreground hover:text-background transition-colors"
            >
              Launch yours
            </Link>
          </div>
        </div>
        <aside className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-10 flex flex-col justify-end">
          <div className="eyebrow mb-4">[01] In this issue</div>
          <ol className="space-y-3">
            <InIssue />
          </ol>
          <div className="mt-6 pt-6 border-t border-border eyebrow flex justify-between">
            <span>Read time · 8 min</span>
            <span>Edition 042</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function InIssue() {
  const { data: campaigns } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "listCampaigns",
    args: [0n, 5n],
  }) as { data: Campaign[] | undefined };
  const list = (campaigns ?? []).map((c) => toDisplayCampaign(c)).slice(0, 5);
  if (list.length === 0) {
    return (
      <li className="text-sm text-muted-foreground">No campaigns yet.</li>
    );
  }
  return (
    <>
      {list.map((c) => (
        <li key={c.id}>
          <Link
            href={`/campaign/${c.id}`}
            className="group flex items-baseline gap-3"
          >
            <span className="num text-xs text-muted-foreground">
              №{String(c.issue).padStart(3, "0")}
            </span>
            <span className="font-display text-lg leading-snug group-hover:text-gold transition-colors">
              {c.title}
            </span>
          </Link>
        </li>
      ))}
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div id="directory" className="px-6 pb-8">
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h2 className="display-md max-w-2xl">{title}</h2>
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}

function LiveBlock() {
  const h = useBlockHeight();
  return (
    <span className="num">
      #{h === 0n ? "…" : Number(h).toLocaleString("en-US")}
    </span>
  );
}
