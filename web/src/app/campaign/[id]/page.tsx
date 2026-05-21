"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  Campaign,
  MODE_LABEL,
  STATUS_LABEL,
  EXPLORER_BASE,
} from "@/lib/contract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TxStatus } from "@/components/TxStatus";
import { fmtEth, timeLeft, categoryEmoji } from "@/lib/format";
import { DonationsFeed } from "@/components/DonationsFeed";
import { ShareButton } from "@/components/ShareButton";
import { DonationSuccessModal } from "@/components/DonationSuccessModal";

function statusBadge(status: number) {
  const map: Record<number, string> = {
    0: "bg-emerald-500/15 text-emerald-300",
    1: "bg-zinc-500/15 text-zinc-300",
    2: "bg-sky-500/15 text-sky-300",
    3: "bg-rose-500/15 text-rose-300",
  };
  return map[status] ?? "bg-zinc-500/15 text-zinc-300";
}

export default function CampaignPage() {
  const params = useParams();
  const id = BigInt(params.id as string);

  const { address } = useAccount();

  const campaignRead = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCampaign",
    args: [id],
    query: { refetchInterval: 8_000 },
  });

  const feeRead = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "platformFeeBps",
  });

  const myContribRead = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "contributions",
    args: address ? [address, id] : undefined,
    query: { enabled: !!address, refetchInterval: 8_000 },
  });

  const c = campaignRead.data as Campaign | undefined;
  const feeBps = (feeRead.data as number | undefined) ?? 0;
  const myContribution = (myContribRead.data as bigint | undefined) ?? 0n;

  const refetchAll = () => {
    campaignRead.refetch();
    myContribRead.refetch();
  };

  if (campaignRead.isLoading) {
    return (
      <div className="space-y-4">
        <div className="card animate-pulse h-48" />
        <div className="card animate-pulse h-32" />
      </div>
    );
  }
  if (!c) return <div className="text-rose-400">Campaign not found.</div>;

  const isBeneficiary =
    address && address.toLowerCase() === c.beneficiary.toLowerCase();

  const goalEth = Number(fmtEth(c.goal, 8));
  const raisedEth = Number(fmtEth(c.raised, 8));
  const pct = goalEth > 0 ? Math.min(100, (raisedEth / goalEth) * 100) : null;
  const tl = c.deadline > 0n ? timeLeft(c.deadline) : null;
  const deadlinePassed = !!tl && tl.passed;

  const campaignUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/campaign/${c.id.toString()}`
      : `/campaign/${c.id.toString()}`;
  const shareText = `Support "${c.title}" on @LitecoinVM via LitGive 💚`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-xs text-muted hover:text-white">
          ← Back to campaigns
        </Link>
        <ShareButton url={campaignUrl} title={c.title} text={shareText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold">{c.title}</h1>
                <div className="text-xs text-muted mt-1">
                  #{c.id.toString()} · {categoryEmoji(c.category)}{" "}
                  {c.category || "uncategorized"} · {MODE_LABEL[c.mode]}
                </div>
              </div>
              <span className={`badge shrink-0 ${statusBadge(c.status)}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </div>

            {c.imageURI ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.imageURI}
                alt=""
                className="w-full max-h-96 object-cover rounded-lg border border-border my-4"
              />
            ) : (
              <div className="my-4 h-48 rounded-lg border border-border bg-gradient-to-br from-accent2/40 via-bg to-accent/30 flex items-center justify-center text-6xl">
                {categoryEmoji(c.category)}
              </div>
            )}

            <p className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">
              {c.description || "—"}
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Activity</h3>
            <DonationsFeed campaignId={c.id} limit={20} />
          </div>

          <div className="card text-xs space-y-2">
            <Row
              label="Beneficiary"
              value={c.beneficiary}
              href={`${EXPLORER_BASE}/address/${c.beneficiary}`}
              mono
            />
            <Row
              label="Created"
              value={new Date(Number(c.createdAt) * 1000).toLocaleString()}
            />
            {c.deadline > 0n && (
              <Row
                label="Deadline"
                value={new Date(Number(c.deadline) * 1000).toLocaleString()}
              />
            )}
            <Row
              label="Withdrawn"
              value={`${fmtEth(c.withdrawn)} zkLTC (gross)`}
            />
            <Row label="Platform fee" value={`${feeBps / 100}%`} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="text-3xl font-bold">
              {fmtEth(c.raised, 4)}{" "}
              <span className="text-sm font-normal text-muted">zkLTC raised</span>
            </div>
            {goalEth > 0 && (
              <div className="text-xs text-muted mt-1">
                goal {goalEth.toFixed(4)} zkLTC
              </div>
            )}
            {pct !== null && (
              <div className="mt-3 h-2 w-full rounded bg-border overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            {tl && (
              <div
                className={`mt-3 text-xs ${
                  tl.urgent ? "text-amber-300" : "text-muted"
                }`}
              >
                {tl.passed ? "Campaign ended" : tl.text}
              </div>
            )}
          </div>

          <DonatePanel
            campaign={c}
            deadlinePassed={deadlinePassed}
            campaignUrl={campaignUrl}
            onSuccess={refetchAll}
          />

          {address && myContribution > 0n && (
            <div className="card text-sm">
              <div className="text-muted text-xs uppercase tracking-wider mb-1">
                Your contribution
              </div>
              <div className="font-semibold">
                {fmtEth(myContribution)} zkLTC
              </div>
              <RefundButton
                campaignId={c.id}
                eligible={
                  c.mode === 1 &&
                  (c.status === 1 ||
                    c.status === 3 ||
                    (c.status === 0 && deadlinePassed && c.raised < c.goal))
                }
                onSuccess={refetchAll}
              />
            </div>
          )}

          {isBeneficiary && <BeneficiaryPanel campaign={c} onSuccess={refetchAll} />}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  const inner = href ? (
    <a
      className="hover:text-accent underline"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value}
    </a>
  ) : (
    value
  );
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className={mono ? "font-mono" : ""}>{inner}</span>
    </div>
  );
}

function DonatePanel({
  campaign,
  deadlinePassed,
  campaignUrl,
  onSuccess,
}: {
  campaign: Campaign;
  deadlinePassed: boolean;
  campaignUrl: string;
  onSuccess: () => void;
}) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("0.01");
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAmount, setLastAmount] = useState("0");
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      onSuccess();
    }
  }, [isSuccess, onSuccess]);

  const disabled = campaign.status !== 0 || deadlinePassed;

  function donate() {
    setLastAmount(amount);
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "donate",
      args: [campaign.id, message],
      value: parseEther(amount),
    });
  }

  function closeSuccess() {
    setShowSuccess(false);
    setMessage("");
    reset();
  }

  return (
    <>
      <div className="card space-y-3">
        <div className="text-sm font-semibold">Donate</div>

        {disabled ? (
          <div className="text-xs text-muted">
            {campaign.status !== 0
              ? "This campaign is not active."
              : "The deadline has passed."}
          </div>
        ) : !isConnected ? (
          <div>
            <div className="mb-2 text-xs text-muted">Connect to donate.</div>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div>
              <label className="label">Amount (zkLTC)</label>
              <input
                className="input"
                type="number"
                step="0.0001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="mt-2 flex gap-2 text-xs">
                {["0.01", "0.05", "0.1", "0.5"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className="rounded border border-border px-2 py-0.5 text-muted hover:border-accent hover:text-white"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Message (optional, public)</label>
              <input
                className="input"
                maxLength={200}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Good luck!"
              />
            </div>
            <button
              disabled={isPending || isMining || !amount || Number(amount) <= 0}
              className="btn-primary w-full"
              onClick={donate}
            >
              {isPending
                ? "Confirm…"
                : isMining
                ? "Mining…"
                : `Donate ${amount} zkLTC`}
            </button>
            <TxStatus hash={hash} isMining={isMining} isSuccess={isSuccess} />
          </>
        )}
      </div>

      <DonationSuccessModal
        open={showSuccess}
        onClose={closeSuccess}
        amount={lastAmount}
        campaignTitle={campaign.title}
        campaignUrl={campaignUrl}
        txHash={hash}
      />
    </>
  );
}

function BeneficiaryPanel({
  campaign,
  onSuccess,
}: {
  campaign: Campaign;
  onSuccess: () => void;
}) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) onSuccess();
  }, [isSuccess, onSuccess]);

  const canWithdraw =
    campaign.status === 0 || campaign.status === 1 || campaign.status === 2;
  const canCancel = campaign.status === 0;

  return (
    <div className="card space-y-3">
      <div className="text-sm font-semibold">Beneficiary actions</div>

      <Link
        href={`/campaign/${campaign.id.toString()}/edit`}
        className="btn-secondary w-full text-xs"
      >
        Edit description / image
      </Link>

      <button
        disabled={!canWithdraw || isPending || isMining}
        className="btn-primary w-full"
        onClick={() =>
          writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "withdraw",
            args: [campaign.id],
          })
        }
      >
        Withdraw available
      </button>

      <button
        disabled={!canCancel || isPending || isMining}
        className="btn-secondary w-full"
        onClick={() =>
          writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "cancelCampaign",
            args: [campaign.id],
          })
        }
      >
        Cancel campaign
      </button>

      <TxStatus hash={hash} isMining={isMining} isSuccess={isSuccess} />

      <p className="text-[11px] text-muted">
        For all-or-nothing campaigns, withdrawals only work after the deadline
        and once the goal is met.
      </p>
    </div>
  );
}

function RefundButton({
  campaignId,
  eligible,
  onSuccess,
}: {
  campaignId: bigint;
  eligible: boolean;
  onSuccess: () => void;
}) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) onSuccess();
  }, [isSuccess, onSuccess]);

  return (
    <div className="mt-2">
      <button
        disabled={!eligible || isPending || isMining}
        className="btn-secondary w-full text-xs"
        onClick={() =>
          writeContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "refund",
            args: [campaignId],
          })
        }
        title={eligible ? "Pull a full refund" : "Refund not available"}
      >
        Refund my contribution
      </button>
      <TxStatus hash={hash} isMining={isMining} isSuccess={isSuccess} />
    </div>
  );
}
