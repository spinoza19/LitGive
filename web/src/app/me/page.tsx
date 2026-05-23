"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS, Campaign, EXPLORER_BASE } from "@/lib/contract";
import { useDonationEvents } from "@/lib/events";
import { toDisplayCampaign } from "@/lib/display";
import { CampaignCard } from "@/components/CampaignCard";
import { StatTile } from "@/components/StatTile";
import { DonationItem } from "@/components/DonationItem";
import { Jazzicon } from "@/components/Jazzicon";
import { shortAddr } from "@/lib/format";

type Tab = "campaigns" | "donations" | "activity";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("campaigns");
  const [copied, setCopied] = useState(false);

  const { data: campaigns } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "listCampaigns",
    args: [0n, 1000n],
    query: { refetchInterval: 15_000, enabled: isConnected },
  }) as { data: Campaign[] | undefined };

  const { events: allDonations } = useDonationEvents();

  const myCampaigns = useMemo(() => {
    if (!campaigns || !address) return [];
    return campaigns
      .filter((c) => c.beneficiary.toLowerCase() === address.toLowerCase())
      .sort((a, b) => Number(b.createdAt - a.createdAt))
      .map((c) => toDisplayCampaign(c));
  }, [campaigns, address]);

  const myDonations = useMemo(() => {
    if (!allDonations || !address) return [];
    return allDonations.filter(
      (d) => d.donor.toLowerCase() === address.toLowerCase(),
    );
  }, [allDonations, address]);

  const totalRaised = myCampaigns.reduce((acc, c) => acc + c.raised, 0);
  const totalDonated = myDonations.reduce(
    (acc, d) => acc + Number(formatEther(d.amount)),
    0,
  );
  const totalWithdrawn = useMemo(() => {
    if (!campaigns || !address) return 0;
    return campaigns
      .filter((c) => c.beneficiary.toLowerCase() === address.toLowerCase())
      .reduce((acc, c) => acc + Number(formatEther(c.withdrawn)) * 0.98, 0);
  }, [campaigns, address]);

  if (!isConnected || !address) {
    return (
      <div className="px-6 py-32 text-center max-w-md mx-auto">
        <div className="eyebrow mb-3">Operator console</div>
        <h1 className="display-lg mb-6">Connect your wallet.</h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Track campaigns you&apos;ve published, donations you&apos;ve made, and
          your full onchain footprint.
        </p>
        <div className="inline-block">
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-rule px-6 py-12 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 flex items-center gap-6">
          <Jazzicon seed={address} size={88} />
          <div className="min-w-0">
            <div className="eyebrow">Operator console</div>
            <h1 className="display-md mt-2 num truncate">
              {shortAddr(address)}
            </h1>
            <div className="eyebrow num mt-2">LitVM LiteForge testnet</div>
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-wrap gap-2 items-start lg:justify-end">
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(address);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              } catch {}
            }}
            className="border border-border-strong px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] hover:bg-foreground hover:text-background transition-colors"
          >
            {copied ? "✓ Copied" : "Copy address"}
          </button>
          <a
            href={`${EXPLORER_BASE}/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="border border-border-strong px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] hover:bg-foreground hover:text-background transition-colors"
          >
            Open in explorer ↗
          </a>
          <Link
            href="/new"
            className="bg-gold text-gold-foreground px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] hover:bg-foreground hover:text-background transition-colors"
          >
            Launch new
          </Link>
        </div>
      </header>

      <section className="border-b border-rule">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <StatTile
            label="Raised (yours)"
            value={totalRaised}
            decimals={4}
            suffix=" zk"
            note={`Across ${myCampaigns.length} campaign${myCampaigns.length === 1 ? "" : "s"}`}
          />
          <StatTile
            label="Given"
            value={totalDonated}
            decimals={4}
            suffix=" zk"
            note={`To ${myDonations.length} donation${myDonations.length === 1 ? "" : "s"}`}
          />
          <StatTile
            label="Withdrawn"
            value={totalWithdrawn}
            decimals={4}
            suffix=" zk"
            note="Net of 2% fee"
          />
          <StatTile
            label="Campaigns live"
            value={myCampaigns.filter((c) => c.status === "live").length}
            note="Of yours, accepting"
          />
        </div>
      </section>

      <nav className="px-6 border-b border-rule flex gap-1 overflow-x-auto">
        <TabBtn
          active={tab === "campaigns"}
          onClick={() => setTab("campaigns")}
          label="My campaigns"
          count={myCampaigns.length}
        />
        <TabBtn
          active={tab === "donations"}
          onClick={() => setTab("donations")}
          label="My donations"
          count={myDonations.length}
        />
        <TabBtn
          active={tab === "activity"}
          onClick={() => setTab("activity")}
          label="Onchain activity"
          count={myCampaigns.length + myDonations.length}
        />
      </nav>

      <div className="px-6 py-12">
        {tab === "campaigns" && (
          <>
            {myCampaigns.length === 0 ? (
              <EmptyState
                title="You haven't published yet."
                cta="Launch your first campaign"
                href="/new"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-border">
                {myCampaigns.map((c, i) => (
                  <div key={c.id} className="bg-background">
                    <CampaignCard c={c} index={i} />
                  </div>
                ))}
                <Link
                  href="/new"
                  className="bg-background border border-dashed border-border min-h-[320px] flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  <span className="font-display text-3xl">+</span>
                  <span className="eyebrow mt-3">Publish another</span>
                </Link>
              </div>
            )}
          </>
        )}
        {tab === "donations" && (
          <div className="max-w-3xl">
            {myDonations.length === 0 ? (
              <EmptyState
                title="You haven't given yet."
                cta="Browse campaigns"
                href="/"
              />
            ) : (
              myDonations.map((d, i) => (
                <DonationItem key={`${d.txHash}-${i}`} d={d} />
              ))
            )}
          </div>
        )}
        {tab === "activity" && (
          <div className="max-w-3xl border border-border divide-y divide-border font-mono text-xs">
            {[...myCampaigns.map((c) => ({
              type: "Create" as const,
              ts: c.createdAt,
              detail: c.title,
              ref: `c${c.id}`,
              amount: "",
            })), ...myDonations.map((d) => ({
              type: "Donate" as const,
              ts: 0,
              detail: `+${formatEther(d.amount)} zkLTC`,
              ref: `c${d.campaignId}`,
              amount: formatEther(d.amount),
            }))]
              .sort((a, b) => b.ts - a.ts)
              .slice(0, 20)
              .map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_120px_180px_80px] gap-4 px-4 py-3 hover:bg-accent/40 transition-colors"
                >
                  <span className="text-muted-foreground truncate">
                    {row.detail}
                  </span>
                  <span className="text-foreground uppercase tracking-[0.14em]">
                    {row.type}
                  </span>
                  <span className="num text-right text-muted-foreground">
                    {row.ts > 0
                      ? new Date(row.ts).toLocaleDateString()
                      : "…"}
                  </span>
                  <span className="text-right text-muted-foreground">
                    {row.ref}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}

function TabBtn({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "py-4 px-5 font-mono text-xs uppercase tracking-[0.18em] inline-flex items-center gap-2 border-b-2 -mb-px transition-colors",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {label}
      <span className="num text-[0.65rem] text-muted-foreground">[{count}]</span>
    </button>
  );
}

function EmptyState({
  title,
  cta,
  href,
}: {
  title: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="border border-dashed border-border py-20 text-center">
      <div className="eyebrow mb-3">Empty ledger</div>
      <h3 className="display-md">{title}</h3>
      <Link
        href={href}
        className="mt-6 inline-block border border-border-strong px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] hover:bg-foreground hover:text-background transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}
