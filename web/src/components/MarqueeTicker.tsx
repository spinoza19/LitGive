"use client";

import { useDonationEvents } from "@/lib/events";
import { formatLTC, shortAddr } from "@/lib/format";
import { formatEther } from "viem";

export function MarqueeTicker() {
  const { events } = useDonationEvents();
  const donations = (events ?? []).slice(0, 12);

  // If no donations yet, render a discreet placeholder strip.
  const items =
    donations.length > 0
      ? [...donations, ...donations, ...donations]
      : [];

  return (
    <div className="border-y border-rule overflow-hidden bg-foreground text-background">
      <div className="flex">
        {items.length > 0 ? (
          <>
            <div className="marquee-track flex shrink-0 whitespace-nowrap will-change-transform">
              {items.map((d, i) => (
                <Item
                  key={i}
                  donor={d.donor}
                  amount={Number(formatEther(d.amount))}
                  message={d.message}
                />
              ))}
            </div>
            <div
              className="marquee-track flex shrink-0 whitespace-nowrap will-change-transform"
              aria-hidden
            >
              {items.map((d, i) => (
                <Item
                  key={"b" + i}
                  donor={d.donor}
                  amount={Number(formatEther(d.amount))}
                  message={d.message}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-2 font-mono text-xs uppercase tracking-[0.18em] opacity-60">
            <span className="text-gold">●</span> Live ledger · waiting for the first
            transaction…
          </div>
        )}
      </div>
    </div>
  );
}

function Item({
  donor,
  amount,
  message,
}: {
  donor: string;
  amount: number;
  message?: string;
}) {
  return (
    <span className="inline-flex items-center gap-3 px-6 py-2 font-mono text-xs uppercase tracking-[0.18em] border-r border-background/15">
      <span className="text-gold">●</span>
      <span>{shortAddr(donor)}</span>
      <span className="opacity-60">gave</span>
      <span className="num">{formatLTC(amount, 4)} zkLTC</span>
      {message && (
        <span className="italic opacity-70 normal-case tracking-normal max-w-[280px] truncate">
          &quot;{message}&quot;
        </span>
      )}
    </span>
  );
}
