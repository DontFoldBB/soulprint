// Shared wallet + chain plumbing, used by both the Mint page and the Dashboard.

import { createPublicClient, createWalletClient, custom, http } from "viem";
import type { WalletClient } from "viem";
import { somniaTestnet } from "./chain";

export const pub = createPublicClient({ chain: somniaTestnet, transport: http() });

type Eth = Parameters<typeof custom>[0];

export function getEth(): Eth | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: Eth }).ethereum;
}

/** Silent check (no popup): returns an already-connected address, or null. */
export async function detectAddress(): Promise<`0x${string}` | null> {
  const eth = getEth();
  if (!eth) return null;
  try {
    const accounts = (await (eth as { request: (a: { method: string }) => Promise<string[]> }).request(
      { method: "eth_accounts" }
    )) as string[];
    return (accounts?.[0] as `0x${string}`) ?? null;
  } catch {
    return null;
  }
}

export function walletClient(): WalletClient {
  const eth = getEth();
  if (!eth) throw new Error("No wallet found. Install MetaMask or Rabby.");
  return createWalletClient({ chain: somniaTestnet, transport: custom(eth) });
}

/** Make sure the wallet is on Somnia Shannon — prompt a switch (add it if missing). */
export async function ensureChain(wc: WalletClient): Promise<void> {
  try {
    const current = await wc.getChainId();
    if (current === somniaTestnet.id) return;
    try {
      await wc.switchChain({ id: somniaTestnet.id });
    } catch {
      await wc.addChain({ chain: somniaTestnet });
      await wc.switchChain({ id: somniaTestnet.id });
    }
  } catch {
    /* if the wallet can't report/switch, the tx will surface a clear error */
  }
}

/** Connect (prompts) and ensure the right chain. Returns the address. */
export async function connect(): Promise<`0x${string}`> {
  const wc = walletClient();
  const [addr] = await wc.requestAddresses();
  await ensureChain(wc);
  return addr;
}
