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

// Scanning from genesis (block 0) times out on this RPC once the chain is
// long-lived — there are ~11M empty blocks before the contract existed.
// Start at the deployment block and page through in chunks the RPC handles
// comfortably (≈1M blocks resolves in ~1s).
const DEPLOY_BLOCK = BigInt(
  (DEPLOYMENT as { deployBlock?: number }).deployBlock ?? 0,
);
const LOG_CHUNK = 1_000_000n;

type PublicClient = NonNullable<ReturnType<typeof usePublicClient>>;

async function getLogsChunked(
  client: PublicClient,
  event: AbiEvent,
  args?: Record<string, unknown>,
): Promise<Log[]> {
  const latest = await client.getBlockNumber();
  const all: Log[] = [];
  for (let from = DEPLOY_BLOCK; from <= latest; from += LOG_CHUNK) {
    const to = from + LOG_CHUNK - 1n > latest ? latest : from + LOG_CHUNK - 1n;
    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event,
      args,
      fromBlock: from,
      toBlock: to,
    } as Parameters<PublicClient["getLogs"]>[0]);
    all.push(...(logs as Log[]));
  }
  return all;
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
        const logs = (await getLogsChunked(
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
    const interval = setInterval(fetchLogs, 12_000);
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
        const logs = (await getLogsChunked(client!, CAMPAIGN_CREATED_EVENT, {
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
