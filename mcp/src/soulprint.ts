import { createPublicClient, http, getAddress, type Address } from "viem";

/** Somnia Shannon testnet (chainId 50312). */
export const SOMNIA_TESTNET = {
  id: 50312,
  name: "Somnia Shannon Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: ["https://api.infra.testnet.somnia.network"] } },
} as const;

/** Deployed Soulprint contract. Override via SOULPRINT_ADDRESS. */
export const SOULPRINT_ADDRESS = (process.env.SOULPRINT_ADDRESS ??
  "0x30e553c13eab2c125a466e2ccde228f692d36149") as Address;

const RPC_URL = process.env.SOULPRINT_RPC ?? SOMNIA_TESTNET.rpcUrls.default.http[0];

// Minimal ABI — only the composable read the contract exposes today.
const ABI = [
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
] as const;

const client = createPublicClient({
  chain: SOMNIA_TESTNET as never,
  transport: http(RPC_URL),
});

export type Soulprint = {
  wallet: Address;
  exists: boolean;
  tokenId: number;
  generation: number;
  /** Parsed "KEY: value" fields from the dossier (TYPE, ARCHETYPE, STRENGTH, …). */
  fields: Record<string, string>;
  raw: string;
};

/** Parse the dossier's "KEY: value" lines into a flat record. Tolerant of missing fields. */
export function parseDossier(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

/** Read a wallet's Soulprint profile from the on-chain contract (read-only, no key). */
export async function getSoulprint(wallet: string): Promise<Soulprint> {
  const addr = getAddress(wallet);
  const [tokenId, raw, generation] = (await client.readContract({
    address: SOULPRINT_ADDRESS,
    abi: ABI,
    functionName: "profileOf",
    args: [addr],
  })) as readonly [bigint, string, bigint];

  return {
    wallet: addr,
    exists: tokenId > 0n,
    tokenId: Number(tokenId),
    generation: Number(generation),
    fields: parseDossier(raw),
    raw,
  };
}
