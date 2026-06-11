"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem, type AbiEvent, type Log } from "viem";
import { CONTRACT_ADDRESS } from "./contract";
import { DEPLOYMENT } from "./deployment";

// ABI items for the events we care about
const DONATION_EVENT = parseAbiItem(
  "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, string message)"
);

const CAMPAIGN_CREATED_EVENT = parseAbiItem(
  "event CampaignCreated(uint256 indexed id, address indexed beneficiary, string title, string category, uint256 goal, uint256 deadline, uint8 mode)"
);

export type DonationEvent = {
  campaignId: bigint;
  donor: `0x${string}`;
  amount: bigint;
  message: string;
  txHash: `0x${string}`;
  blockNumber: bigint;
};

export type CampaignCreatedEvent = {
  id: bigint;
  beneficiary: `0x${string}`;
  txHash: `0x${string}`;
  blockNumber: bigint;
};

// Scanning from genesis (block 0) times out on this RPC — there are ~11M
// empty blocks before the contract existed. Starting at the deployment block
// keeps it to a single request that resolves in ~1s, which also avoids the
// rate limiting (HTTP 429) that paging into many requests would trigger.
const DEPLOY_BLOCK = BigInt(
  (DEPLOYMENT as { deployBlock?: number }).deployBlock ?? 0,
);

type PublicClient = NonNullable<ReturnType<typeof usePublicClient>>;

async function getContractLogs(
  client: PublicClient,
  event: AbiEvent,
  args?: Record<string, unknown>,
): Promise<Log[]> {
  const logs = await client.getLogs({
    address: CONTRACT_ADDRESS,
    event,
    args,
    fromBlock: DEPLOY_BLOCK,
    toBlock: "latest",
  } as Parameters<PublicClient["getLogs"]>[0]);
  return logs as Log[];
}

/**
 * Pulls all DonationReceived events for the contract (or a single campaign),
 * paging from the deployment block through to head in RPC-friendly chunks.
 */
export function useDonationEvents(campaignId?: bigint) {
  const client = usePublicClient();
  const [events, setEvents] = useState<DonationEvent[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    async function fetchLogs() {
      try {
        const logs = (await getContractLogs(
          client!,
          DONATION_EVENT,
          campaignId !== undefined ? { campaignId } : undefined,
        )) as Log<bigint, number, false, typeof DONATION_EVENT>[];

        const parsed: DonationEvent[] = logs.map((l) => ({
          campaignId: l.args.campaignId as bigint,
          donor: l.args.donor as `0x${string}`,
          amount: l.args.amount as bigint,
          message: (l.args.message as string) ?? "",
          txHash: l.transactionHash!,
          blockNumber: l.blockNumber!,
        }));
        // newest first
        parsed.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        if (!cancelled) setEvents(parsed);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [client, campaignId]);

  return { events, error };
}

export function useCampaignsByBeneficiary(beneficiary?: `0x${string}`) {
  const client = usePublicClient();
  const [events, setEvents] = useState<CampaignCreatedEvent[] | null>(null);

  useEffect(() => {
    if (!client || !beneficiary) {
      setEvents(null);
      return;
    }
    let cancelled = false;

    async function fetchLogs() {
      try {
        const logs = (await getContractLogs(client!, CAMPAIGN_CREATED_EVENT, {
          beneficiary,
        })) as Log<bigint, number, false, typeof CAMPAIGN_CREATED_EVENT>[];

        const parsed: CampaignCreatedEvent[] = logs.map((l) => ({
          id: l.args.id as bigint,
          beneficiary: l.args.beneficiary as `0x${string}`,
          txHash: l.transactionHash!,
          blockNumber: l.blockNumber!,
        }));
        parsed.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        if (!cancelled) setEvents(parsed);
      } catch {
        if (!cancelled) setEvents([]);
      }
    }

    fetchLogs();
    return () => {
      cancelled = true;
    };
  }, [client, beneficiary]);

  return events;
}
