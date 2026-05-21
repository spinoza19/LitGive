"use client";

import { Confetti } from "./Confetti";
import { ShareButton } from "./ShareButton";
import { EXPLORER_BASE } from "@/lib/contract";

export function DonationSuccessModal({
  open,
  onClose,
  amount,
  campaignTitle,
  campaignUrl,
  txHash,
}: {
  open: boolean;
  onClose: () => void;
  amount: string;
  campaignTitle: string;
  campaignUrl: string;
  txHash?: `0x${string}`;
}) {
  if (!open) return null;

  const shareText = `I just donated ${amount} zkLTC to "${campaignTitle}" on @LitecoinVM via LitGive 💚`;

  return (
    <>
      <Confetti />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-3xl">
            💚
          </div>
          <h2 className="text-xl font-bold">Thank you!</h2>
          <p className="mt-2 text-sm text-muted">
            Your donation of <span className="text-white font-semibold">{amount} zkLTC</span>{" "}
            to <span className="text-white">&quot;{campaignTitle}&quot;</span> is live
            onchain.
          </p>

          {txHash && (
            <a
              href={`${EXPLORER_BASE}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs text-accent hover:underline"
            >
              View transaction →
            </a>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <ShareButton url={campaignUrl} title={campaignTitle} text={shareText} />
            <button onClick={onClose} className="btn-secondary text-xs">
              Close
            </button>
          </div>

          <p className="mt-5 text-[11px] text-muted">
            Sharing helps the cause reach more donors.
          </p>
        </div>
      </div>
    </>
  );
}
