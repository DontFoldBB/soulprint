// Set this to the deployed Soulprint contract address after running scripts/deploy.ts
export const SOULPRINT_ADDRESS = "0xbc55dc48cdafb62cc054e1b9424b0429c1750af9" as `0x${string}`;

// Minimal ABI used by the frontend.
export const SOULPRINT_ABI = [
  {
    type: "function",
    name: "read",
    stateMutability: "payable",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "reread",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  // Version-agnostic composite read: tokenId + dossier text + generation.
  {
    type: "function",
    name: "profileOf",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "dossier", type: "string" },
      { name: "generation", type: "uint256" },
    ],
  },
  // Structured traits — may not exist on older deployments; call defensively.
  {
    type: "function",
    name: "traitsOf",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "archetype", type: "string" },
      { name: "activity", type: "uint256" },
      { name: "generation", type: "uint256" },
    ],
  },
  // Legacy granular views (fallbacks if profileOf is absent).
  {
    type: "function",
    name: "soulprintOf",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "dossier",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "generation",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  // ── Ecosystem / dashboard views (present on the NEW build; call defensively) ──
  {
    type: "function",
    name: "totalSoulprints",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "registeredWallets",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "txCountOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "lastUpdated",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "activityScore",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "archetypeOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "MINT_PRICE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

export type Dossier = {
  type?: string;
  archetype?: string;
  strength?: string;
  weakness?: string;
  style?: string;
  karma?: string;
  notes?: string;
  rarity?: string;
};

export function parseDossier(raw: string): Dossier {
  const out: Dossier = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toUpperCase();
    const value = line.slice(idx + 1).trim();
    switch (key) {
      case "TYPE": out.type = value; break;
      case "ARCHETYPE": out.archetype = value; break;
      case "STRENGTH": out.strength = value; break;
      case "WEAKNESS": out.weakness = value; break;
      case "STYLE": out.style = value.replace(/^"|"$/g, ""); break;
      case "KARMA": out.karma = value; break;
      case "NOTES": out.notes = value; break;
      case "RARITY": out.rarity = value.match(/\d+/)?.[0] ?? value; break;
    }
  }
  return out;
}

// A static sample so the design is previewable without an on-chain read.
export const SAMPLE_DOSSIER: Dossier = {
  type: "The Midnight Liquidity Goblin",
  archetype: "DeFi User",
  strength: "Sniffs out yield in the dark; never met a pool it wouldn't farm.",
  weakness: "Gas-fee denial. Has approved more tokens than it can name.",
  style: "I'm not aping, I'm allocating.",
  karma: "+42",
  notes:
    "High-frequency degen with a surprisingly disciplined exit game. Smells faintly of stablecoins and regret.",
  rarity: "4",
};
export const SAMPLE_ACTIVITY = 78;
export const SAMPLE_GENERATION = 3;

// ── Dashboard / ecosystem types ──────────────────────────────────────────────
export type SoulEntry = {
  tokenId: number;
  wallet: `0x${string}`;
  type?: string;        // dossier TYPE headline
  archetype?: string;   // canonical archetype
  rarity: number;       // 1–5
  activity: number;     // 0–100
  generation: number;
  lastUpdated: number;  // unix seconds (0 if unknown)
};

export type Ecosystem = {
  minted: number;
  evolutions: number;   // total self-evolutions across all soulprints (gen-1 summed)
  cronLive: boolean;    // true once anything has evolved past gen 1
  entries: SoulEntry[]; // every registered soulprint
};

// A believable sample ecosystem so the full dashboard is visible before redeploy
// (and powers the "See a sample dossier" preview). Mirrors the SAMPLE_DOSSIER wallet.
export const SAMPLE_ECOSYSTEM: Ecosystem = {
  minted: 42,
  evolutions: 137,
  cronLive: true,
  entries: [
    { tokenId: 7, wallet: "0x5e1f4c2a9b8d3e7f06a1c4b2d9e8f70a3b1c2d4e", type: "The Midnight Liquidity Goblin", archetype: "DeFi User", rarity: 4, activity: 78, generation: 3, lastUpdated: nowMinus(2 * 3600) },
    { tokenId: 19, wallet: "0xab12cd34ef56ab78cd90ef12ab34cd56ef78ab90", type: "Serial Contract Whisperer", archetype: "Contract Deployer", rarity: 5, activity: 92, generation: 6, lastUpdated: nowMinus(20 * 60) },
    { tokenId: 3, wallet: "0xcd34ef56ab78cd90ef12ab34cd56ef78ab90cd12", type: "The Patient Accumulator", archetype: "Power User", rarity: 4, activity: 88, generation: 4, lastUpdated: nowMinus(46 * 60) },
    { tokenId: 28, wallet: "0xef56ab78cd90ef12ab34cd56ef78ab90cd12ef34", type: "Testnet Tourist", archetype: "Testnet Explorer", rarity: 2, activity: 40, generation: 2, lastUpdated: nowMinus(3 * 3600) },
    { tokenId: 12, wallet: "0x7890ab12cd34ef56ab78cd90ef12ab34cd56ef78", type: "The Shy Minter", archetype: "Newborn Wallet", rarity: 1, activity: 20, generation: 1, lastUpdated: nowMinus(9 * 3600) },
  ],
};

function nowMinus(seconds: number): number {
  return Math.floor(Date.now() / 1000) - seconds;
}

// ── Activity feed (Mint page) — "who's minting & evolving right now" ──────────
export type ActivityEvent = {
  id: string;
  kind: "mint" | "evolve";
  wallet: `0x${string}`;
  type?: string;
  archetype?: string;
  rarity: number;
  generation: number;
  time: number; // unix seconds
};

// Seeded feed so the page looks alive before the new contract is deployed.
export const SAMPLE_ACTIVITY_FEED: ActivityEvent[] = [
  { id: "s1", kind: "evolve", wallet: "0xab12cd34ef56ab78cd90ef12ab34cd56ef78ab90", type: "Serial Contract Whisperer", archetype: "Contract Deployer", rarity: 5, generation: 6, time: nowMinus(4 * 60) },
  { id: "s2", kind: "mint", wallet: "0x91ace77bb0c2f1d4e6a8b3c5d7e9f0a1b2c3d4e5", type: "Fresh Off The Faucet", archetype: "Newborn Wallet", rarity: 1, generation: 1, time: nowMinus(11 * 60) },
  { id: "s3", kind: "evolve", wallet: "0x5e1f4c2a9b8d3e7f06a1c4b2d9e8f70a3b1c2d4e", type: "The Midnight Liquidity Goblin", archetype: "DeFi User", rarity: 4, generation: 3, time: nowMinus(22 * 60) },
  { id: "s4", kind: "mint", wallet: "0xcd34ef56ab78cd90ef12ab34cd56ef78ab90cd12", type: "The Patient Accumulator", archetype: "Power User", rarity: 4, generation: 1, time: nowMinus(38 * 60) },
  { id: "s5", kind: "evolve", wallet: "0xef56ab78cd90ef12ab34cd56ef78ab90cd12ef34", type: "Testnet Tourist", archetype: "Testnet Explorer", rarity: 2, generation: 2, time: nowMinus(64 * 60) },
  { id: "s6", kind: "mint", wallet: "0x7890ab12cd34ef56ab78cd90ef12ab34cd56ef78", type: "The Sleeper Agent", archetype: "Sybil-Like Farmer", rarity: 3, generation: 1, time: nowMinus(96 * 60) },
];
