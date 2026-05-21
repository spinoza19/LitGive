import { Jazzicon } from "@/components/Jazzicon";
import { formatLTC, shortAddr, timeAgo } from "@/lib/format";
import { EXPLORER_BASE } from "@/lib/contract";
import { formatEther } from "viem";
import type { DonationEvent } from "@/lib/events";

export function DonationItem({
  d,
  flash,
}: {
  d: DonationEvent;
  flash?: boolean;
}) {
  const amount = Number(formatEther(d.amount));
  return (
    <div
      className={`grid grid-cols-[36px_1fr_auto] gap-3 items-start py-3 border-b border-border ${
        flash ? "flash-once" : ""
      }`}
    >
      <Jazzicon seed={d.donor} size={32} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <a
            href={`${EXPLORER_BASE}/address/${d.donor}`}
            target="_blank"
            rel="noreferrer"
            className="num text-sm text-muted-foreground hover:text-foreground"
          >
            {shortAddr(d.donor)}
          </a>
          <span className="text-xs text-muted-foreground">·</span>
          <a
            href={`${EXPLORER_BASE}/tx/${d.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="num text-xs text-muted-foreground hover:text-foreground"
            title="View transaction"
          >
            tx ↗
          </a>
        </div>
        {d.message && (
          <p className="font-display italic text-[15px] mt-1 leading-snug text-foreground/85">
            &quot;{d.message}&quot;
          </p>
        )}
      </div>
      <div className="text-right">
        <div className="num text-base">
          <span className="text-gold">+{formatLTC(amount, 4)}</span>
        </div>
        <div className="eyebrow num">zkLTC</div>
      </div>
    </div>
  );
}
