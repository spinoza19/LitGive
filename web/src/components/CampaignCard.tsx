"use client";

import Link from "next/link";
import { Campaign, MODE_LABEL, STATUS_LABEL } from "@/lib/contract";
import { fmtEth, timeLeft, categoryEmoji } from "@/lib/format";

function statusColor(status: number) {
  switch (status) {
    case 0: return "bg-emerald-500/15 text-emerald-300";
    case 1: return "bg-zinc-500/15 text-zinc-300";
    case 2: return "bg-sky-500/15 text-sky-300";
    case 3: return "bg-rose-500/15 text-rose-300";
    default: return "bg-zinc-500/15 text-zinc-300";
  }
}

export function CampaignCard({ c }: { c: Campaign }) {
  const goalEth = Number(fmtEth(c.goal, 8));
  const raisedEth = Number(fmtEth(c.raised, 8));
  const pct = goalEth > 0 ? Math.min(100, (raisedEth / goalEth) * 100) : null;
  const tl = c.deadline > 0n ? timeLeft(c.deadline) : null;

  return (
    <Link
      href={`/campaign/${c.id.toString()}`}
      className="group card hover:border-accent transition flex flex-col gap-3 overflow-hidden"
    >
      {c.imageURI ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.imageURI}
          alt=""
          className="-mx-5 -mt-5 mb-2 h-40 w-[calc(100%+2.5rem)] object-cover"
          loading="lazy"
        />
      ) : (
        <div className="-mx-5 -mt-5 mb-2 h-40 w-[calc(100%+2.5rem)] bg-gradient-to-br from-accent2/40 via-bg to-accent/30 flex items-center justify-center text-5xl">
          {categoryEmoji(c.category)}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-white line-clamp-2 group-hover:text-accent">
            {c.title}
          </h3>
          <div className="text-xs text-muted mt-0.5">
            #{c.id.toString()} · {categoryEmoji(c.category)} {c.category || "uncategorized"}
          </div>
        </div>
        <span className={`badge shrink-0 ${statusColor(c.status)}`}>
          {STATUS_LABEL[c.status]}
        </span>
      </div>

      <p className="text-sm text-muted line-clamp-2 min-h-[2.5em]">
        {c.description || "—"}
      </p>

      <div>
        <div className="flex items-end justify-between gap-2 text-sm">
          <div>
            <span className="text-white font-semibold">{fmtEth(c.raised, 4)}</span>{" "}
            <span className="text-muted">zkLTC raised</span>
          </div>
          {goalEth > 0 && (
            <div className="text-xs text-muted">goal {goalEth.toFixed(4)}</div>
          )}
        </div>
        {pct !== null && (
          <div className="mt-2 h-1.5 w-full rounded bg-border overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted">
        <span>{MODE_LABEL[c.mode]}</span>
        {tl && (
          <span className={tl.urgent ? "text-amber-300" : ""}>
            {tl.text}
          </span>
        )}
      </div>
    </Link>
  );
}
