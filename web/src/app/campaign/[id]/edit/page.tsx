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
import { CONTRACT_ABI, CONTRACT_ADDRESS, Campaign } from "@/lib/contract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TxStatus } from "@/components/TxStatus";

export default function EditCampaignPage() {
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

  const [description, setDescription] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [category, setCategory] = useState("charity");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (campaign && !hydrated) {
      setDescription(campaign.description);
      setImageURI(campaign.imageURI);
      setCategory(campaign.category || "charity");
      setHydrated(true);
    }
  }, [campaign, hydrated]);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => router.push(`/campaign/${id.toString()}`), 1200);
      return () => clearTimeout(t);
    }
  }, [isSuccess, id, router]);

  if (isLoading || !campaign) {
    return <div className="text-muted">Loading…</div>;
  }

  const isBeneficiary =
    address && address.toLowerCase() === campaign.beneficiary.toLowerCase();

  if (!isConnected) {
    return (
      <div className="card text-center max-w-md mx-auto">
        <p className="mb-4 text-muted">Connect the beneficiary wallet to edit.</p>
        <div className="inline-block">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isBeneficiary) {
    return (
      <div className="card text-center max-w-md mx-auto">
        <p className="text-rose-400">
          Only the beneficiary can edit this campaign.
        </p>
        <Link
          href={`/campaign/${id.toString()}`}
          className="btn-ghost mt-3 inline-block"
        >
          ← Back
        </Link>
      </div>
    );
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "updateMetadata",
      args: [id, description, imageURI, category],
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/campaign/${id.toString()}`}
        className="text-xs text-muted hover:text-white"
      >
        ← Back to campaign
      </Link>

      <h1 className="text-2xl font-bold mt-2 mb-1">Edit campaign</h1>
      <p className="text-sm text-muted mb-6">
        Title, mode, goal, and deadline are immutable to protect donors. You
        can update description, image, and category at any time.
      </p>

      <form onSubmit={save} className="card space-y-4">
        <div>
          <label className="label">Title (read-only)</label>
          <input className="input opacity-60" value={campaign.title} disabled />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[140px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
            <label className="label">Image URL</label>
            <input
              className="input"
              placeholder="https:// or ipfs://"
              value={imageURI}
              onChange={(e) => setImageURI(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-rose-400">{(error as Error).message}</div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={isPending || isMining}
            className="btn-primary"
          >
            {isPending ? "Confirm…" : isMining ? "Mining…" : "Save changes"}
          </button>
          <TxStatus hash={hash} isMining={isMining} isSuccess={isSuccess} />
        </div>
      </form>
    </div>
  );
}
