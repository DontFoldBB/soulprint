"use client";

import { useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  isAddress,
} from "viem";
import { somniaTestnet } from "@/lib/chain";
import { SOULPRINT_ADDRESS, SOULPRINT_ABI, parseDossier, Dossier } from "@/lib/soulprint";
import { DossierCard } from "@/components/DossierCard";

const pub = createPublicClient({ chain: somniaTestnet, transport: http() });

export default function Home() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [gen, setGen] = useState<number | undefined>();

  async function pollDossier(wallet: `0x${string}`) {
    for (let i = 0; i < 40; i++) {
      const tokenId = (await pub.readContract({
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "soulprintOf",
        args: [wallet],
      })) as bigint;

      if (tokenId > 0n) {
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
        if (raw && raw.length > 0) {
          setDossier(parseDossier(raw));
          setGen(Number(g));
          setStatus("Done.");
          return;
        }
      }
      setStatus(`Reading the chain… asking the validators… (${i * 3}s)`);
      await new Promise((r) => setTimeout(r, 3000));
    }
    setStatus("Timed out — the agents took too long. Try again.");
  }

  async function onRead() {
    setDossier(null);
    if (!isAddress(address)) {
      setStatus("Enter a valid 0x address.");
      return;
    }
    const eth = (window as unknown as { ethereum?: unknown }).ethereum;
    if (!eth) {
      setStatus("No wallet found. Install MetaMask and add Somnia Shannon.");
      return;
    }
    try {
      setBusy(true);
      setStatus("Submitting…");
      const wallet = address as `0x${string}`;
      const walletClient = createWalletClient({
        chain: somniaTestnet,
        transport: custom(eth as Parameters<typeof custom>[0]),
      });
      const [from] = await walletClient.requestAddresses();
      const hash = await walletClient.writeContract({
        account: from,
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "read",
        args: [wallet],
        value: parseEther("1"),
      });
      setStatus("Tx sent, waiting for confirmation…");
      await pub.waitForTransactionReceipt({ hash });
      setStatus("Reading the chain… asking the validators…");
      await pollDossier(wallet);
    } catch (e) {
      setStatus("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center gap-6 p-10">
      <h1 className="text-4xl font-bold tracking-tight">Soulprint</h1>
      <p className="text-center text-zinc-400">
        Paste a wallet. The on-chain AI reads its history and writes your dossier — then mints it as a soulbound NFT.
      </p>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="0x…"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-zinc-100"
      />
      <button
        onClick={onRead}
        disabled={busy}
        className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-black disabled:opacity-50"
      >
        {busy ? "Working…" : "Read me · 1 STT"}
      </button>
      {status && <p className="text-sm text-zinc-400">{status}</p>}
      {dossier && <DossierCard d={dossier} generation={gen} />}
    </main>
  );
}
