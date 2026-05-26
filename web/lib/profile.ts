// Loads everything a single wallet's view needs (card + stats). Shared by both pages.

import { pub } from "./wallet";
import { SOULPRINT_ADDRESS, SOULPRINT_ABI, parseDossier, type Dossier } from "./soulprint";
import { deriveForm } from "./evolution";

export type WalletProfile = {
  dossier: Dossier;
  tokenId: number;
  generation: number;
  activity?: number;
  txCount?: number;
  lastUpdated?: number;
  /** Evolution stage 1..10 (Dormant → Eternal), derived from tx_count. */
  stage?: number;
  stageName?: string;
  /** Spirit form id 1..30 (which of the 30 souls — picked by archetype+stage). */
  formId?: number;
  /** Slug used to load /souls/<slug>.png from the public folder. */
  formSlug?: string;
  /** Human-readable form title (e.g. "Cartographer Spirit") for the card headline. */
  formName?: string;
  /** Prepaid evolution fuel for this soul (in wei). Zero = soul is paused; anyone can topUp. */
  fuelWei?: bigint;
  /** Per-evolution cost in wei (constant from the contract). */
  fuelCostWei?: bigint;
  /** Full evolutions this soul can still afford autonomously. */
  fuelEvosLeft?: number;
};

async function readNum(
  fn: "txCountOf" | "lastUpdated",
  tokenId: number
): Promise<number | undefined> {
  try {
    const v = (await pub.readContract({
      address: SOULPRINT_ADDRESS,
      abi: SOULPRINT_ABI,
      functionName: fn,
      args: [BigInt(tokenId)],
    })) as bigint;
    return Number(v);
  } catch {
    return undefined;
  }
}

async function tryTraits(
  wallet: `0x${string}`
): Promise<{ archetype?: string; activity?: number } | null> {
  try {
    const r = (await pub.readContract({
      address: SOULPRINT_ADDRESS,
      abi: SOULPRINT_ABI,
      functionName: "traitsOf",
      args: [wallet],
    })) as readonly [bigint, string, bigint, bigint];
    return { archetype: r[1] || undefined, activity: Number(r[2]) };
  } catch {
    return null;
  }
}

// profileOf with a legacy fallback; returns tokenId + raw dossier + generation.
async function readProfile(
  wallet: `0x${string}`
): Promise<{ tokenId: number; raw: string; generation: number } | null> {
  try {
    const r = (await pub.readContract({
      address: SOULPRINT_ADDRESS,
      abi: SOULPRINT_ABI,
      functionName: "profileOf",
      args: [wallet],
    })) as readonly [bigint, string, bigint];
    if (r[0] > 0n && r[1])
      return { tokenId: Number(r[0]), raw: r[1], generation: Number(r[2]) };
    return null;
  } catch {
    try {
      const tokenId = (await pub.readContract({
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "soulprintOf",
        args: [wallet],
      })) as bigint;
      if (tokenId === 0n) return null;
      const raw = (await pub.readContract({
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "dossier",
        args: [tokenId],
      })) as string;
      const g = (await pub.readContract({
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "generation",
        args: [tokenId],
      })) as bigint;
      if (!raw) return null;
      return { tokenId: Number(tokenId), raw, generation: Number(g) };
    } catch {
      return null;
    }
  }
}

export async function loadWalletProfile(
  wallet: `0x${string}`
): Promise<WalletProfile | null> {
  const profile = await readProfile(wallet);
  if (!profile) return null;
  const traits = await tryTraits(wallet);
  const dossier = parseDossier(profile.raw);
  if (traits?.archetype && !dossier.archetype) dossier.archetype = traits.archetype;
  const [txCount, lastUpdated, fuel] = await Promise.all([
    readNum("txCountOf", profile.tokenId),
    readNum("lastUpdated", profile.tokenId),
    readFuel(profile.tokenId),
  ]);
  const evo = deriveForm(dossier.archetype, txCount);
  return {
    dossier,
    tokenId: profile.tokenId,
    generation: profile.generation,
    activity: traits?.activity,
    txCount,
    lastUpdated,
    stage: evo.stage,
    stageName: evo.stageName,
    formId: evo.formId,
    formSlug: evo.slug,
    formName: evo.name,
    fuelWei: fuel?.balance,
    fuelCostWei: fuel?.cost,
    fuelEvosLeft: fuel ? Number(fuel.evosLeft) : undefined,
  };
}

// Reads evolutionFuel(tokenId) on the new build; returns undefined on older contracts.
async function readFuel(tokenId: number): Promise<{ balance: bigint; cost: bigint; evosLeft: bigint } | undefined> {
  try {
    const r = (await pub.readContract({
      address: SOULPRINT_ADDRESS,
      abi: SOULPRINT_ABI,
      functionName: "evolutionFuel",
      args: [BigInt(tokenId)],
    })) as readonly [bigint, bigint, bigint];
    return { balance: r[0], cost: r[1], evosLeft: r[2] };
  } catch {
    return undefined;
  }
}
