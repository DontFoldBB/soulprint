// Set this to the deployed Soulprint contract address after running scripts/deploy.ts
export const SOULPRINT_ADDRESS = "0x0b8912155847fc7c1570e0dd5cd37fe0837966a1" as `0x${string}`;

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
