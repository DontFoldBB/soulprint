// Reads the whole Soulprint ecosystem off-chain-free: enumerates registeredWallets
// and reads per-token views. Deliberately avoids getLogs (Somnia RPC can throttle log
// ranges) — the evolution feed/timeline are derived from `generation` + `lastUpdated`.
//
// Every call is wrapped so the OLD live contract (which lacks these views) degrades to
// `null` rather than throwing — the UI then shows tasteful empty states.

import type { PublicClient } from "viem";
import {
  SOULPRINT_ADDRESS,
  SOULPRINT_ABI,
  parseDossier,
  SAMPLE_ACTIVITY_FEED,
  type Ecosystem,
  type SoulEntry,
  type ActivityEvent,
} from "./soulprint";

const MAX_ENTRIES = 60; // safety cap on enumeration

export async function loadEcosystem(pub: PublicClient): Promise<Ecosystem | null> {
  let minted: number;
  try {
    minted = Number(
      (await pub.readContract({
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "totalSoulprints",
      })) as bigint
    );
  } catch {
    return null; // not the new contract — caller falls back to empty/sample
  }

  const count = Math.min(minted, MAX_ENTRIES);
  const indexes = Array.from({ length: count }, (_, i) => i);

  const entries = (
    await Promise.all(indexes.map((i) => loadEntry(pub, i)))
  ).filter((e): e is SoulEntry => e !== null);

  const evolutions = entries.reduce(
    (sum, e) => sum + Math.max(0, e.generation - 1),
    0
  );

  return {
    minted,
    evolutions,
    cronLive: evolutions > 0,
    entries,
  };
}

async function loadEntry(pub: PublicClient, index: number): Promise<SoulEntry | null> {
  try {
    const wallet = (await pub.readContract({
      address: SOULPRINT_ADDRESS,
      abi: SOULPRINT_ABI,
      functionName: "registeredWallets",
      args: [BigInt(index)],
    })) as `0x${string}`;

    const tokenId = Number(
      (await pub.readContract({
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "soulprintOf",
        args: [wallet],
      })) as bigint
    );
    if (tokenId === 0) return null;

    const tid = BigInt(tokenId);
    const [raw, gen, activity, archetype, updated] = await Promise.all([
      read<string>(pub, "dossier", tid, ""),
      read<bigint>(pub, "generation", tid, 0n),
      read<bigint>(pub, "activityScore", tid, 0n),
      read<string>(pub, "archetypeOf", tid, ""),
      read<bigint>(pub, "lastUpdated", tid, 0n),
    ]);

    const d = parseDossier(raw);
    return {
      tokenId,
      wallet,
      type: d.type,
      archetype: archetype || d.archetype,
      rarity: Math.max(1, Math.min(5, Number(d.rarity ?? 1))),
      activity: Number(activity),
      generation: Number(gen),
      lastUpdated: Number(updated),
    };
  } catch {
    return null;
  }
}

type ReadFn =
  | "dossier"
  | "generation"
  | "activityScore"
  | "archetypeOf"
  | "lastUpdated"
  | "txCountOf";

async function read<T>(
  pub: PublicClient,
  functionName: ReadFn,
  tokenId: bigint,
  fallback: T
): Promise<T> {
  try {
    return (await pub.readContract({
      address: SOULPRINT_ADDRESS,
      abi: SOULPRINT_ABI,
      functionName,
      args: [tokenId],
    })) as T;
  } catch {
    return fallback;
  }
}

/** Build the "who's minting & evolving" feed. Derives mint + evolve events from the
 *  registry; falls back to the seeded sample when there's no real data yet (e.g. the
 *  old live contract), so the page always looks alive. */
export function buildActivity(eco: Ecosystem | null): ActivityEvent[] {
  if (!eco || eco.entries.length === 0) return SAMPLE_ACTIVITY_FEED;
  const events: ActivityEvent[] = [];
  for (const e of eco.entries) {
    const base = {
      wallet: e.wallet,
      type: e.type,
      archetype: e.archetype,
      rarity: e.rarity,
    };
    // One event per soulprint, timestamped by its last on-chain update. For an evolved
    // soulprint (gen > 1) that update IS the latest evolution; for gen 1 it's the mint. We
    // have no separate on-chain mint timestamp, so we don't fabricate a second "minted" event
    // at the evolution time (which would read as a mint that never happened then).
    if (e.generation > 1) {
      events.push({ ...base, id: `e-${e.tokenId}`, kind: "evolve", generation: e.generation, time: e.lastUpdated });
    } else {
      events.push({ ...base, id: `m-${e.tokenId}`, kind: "mint", generation: 1, time: e.lastUpdated });
    }
  }
  return events.sort((a, b) => b.time - a.time).slice(0, 8);
}

/** "2h ago", "20m ago", "just now" — for the feed/timeline. */
export function relativeTime(unixSeconds: number): string {
  if (!unixSeconds) return "—";
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
