// JS mirror of the Soulprint.sol stage/form logic. Lets the UI derive the wallet's spirit
// form client-side from existing on-chain data (tx_count + archetype string), so the new
// evolution UI works against the current live contract too. Once the contract is redeployed
// with stageOf/formIdOf/formSlugOf, those can be preferred and this stays as a fallback.

export const ARCHETYPES = [
  "Newborn Wallet",
  "Testnet Explorer",
  "DeFi User",
  "NFT Collector",
  "Contract Deployer",
  "Sybil-Like Farmer",
  "Power User",
] as const;

/** Canonical archetype string → index 1..7 (0 = unknown/fallback to Newborn line). */
export function archetypeIdx(s: string | undefined | null): number {
  if (!s) return 0;
  const i = ARCHETYPES.indexOf(s as (typeof ARCHETYPES)[number]);
  return i >= 0 ? i + 1 : 0;
}

/** tx_count → evolution stage (1..10). Same thresholds as Soulprint.sol. */
export function stageFromTxCount(txCount: number | undefined): number {
  const n = txCount ?? 0;
  if (n >= 200_000) return 10;
  if (n >= 50_000) return 9;
  if (n >= 10_000) return 8;
  if (n >= 2_000) return 7;
  if (n >= 600) return 6;
  if (n >= 200) return 5;
  if (n >= 75) return 4;
  if (n >= 20) return 3;
  if (n >= 5) return 2;
  return 1;
}

/** FORM_TABLE[archetype][stage] → formId 1..30. Mirrors Soulprint.sol `_formIdFor`. */
export function formIdFor(arch: number, stage: number): number {
  if (arch === 1 || arch === 0) {
    if (stage >= 3) return 3;
    if (stage >= 2) return 2;
    return 1;
  }
  if (arch === 2) {
    if (stage >= 6) return 7;
    if (stage >= 5) return 6;
    if (stage >= 3) return 5;
    return 4;
  }
  if (arch === 3) {
    if (stage >= 9) return 12;
    if (stage >= 8) return 11;
    if (stage >= 6) return 10;
    if (stage >= 4) return 9;
    return 8;
  }
  if (arch === 4) {
    if (stage >= 8) return 16;
    if (stage >= 6) return 15;
    if (stage >= 4) return 14;
    return 13;
  }
  if (arch === 5) {
    if (stage >= 10) return 21;
    if (stage >= 9) return 20;
    if (stage >= 7) return 19;
    if (stage >= 5) return 18;
    return 17;
  }
  if (arch === 6) {
    if (stage >= 7) return 25;
    if (stage >= 6) return 24;
    if (stage >= 4) return 23;
    return 22;
  }
  if (arch === 7) {
    if (stage >= 10) return 30;
    if (stage >= 9) return 29;
    if (stage >= 8) return 28;
    if (stage >= 7) return 27;
    return 26;
  }
  return 1;
}

const SLUGS: Record<number, string> = {
  1: "newborn-1-spark-mote",
  2: "newborn-2-drifting-wisp",
  3: "newborn-3-ember-shade",
  4: "explorer-1-seeker-wisp",
  5: "explorer-2-pathfinder-shade",
  6: "explorer-3-cartographer-spirit",
  7: "explorer-4-voidwalker",
  8: "defi-1-liquidity-sprite",
  9: "defi-2-yield-wraith",
  10: "defi-3-flux-specter",
  11: "defi-4-market-phantom",
  12: "defi-5-leviathan",
  13: "nft-1-curio-imp",
  14: "nft-2-gallery-shade",
  15: "nft-3-aesthete-spirit",
  16: "nft-4-curator-sovereign",
  17: "deployer-1-glyph-sprite",
  18: "deployer-2-architect-shade",
  19: "deployer-3-forge-specter",
  20: "deployer-4-protocol-wright",
  21: "deployer-5-genesis-demiurge",
  22: "sybil-1-husk-mote",
  23: "sybil-2-mirror-shade",
  24: "sybil-3-swarm-wraith",
  25: "sybil-4-hydra-of-husks",
  26: "power-1-adept-spirit",
  27: "power-2-ascendant-shade",
  28: "power-3-sovereign-specter",
  29: "power-4-aetherlord",
  30: "power-5-soul-singularity",
};

export function formSlug(formId: number): string {
  return SLUGS[formId] ?? "newborn-1-spark-mote";
}

// Plain-English role names that immediately tell the viewer what kind of wallet this is.
// (The mystical 30-spirit art still maps via the slug; names just got demystified.)
const NAMES: Record<number, string> = {
  1: "Fresh Spark",
  2: "First Drifter",
  3: "Newcomer",
  4: "Tester",
  5: "Scout",
  6: "Cartographer",
  7: "Veteran Explorer",
  8: "Yield Sprout",
  9: "Yield Farmer",
  10: "Liquidity Adept",
  11: "Market Maker",
  12: "DeFi Whale",
  13: "First Minter",
  14: "Collector",
  15: "Connoisseur",
  16: "Gallery Curator",
  17: "First Deploy",
  18: "Solidity Apprentice",
  19: "Contract Smith",
  20: "Protocol Builder",
  21: "Genesis Engineer",
  22: "Hollow Wallet",
  23: "Mirror Sybil",
  24: "Bot Swarm",
  25: "Sybil Hydra",
  26: "Operator",
  27: "Ascendant",
  28: "Sovereign",
  29: "Chain Lord",
  30: "Onchain Legend",
};

export function formName(formId: number): string {
  return NAMES[formId] ?? "Unknown Soul";
}

export function imageUrlFor(formId: number): string {
  return `/souls/${formSlug(formId)}.png`;
}

const STAGE_NAMES = [
  "—", // 0 unused
  "Dormant",
  "Stirring",
  "Awakening",
  "Forming",
  "Tempered",
  "Ascending",
  "Radiant",
  "Transcendent",
  "Mythic",
  "Eternal",
];
export function stageName(stage: number): string {
  return STAGE_NAMES[stage] ?? "—";
}

/** One-shot: derive the wallet's spirit form purely from its archetype + tx_count. */
export function deriveForm(archetype: string | undefined | null, txCount: number | undefined) {
  const stage = stageFromTxCount(txCount);
  const formId = formIdFor(archetypeIdx(archetype), stage);
  return {
    stage,
    stageName: stageName(stage),
    formId,
    slug: formSlug(formId),
    name: formName(formId),
    imageUrl: imageUrlFor(formId),
  };
}
