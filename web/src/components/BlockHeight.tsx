"use client";

import { useBlockNumber } from "wagmi";

export function useBlockHeight(): bigint {
  const { data } = useBlockNumber({
    watch: true,
    query: { refetchInterval: 4000 },
  });
  return data ?? 0n;
}

export function BlockHeight({ className }: { className?: string }) {
  const h = useBlockHeight();
  return (
    <span className={className}>
      <span className="inline-block size-1.5 rounded-full bg-success mr-2 align-middle animate-pulse" />
      <span className="num">
        #{h === 0n ? "…" : Number(h).toLocaleString("en-US")}
      </span>
    </span>
  );
}
