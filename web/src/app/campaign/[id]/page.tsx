"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  Campaign,
  EXPLORER_BASE,
} from "@/lib/contract";
import { toDisplayCampaign } from "@/lib/display";
import { useDonationEvents } from "@/lib/events";
import { GoalProgress } from "@/components/GoalProgress";
import { DonationItem } from "@/components/DonationItem";
import { Jazzicon } from "@/components/Jazzicon";
import { useBlockHeight } from "@/components/BlockHeight";
import { categoryLabel, formatLTC, shortAddr, timeLeft } from "@/lib/format";

const PRESETS = [0.01, 0.05, 0.1, 0.5];

export default function CampaignPage() {
  const params = useParams();
  const id = BigInt(params.id as string);

  const campaignRead = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCampaign",
    args: [id],
    query: { refetchInterval: 8_000 },
  });

  const c = campaignRead.data as Campaign | undefined;
  const refetch = () => campaignRead.refetch();

  const { events: feed } = useDonationEvents(id);
  const donorCount = useMemo(() => {
    if (!feed) return 0;
    return new Set(feed.map((d) => d.donor.toLowerCase())).size;
  }, [feed]);

  if (campaignRead.isLoading) {
    return (
      <div className="px-6 py-32 text-center">
        <div className="eyebrow">Reading ledger</div>
        <h1 className="display-md mt-3">Loading campaign…</h1>
      </div>
    );
  }

  if (!c || !c.title) {
    return (
      <div className="px-6 py-32 text-center">
        <div className="eyebrow">Issue not found</div>
        <h1 className="display-lg mt-4">
          This campaign isn&apos;t on the ledger.
        </h1>
        <Link
          href="/"
          className="mt-8 inline-block border border-border-strong px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] hover:bg-foreground hover:text-background transition-colors"
        >
          Back to directory
        </Link>
      </div>
    );
  }

  const dc = toDisplayCampaign(c, donorCount);

  return (
    <>
      <header className="border-b border-rule">
        <div className="px-6 pt-10 pb-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/" className="hover:text-foreground">
              ← Directory
            </Link>
            <span>·</span>
            <span>Issue №{String(dc.issue).padStart(3, "0")}</span>
            <span>·</span>
            <span>{categoryLabel(dc.category)}</span>
            <span>·</span>
            <span className="text-foreground">
              {dc.mode === "AON" ? "All or nothing" : "Keep what you raise"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              {dc.status === "live" ? "Live" : dc.status}
            </span>
            <a
              href={`${EXPLORER_BASE}/address/${dc.beneficiary}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              {shortAddr(dc.beneficiary)}
            </a>
          </div>
        </div>
        <div className="px-6 pb-10">
          <h1 className="display-xl max-w-5xl">{dc.title}</h1>
          {dc.excerpt && (
            <p className="mt-6 max-w-3xl text-xl text-muted-foreground font-display italic leading-snug">
              {dc.excerpt}
            </p>
          )}
        </div>
        {dc.image ? (
          <>
            <div className="relative aspect-[21/9] border-y border-border overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dc.image}
                alt=""
                className="size-full object-cover"
              />
            </div>
            <figcaption className="px-6 py-3 eyebrow flex justify-between flex-wrap gap-2">
              <span>Field photograph · {categoryLabel(dc.category)}</span>
              <span>
                © LitGive — published onchain{" "}
                {new Date(dc.createdAt).toLocaleDateString()}
              </span>
            </figcaption>
          </>
        ) : (
          <div className="aspect-[21/9] border-y border-border halftone bg-secondary grid place-items-center">
            <span className="font-display text-6xl text-foreground/30 italic">
              {categoryLabel(dc.category)}
            </span>
          </div>
        )}
      </header>

      <div className="px-6 mt-16 grid lg:grid-cols-12 gap-12 lg:gap-16">
        <article className="lg:col-span-7 xl:col-span-8 lg:border-r lg:border-border lg:pr-12">
          <div className="eyebrow mb-6">The case</div>
          <div>
            <p className="first-letter:font-display first-letter:text-7xl first-letter:float-left first-letter:leading-[0.85] first-letter:mr-3 first-letter:mt-1 text-lg leading-relaxed">
              {dc.description || dc.excerpt}
            </p>
            {dc.pull && dc.pull !== dc.excerpt && (
              <blockquote className="my-12 border-l-2 border-gold pl-6 font-display text-3xl italic leading-snug">
                &quot;{dc.pull}&quot;
              </blockquote>
            )}
            <p className="text-lg leading-relaxed text-muted-foreground">
              Disbursements are recorded on LitVM. The 2% protocol fee is
              collected only at withdrawal time, not at donation time — your
              full gift moves to the campaign vault. If the campaign is
              structured as <em>All or nothing</em>, refunds are automatic and
              trustless should the goal not be met by the deadline.
            </p>

            <h3 className="font-display text-3xl mt-14 mb-4 tracking-tight">
              Terms of this campaign
            </h3>
            <dl className="grid sm:grid-cols-2 gap-px bg-border border border-border">
              <Term
                k="Mode"
                v={
                  dc.mode === "AON"
                    ? "All or nothing — refunds auto if goal missed"
                    : "Keep what you raise — withdraw any time"
                }
              />
              <Term k="Goal" v={`${formatLTC(dc.goal, dc.goal < 1 ? 4 : 2)} zkLTC`} />
              <Term
                k="Deadline"
                v={
                  dc.deadline > 0
                    ? new Date(dc.deadline).toLocaleString()
                    : "Open ended"
                }
              />
              <Term k="Protocol fee" v="2.00% at withdrawal" />
              <Term k="Beneficiary" v={shortAddr(dc.beneficiary)} />
              <Term k="Contract" v={shortAddr(CONTRACT_ADDRESS)} />
            </dl>
          </div>

          <section className="mt-20">
            <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
              <div>
                <div className="eyebrow">Timeline · onchain</div>
                <h3 className="display-md mt-2">
                  {feed?.length ?? 0} confirmed gift
                  {(feed?.length ?? 0) === 1 ? "" : "s"}
                </h3>
              </div>
              <LiveBlockLabel />
            </div>
            {feed === null ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 border-b border-border" />
                ))}
              </div>
            ) : feed.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No donations yet. Be the first to leave a mark on the ledger.
              </p>
            ) : (
              <div>
                {feed.map((d, i) => (
                  <DonationItem
                    key={`${d.txHash}-${i}`}
                    d={d}
                    flash={i === 0}
                  />
                ))}
              </div>
            )}
          </section>
        </article>

        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-32 space-y-6">
            <DonatePanel
              campaign={dc}
              raw={c}
              donors={donorCount}
              onSuccess={refetch}
            />
            <BeneficiaryNote address={dc.beneficiary} />
            <BeneficiaryActions raw={c} dc={dc} onSuccess={refetch} />
          </div>
        </aside>
      </div>
    </>
  );
}

function LiveBlockLabel() {
  const h = useBlockHeight();
  return (
    <span className="eyebrow num">
      Block #{h === 0n ? "—" : Number(h).toLocaleString("en-US")}
    </span>
  );
}

function Term({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-background p-5">
      <dt className="eyebrow">{k}</dt>
      <dd className="num mt-2 text-foreground">{v}</dd>
    </div>
  );
}

function DonatePanel({
  campaign,
  raw,
  donors,
  onSuccess,
}: {
  campaign: ReturnType<typeof toDisplayCampaign>;
  raw: Campaign;
  donors: number;
  onSuccess: () => void;
}) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("0.05");
  const [message, setMessage] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      onSuccess();
      const t = setTimeout(() => setMessage(""), 1500);
      return () => clearTimeout(t);
    }
  }, [isSuccess, onSuccess]);

  const amt = parseFloat(amount) || 0;
  const fee = amt * 0.02;
  const net = amt - fee;

  const deadlinePassed =
    campaign.deadline > 0 && Date.now() > campaign.deadline;
  const disabled = raw.status !== 0 || deadlinePassed;

  return (
    <div className="border border-rule">
      <div className="p-6 border-b border-border">
        <GoalProgress raised={campaign.raised} goal={campaign.goal} />
        <div className="mt-5 grid grid-cols-3 gap-px bg-border border-y border-border -mx-6">
          <Cell k="Donors" v={donors.toString()} />
          <Cell
            k="Left"
            v={campaign.deadline > 0 ? timeLeft(campaign.deadline) : "Open"}
          />
          <Cell
            k="Avg gift"
            v={
              donors > 0
                ? `${formatLTC(campaign.raised / donors, 3)} zk`
                : "—"
            }
          />
        </div>
      </div>

      {disabled ? (
        <div className="p-6 text-center">
          <div className="eyebrow mb-2">
            {raw.status !== 0 ? "Campaign closed" : "Deadline passed"}
          </div>
          <p className="text-sm text-muted-foreground">
            This campaign is no longer accepting donations.
          </p>
        </div>
      ) : !isConnected ? (
        <div className="p-6 space-y-4">
          <div className="eyebrow">Connect to give</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bring your wallet, leave your trust at the door. The contract does
            the rest.
          </p>
          <ConnectButton />
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <div>
            <div className="eyebrow mb-2">Amount · zkLTC</div>
            <div className="flex items-baseline border-b-2 border-foreground pb-2">
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^\d.]/g, ""))
                }
                className="w-full bg-transparent outline-none font-display text-5xl tracking-tight num"
                aria-label="Donation amount"
              />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                zkLTC
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className={[
                    "flex-1 py-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] border transition-colors",
                    String(p) === amount
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-border-strong",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow mb-2">Message · optional</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={140}
              placeholder="A line for the timeline."
              className="w-full bg-transparent border border-border focus:border-foreground outline-none p-3 text-sm font-display italic resize-none transition-colors"
            />
            <div className="eyebrow num mt-1 text-right">
              {message.length}/140
            </div>
          </div>

          <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] border border-border divide-y divide-border">
            <Row k="Your gift" v={`${formatLTC(amt, 4)} zkLTC`} />
            <Row k="Protocol fee" v={`${formatLTC(fee, 4)} zkLTC · 2%`} muted />
            <Row k="Reaches campaign" v={`${formatLTC(net, 4)} zkLTC`} strong />
          </div>

          <button
            disabled={amt <= 0 || isPending || isMining}
            onClick={() =>
              writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: "donate",
                args: [campaign.rawId, message],
                value: parseEther(amount),
              })
            }
            className="w-full bg-gold text-gold-foreground py-4 font-mono text-xs uppercase tracking-[0.22em] hover:bg-foreground hover:text-background disabled:opacity-40 transition-colors"
          >
            {isPending
              ? "Confirm in wallet…"
              : isMining
                ? "Mining…"
                : isSuccess
                  ? "✓ Signed & broadcast"
                  : `Sign & give ${formatLTC(amt, 4)} zkLTC`}
          </button>
          {hash && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-center"
            >
              <a
                href={`${EXPLORER_BASE}/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className={
                  isSuccess
                    ? "text-success hover:underline"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                {isSuccess ? "✓" : "⏳"} {shortAddr(hash)} ↗
              </a>
            </motion.div>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            By signing you broadcast a transaction to LitVM. Refunds are
            automatic for All-or-nothing campaigns.
          </p>
        </div>
      )}
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="px-3 py-3 text-center bg-card">
      <div className="eyebrow">{k}</div>
      <div className="num mt-1">{v}</div>
    </div>
  );
}
function Row({
  k,
  v,
  muted,
  strong,
}: {
  k: string;
  v: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={[
        "flex justify-between px-3 py-2.5",
        muted ? "text-muted-foreground" : "",
        strong ? "bg-secondary" : "",
      ].join(" ")}
    >
      <span>{k}</span>
      <span className="num">{v}</span>
    </div>
  );
}

function BeneficiaryNote({ address }: { address: string }) {
  return (
    <div className="border border-border p-5 flex gap-4 items-start">
      <Jazzicon seed={address} size={44} />
      <div className="text-xs leading-relaxed">
        <div className="eyebrow mb-1">Beneficiary</div>
        <div className="num text-foreground text-sm">{shortAddr(address)}</div>
        <p className="text-muted-foreground mt-2">
          This address signed the campaign manifest and is the only address
          authorized to withdraw.
        </p>
      </div>
    </div>
  );
}

function BeneficiaryActions({
  raw,
  dc,
  onSuccess,
}: {
  raw: Campaign;
  dc: ReturnType<typeof toDisplayCampaign>;
  onSuccess: () => void;
}) {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) onSuccess();
  }, [isSuccess, onSuccess]);

  if (!address || address.toLowerCase() !== dc.beneficiary.toLowerCase())
    return null;

  const canWithdraw = raw.status !== 1;
  const canCancel = raw.status === 0;

  return (
    <div className="border border-rule p-5 space-y-3">
      <div className="eyebrow">Operator console</div>
      <Link
        href={`/campaign/${dc.id}/edit`}
        className="block text-center border border-border-strong py-2.5 font-mono text-xs uppercase tracking-[0.18em] hover:bg-foreground hover:text-background transition-colors"
      >
        Edit narrative
      </Link>
      <button
        disabled={!canWithdraw || isPending || isMining}
        onClick={() =>
          writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "withdraw",
            args: [dc.rawId],
          })
        }
        className="w-full bg-gold text-gold-foreground py-2.5 font-mono text-xs uppercase tracking-[0.22em] hover:bg-foreground hover:text-background disabled:opacity-40 transition-colors"
      >
        Withdraw available
      </button>
      <button
        disabled={!canCancel || isPending || isMining}
        onClick={() =>
          writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "cancelCampaign",
            args: [dc.rawId],
          })
        }
        className="w-full border border-border py-2.5 font-mono text-xs uppercase tracking-[0.18em] hover:border-destructive hover:text-destructive transition-colors disabled:opacity-40"
      >
        Cancel campaign
      </button>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        For all-or-nothing campaigns, withdrawals only work after the deadline
        and once the goal is met.
      </p>
    </div>
  );
}
