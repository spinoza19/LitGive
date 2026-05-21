"use client";

import Link from "next/link";
import { useDonationEvents } from "@/lib/events";
import { fmtEth, shortAddr } from "@/lib/format";
import { EXPLORER_BASE } from "@/lib/contract";

/**
 * Activity feed for a single campaign (or all campaigns when no id is passed).
 */
export function DonationsFeed({
  campaignId,
  limit = 50,
  showCampaignLink = false,
}: {
  campaignId?: bigint;
  limit?: number;
  showCampaignLink?: boolean;
}) {
  const { events, error } = useDonationEvents(campaignId);

  if (error) {
    return (
      <div className="text-xs text-rose-400">
        Couldn&apos;t load activity: {error.message}
      </div>
    );
  }

  if (events === null) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card animate-pulse h-12" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-xs text-muted">No donations yet. Be the first.</div>
    );
  }

  return (
    <ul className="space-y-2">
      {events.slice(0, limit).map((e) => (
        <li
          key={`${e.txHash}-${e.donor}`}
          className="rounded-lg border border-border bg-panel/60 p-3 text-sm"
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-white font-semibold">
                {fmtEth(e.amount, 4)} zkLTC
              </span>{" "}
              <span className="text-muted">from</span>{" "}
              <a
                href={`${EXPLORER_BASE}/address/${e.donor}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs hover:text-accent"
              >
                {shortAddr(e.donor)}
              </a>
              {showCampaignLink && (
                <>
                  {" "}
                  <span className="text-muted">to</span>{" "}
                  <Link
                    href={`/campaign/${e.campaignId.toString()}`}
                    className="text-accent hover:underline"
                  >
                    #{e.campaignId.toString()}
                  </Link>
                </>
              )}
            </div>
            <a
              href={`${EXPLORER_BASE}/tx/${e.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-[11px] text-muted hover:text-white"
              title="View transaction"
            >
              tx ↗
            </a>
          </div>
          {e.message && (
            <div className="mt-1 text-xs text-zinc-400 italic">
              &ldquo;{e.message}&rdquo;
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
