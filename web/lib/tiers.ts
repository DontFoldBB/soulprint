// Rarity tiers (1–5) — the ONLY colour accents in the otherwise-monochrome UI.
// Mirrors the TIERS table in components/SoulCard.tsx; keep them in sync.
export const TIERS = [
  { name: "Common", color: "#8b9099", glow: "rgba(139,144,153,0.30)" },
  { name: "Uncommon", color: "#5fb389", glow: "rgba(95,179,137,0.34)" },
  { name: "Rare", color: "#5b93de", glow: "rgba(91,147,222,0.40)" },
  { name: "Epic", color: "#a06fd6", glow: "rgba(160,111,214,0.42)" },
  { name: "Legendary", color: "#f0b94e", glow: "rgba(240,185,78,0.48)" },
] as const;

export function tier(rarity: number) {
  const i = Math.max(1, Math.min(5, rarity || 1)) - 1;
  return TIERS[i];
}
