"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Lock } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACT_ABI, CONTRACT_ADDRESS, Campaign, EXPLORER_BASE } from "@/lib/contract";
import { categoryLabel, formatLTC, shortAddr } from "@/lib/format";

const CATS = [
  { value: "charity", label: "Humanitarian" },
  { value: "personal", label: "Medical" },
  { value: "public-good", label: "Public Good" },
  { value: "education", label: "Education" },
  { value: "creator", label: "Creators" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" },
];

export default function EditCampaign() {
  const params = useParams();
  const router = useRouter();
  const id = BigInt(params.id as string);
  const { address, isConnected } = useAccount();

  const { data: campaign, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCampaign",
    args: [id],
  }) as { data: Campaign | undefined; isLoading: boolean };

  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [category, setCategory] = useState("charity");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (campaign && !hydrated) {
      // Split description back into excerpt + body using the same heuristic
      const desc = campaign.description?.trim() || "";
      const split = desc.indexOf("\n\n");
      if (split !== -1) {
        setExcerpt(desc.slice(0, split).trim());
        setBody(desc.slice(split + 2).trim());
      } else {
        setExcerpt(desc);
        setBody("");
      }
      setImageURI(campaign.imageURI || "");
      setCategory(campaign.category || "charity");
      setHydrated(true);
    }
  }, [campaign, hydrated]);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => router.push(`/campaign/${id.toString()}`), 1500);
      return () => clearTimeout(t);
    }
  }, [isSuccess, id, router]);

  if (isLoading || !campaign) {
    return (
      <div className="px-6 py-32 text-center">
        <div className="eyebrow">Reading ledger</div>
        <h1 className="display-md mt-3">Loading…</h1>
      </div>
    );
  }

  const isBeneficiary =
    address && address.toLowerCase() === campaign.beneficiary.toLowerCase();

  if (!isConnected) {
    return (
      <div className="px-6 py-32 text-center max-w-md mx-auto">
        <div className="eyebrow mb-3">Restricted</div>
        <h1 className="display-md mb-6">Connect the beneficiary wallet.</h1>
        <div className="inline-block">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isBeneficiary) {
    return (
      <div className="px-6 py-32 text-center max-w-md mx-auto">
        <div className="eyebrow mb-3 text-destructive">Permission denied</div>
        <h1 className="display-md mb-6">
          Only the beneficiary can edit this campaign.
        </h1>
        <Link
          href={`/campaign/${id.toString()}`}
          className="inline-block border border-border-strong px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] hover:bg-foreground hover:text-background transition-colors"
        >
          ← Back to campaign
        </Link>
      </div>
    );
  }

  function save() {
    const description = `${excerpt.trim()}\n\n${body.trim()}`.trim();
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "updateMetadata",
      args: [id, description, imageURI, category],
    });
  }

  const issue = Number(campaign.id);

  return (
    <>
      <header className="border-b border-rule px-6 py-10">
        <div className="eyebrow flex justify-between flex-wrap gap-2">
          <Link
            href={`/campaign/${id.toString()}`}
            className="hover:text-foreground"
          >
            ← Back to campaign
          </Link>
          <span>Editor · Issue №{String(issue).padStart(3, "0")}</span>
        </div>
        <h1 className="display-lg mt-4">Edit campaign.</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Only narrative fields can change. The contract terms are immutable to
          protect donors.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 px-6 py-12 gap-12">
        <div className="lg:col-span-7 xl:col-span-8 space-y-10">
          <section>
            <div className="eyebrow mb-3 flex items-center gap-2">
              Title <LockedTag />
            </div>
            <div className="font-display text-4xl leading-tight tracking-tight text-muted-foreground">
              {campaign.title}
            </div>
          </section>

          <section>
            <div className="eyebrow mb-3">Standfirst</div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full bg-transparent outline-none font-display italic text-2xl leading-snug border-b border-border focus:border-foreground pb-3 resize-none transition-colors"
            />
          </section>

          <section>
            <div className="eyebrow mb-3">Body</div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full bg-transparent outline-none font-display text-lg leading-relaxed border-b border-border focus:border-foreground pb-3 resize-none transition-colors"
            />
          </section>

          <section>
            <div className="eyebrow mb-3">Cover image URL</div>
            <input
              value={imageURI}
              onChange={(e) => setImageURI(e.target.value)}
              placeholder="https://…"
              className="w-full bg-transparent border-b border-border focus:border-foreground py-3 outline-none font-mono text-sm transition-colors"
            />
          </section>

          <section>
            <div className="eyebrow mb-3">Category</div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent border-b border-border focus:border-foreground py-3 outline-none font-mono text-sm cursor-pointer"
            >
              {CATS.map((c) => (
                <option key={c.value} value={c.value} className="bg-background">
                  {c.label}
                </option>
              ))}
            </select>
          </section>

          {error && (
            <div className="text-sm text-destructive">
              {(error as Error).message}
            </div>
          )}
          {hash && (
            <div className="font-mono text-[0.7rem] uppercase tracking-[0.16em]">
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
                {isSuccess ? "✓ Saved. " : "⏳ Pending. "}
                {shortAddr(hash)} ↗
              </a>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-4 border-t border-rule">
            <button
              onClick={save}
              disabled={isPending || isMining}
              className="bg-gold text-gold-foreground px-6 py-3 font-mono text-xs uppercase tracking-[0.22em] hover:bg-foreground hover:text-background disabled:opacity-40 transition-colors"
            >
              {isPending
                ? "Confirm in wallet…"
                : isMining
                  ? "Mining…"
                  : "Sign update"}
            </button>
            <Link
              href={`/campaign/${id.toString()}`}
              className="border border-border-strong px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] hover:bg-foreground hover:text-background transition-colors"
            >
              Discard
            </Link>
          </div>
        </div>

        <aside className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="border border-rule p-6 space-y-3">
            <div className="eyebrow">Immutable contract terms</div>
            <Row k="Mode" v={Number(campaign.mode) === 1 ? "All or nothing" : "Keep what you raise"} />
            <Row
              k="Goal"
              v={`${formatLTC(Number(campaign.goal) / 1e18, 2)} zkLTC`}
            />
            <Row
              k="Deadline"
              v={
                Number(campaign.deadline) > 0
                  ? new Date(Number(campaign.deadline) * 1000).toLocaleDateString()
                  : "Open ended"
              }
            />
            <Row k="Beneficiary" v={shortAddr(campaign.beneficiary)} />
            <Row k="Category (current)" v={categoryLabel(campaign.category)} />
            <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
              These were committed at publish time and cannot be altered. To
              change them, cancel and republish. Donors will receive refunds.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-sm border-b border-border pb-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="num">{v}</span>
    </div>
  );
}
function LockedTag() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-[0.6rem] text-muted-foreground normal-case tracking-normal">
      <Lock className="size-3" /> immutable
    </span>
  );
}
