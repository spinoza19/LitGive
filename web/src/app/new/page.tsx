"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress, parseEther } from "viem";
import { ImageIcon } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACT_ABI, CONTRACT_ADDRESS, EXPLORER_BASE } from "@/lib/contract";
import { GoalProgress } from "@/components/GoalProgress";
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

export default function NewCampaign() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [beneficiary, setBeneficiary] = useState("");
  const [title, setTitle] = useState("Untitled campaign");
  const [excerpt, setExcerpt] = useState(
    "A one-line summary, written like a headline.",
  );
  const [body, setBody] = useState(
    "Open with the why. Be specific. Use short sentences.\n\nList what funds buy, in plain numbers. Trust is built in detail.",
  );
  const [imageUrl, setImageUrl] = useState("");
  const [cat, setCat] = useState(CATS[0].value);
  const [mode, setMode] = useState<"KWYR" | "AON">("AON");
  const [goal, setGoal] = useState("1");
  const [days, setDays] = useState("21");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address && !beneficiary) {
      setBeneficiary(address);
    }
  }, [isConnected, address, beneficiary]);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeErr,
  } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => router.push("/"), 1500);
      return () => clearTimeout(t);
    }
  }, [isSuccess, router]);

  function publish() {
    setError(null);
    if (!isAddress(beneficiary)) {
      setError("Beneficiary must be a valid 0x address.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const goalWei = goal ? parseEther(goal) : 0n;
    const deadline =
      days && Number(days) > 0
        ? BigInt(Math.floor(Date.now() / 1000) + Number(days) * 86400)
        : 0n;
    if (mode === "AON" && (goalWei === 0n || deadline === 0n)) {
      setError(
        "All-or-nothing campaigns require both a goal and a deadline (in days).",
      );
      return;
    }

    const description = `${excerpt.trim()}\n\n${body.trim()}`.trim();

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "createCampaign",
      args: [
        beneficiary as `0x${string}`,
        title,
        description,
        imageUrl,
        cat,
        goalWei,
        deadline,
        mode === "AON" ? 1 : 0,
      ],
    });
  }

  return (
    <>
      <header className="border-b border-rule px-6 py-10">
        <div className="eyebrow flex justify-between flex-wrap gap-2">
          <span>Editor · Draft</span>
          <span className="num">
            {isPending
              ? "Awaiting signature…"
              : isMining
                ? "Mining…"
                : isSuccess
                  ? "Published ✓"
                  : "Autosaved · just now"}
          </span>
        </div>
        <h1 className="display-lg mt-4">Publish a campaign.</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Write it like an editor, not a form. The right side shows what donors
          will see.
        </p>
      </header>

      {!isConnected ? (
        <div className="px-6 py-20 text-center max-w-md mx-auto">
          <div className="eyebrow mb-3">Connect to publish</div>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            You&apos;ll sign one transaction. Your address becomes the
            beneficiary by default.
          </p>
          <div className="inline-block">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12">
          {/* Editor */}
          <div className="lg:col-span-7 xl:col-span-8 lg:border-r border-border px-6 lg:px-12 py-12 space-y-10">
            <section>
              <div className="eyebrow mb-3">Title</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full bg-transparent outline-none font-display text-5xl md:text-6xl leading-[0.95] tracking-tight border-b border-border focus:border-foreground pb-3 transition-colors"
              />
            </section>

            <section>
              <div className="eyebrow mb-3">Standfirst</div>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                className="w-full bg-transparent outline-none font-display italic text-2xl leading-snug text-foreground/85 border-b border-border focus:border-foreground pb-3 resize-none transition-colors"
              />
            </section>

            <section className="space-y-3">
              <div className="flex justify-between items-baseline">
                <div className="eyebrow">Cover</div>
                <span className="eyebrow">https URL · 16:9 recommended</span>
              </div>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/…"
                className="w-full bg-transparent border-b border-border focus:border-foreground py-3 outline-none font-mono text-sm transition-colors"
              />
              {!imageUrl && (
                <div className="aspect-[16/9] border border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <ImageIcon className="size-6" />
                  <span className="font-mono text-xs uppercase tracking-[0.18em]">
                    Paste an image URL above
                  </span>
                </div>
              )}
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full aspect-[16/9] object-cover border border-border"
                />
              )}
            </section>

            <section>
              <div className="eyebrow mb-3">Body</div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full bg-transparent outline-none font-display text-lg leading-relaxed border-b border-border focus:border-foreground pb-3 resize-none transition-colors"
              />
              <div className="eyebrow num text-right mt-2">
                {body.length} chars ·{" "}
                {Math.max(1, Math.ceil(body.split(/\s+/).length / 220))} min
                read
              </div>
            </section>

            <section>
              <div className="eyebrow mb-3">Beneficiary</div>
              <input
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-foreground py-3 outline-none font-mono text-sm transition-colors"
                placeholder="0x…"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Defaults to your connected wallet. Only this address can
                withdraw funds.
              </p>
            </section>

            <section className="grid sm:grid-cols-2 gap-px bg-border border border-border">
              <Field label="Category">
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="w-full bg-transparent font-mono text-sm outline-none cursor-pointer"
                >
                  {CATS.map((c) => (
                    <option key={c.value} value={c.value} className="bg-background">
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Goal (zkLTC)">
                <input
                  inputMode="decimal"
                  value={goal}
                  onChange={(e) =>
                    setGoal(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  className="w-full bg-transparent outline-none num text-lg"
                />
              </Field>
              <Field label="Deadline (days)">
                <input
                  inputMode="numeric"
                  value={days}
                  onChange={(e) =>
                    setDays(e.target.value.replace(/[^\d]/g, ""))
                  }
                  className="w-full bg-transparent outline-none num text-lg"
                />
              </Field>
              <Field label="Mode">
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <ModeChip
                    active={mode === "AON"}
                    onClick={() => setMode("AON")}
                    title="All or nothing"
                    desc="Refunds auto if goal missed"
                  />
                  <ModeChip
                    active={mode === "KWYR"}
                    onClick={() => setMode("KWYR")}
                    title="Keep what you raise"
                    desc="Withdraw any time"
                  />
                </div>
              </Field>
            </section>

            {error && (
              <div className="text-sm text-destructive font-mono uppercase tracking-[0.16em]">
                {error}
              </div>
            )}
            {writeErr && (
              <div className="text-sm text-destructive">
                {(writeErr as Error).message}
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
                  {isSuccess ? "✓ Published — " : "⏳ Pending — "}
                  {shortAddr(hash)} ↗
                </a>
              </div>
            )}

            <section className="flex flex-wrap items-center gap-4 pt-4 border-t border-rule">
              <button
                onClick={publish}
                disabled={isPending || isMining}
                className="bg-gold text-gold-foreground px-8 py-4 font-mono text-xs uppercase tracking-[0.22em] hover:bg-foreground hover:text-background disabled:opacity-40 transition-colors"
              >
                {isPending
                  ? "Confirm in wallet…"
                  : isMining
                    ? "Mining…"
                    : "Sign & publish onchain"}
              </button>
              <span className="eyebrow">
                One signature · gas paid in zkLTC
              </span>
            </section>
          </div>

          {/* Live preview */}
          <aside className="lg:col-span-5 xl:col-span-4 bg-secondary/40">
            <div className="lg:sticky lg:top-32 p-8 lg:p-10 space-y-8">
              <div className="flex justify-between items-baseline">
                <div className="eyebrow">Live preview</div>
                <span className="eyebrow num">Donor view</span>
              </div>
              <div className="border border-border bg-background">
                <div className="aspect-[4/3] halftone border-b border-border relative overflow-hidden bg-muted">
                  {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <div className="eyebrow">
                    {categoryLabel(cat)} · {mode}
                  </div>
                  <h3 className="font-display text-2xl leading-[1.05] tracking-tight">
                    {title || "Untitled campaign"}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {excerpt}
                  </p>
                  <div className="pt-2">
                    <GoalProgress
                      raised={0}
                      goal={parseFloat(goal) || 1}
                      showLabels={false}
                    />
                    <div className="flex justify-between mt-3 num text-xs text-muted-foreground">
                      <span>
                        0 / {formatLTC(parseFloat(goal) || 0)} zkLTC
                      </span>
                      <span>{days || 0}d left</span>
                    </div>
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <Tip>
                  The first paragraph is what donors read first. Lead with
                  stakes, not story.
                </Tip>
                <Tip>
                  Title, mode, goal, and deadline are immutable after publish.
                </Tip>
                <Tip>The 2% protocol fee is taken once, at withdrawal.</Tip>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background p-5">
      <div className="eyebrow mb-2">{label}</div>
      {children}
    </div>
  );
}
function ModeChip({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left p-3 border transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "border-border hover:border-border-strong",
      ].join(" ")}
    >
      <div className="font-mono text-[0.7rem] uppercase tracking-[0.18em]">
        {title}
      </div>
      <div className="text-[0.72rem] opacity-75 mt-1">{desc}</div>
    </button>
  );
}
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="text-gold mt-1.5">▍</span>
      <span>{children}</span>
    </li>
  );
}
