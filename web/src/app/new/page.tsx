"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, isAddress } from "viem";
import { useRouter } from "next/navigation";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TxStatus } from "@/components/TxStatus";

export default function NewCampaignPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [form, setForm] = useState({
    beneficiary: "",
    title: "",
    description: "",
    imageURI: "",
    category: "charity",
    goalEth: "",
    deadline: "", // YYYY-MM-DDTHH:mm
    mode: "0" as "0" | "1",
  });
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending, error: writeErr } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Pre-fill beneficiary with the connected wallet on first connect
  if (isConnected && address && !form.beneficiary) {
    setForm((f) => ({ ...f, beneficiary: address }));
  }

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isConnected) {
      setError("Connect your wallet first.");
      return;
    }
    if (!isAddress(form.beneficiary)) {
      setError("Beneficiary must be a valid 0x address.");
      return;
    }
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    const goal = form.goalEth ? parseEther(form.goalEth) : 0n;
    const deadline = form.deadline
      ? BigInt(Math.floor(new Date(form.deadline).getTime() / 1000))
      : 0n;
    const mode = Number(form.mode) as 0 | 1;

    if (mode === 1 && (goal === 0n || deadline === 0n)) {
      setError("All-or-nothing campaigns require both a goal and a deadline.");
      return;
    }
    if (deadline !== 0n && deadline <= BigInt(Math.floor(Date.now() / 1000))) {
      setError("Deadline must be in the future.");
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "createCampaign",
      args: [
        form.beneficiary as `0x${string}`,
        form.title,
        form.description,
        form.imageURI,
        form.category,
        goal,
        deadline,
        mode,
      ],
    });
  }

  if (isSuccess) {
    // Naive: reload home in a moment so listings refresh.
    setTimeout(() => router.push("/"), 1500);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Start a campaign</h1>
      <p className="text-sm text-muted mb-6">
        Deploy a public donation campaign on LitVM. Anyone with an EVM wallet can
        donate zkLTC. A small platform fee is taken at withdrawal time.
      </p>

      {!isConnected ? (
        <div className="card text-center">
          <p className="mb-4 text-muted">Connect your wallet to get started.</p>
          <div className="inline-block">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label className="label">Beneficiary address</label>
            <input
              className="input font-mono text-xs"
              placeholder="0x..."
              value={form.beneficiary}
              onChange={(e) => update("beneficiary", e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted">
              Where withdrawals are sent. Defaults to your wallet.
            </p>
          </div>

          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              maxLength={200}
              placeholder="e.g. Help rebuild Atlas school"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Tell donors why this matters."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              >
                <option value="charity">Charity</option>
                <option value="creator">Creator</option>
                <option value="public-good">Public good</option>
                <option value="personal">Personal</option>
                <option value="religious">Religious / Zakat</option>
                <option value="emergency">Emergency relief</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Image URL (optional)</label>
              <input
                className="input"
                placeholder="https:// or ipfs://"
                value={form.imageURI}
                onChange={(e) => update("imageURI", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Mode</label>
              <select
                className="input"
                value={form.mode}
                onChange={(e) => update("mode", e.target.value as "0" | "1")}
              >
                <option value="0">Keep what you raise</option>
                <option value="1">All or nothing</option>
              </select>
            </div>
            <div>
              <label className="label">Goal (zkLTC, optional)</label>
              <input
                className="input"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0"
                value={form.goalEth}
                onChange={(e) => update("goalEth", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Deadline (optional)</label>
            <input
              className="input"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted">
              Required for &quot;All or nothing&quot;. After deadline + goal not met,
              donors can refund.
            </p>
          </div>

          {error && <div className="text-sm text-rose-400">{error}</div>}
          {writeErr && (
            <div className="text-sm text-rose-400">
              {(writeErr as Error).message}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={isPending || isMining}
              className="btn-primary"
            >
              {isPending ? "Confirm in wallet…" : isMining ? "Mining…" : "Create campaign"}
            </button>
            <TxStatus hash={txHash} isMining={isMining} isSuccess={isSuccess} />
          </div>
        </form>
      )}
    </div>
  );
}
