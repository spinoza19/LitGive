"use client";

import { EXPLORER_BASE } from "@/lib/contract";

export function TxStatus({
  hash,
  isMining,
  isSuccess,
}: {
  hash?: `0x${string}`;
  isMining?: boolean;
  isSuccess?: boolean;
}) {
  if (!hash) return null;
  return (
    <div className="text-xs text-muted">
      {isMining && "⏳ mining…"}
      {isSuccess && "✅ confirmed"}{" "}
      <a
        href={`${EXPLORER_BASE}/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-white"
      >
        view tx
      </a>
    </div>
  );
}
