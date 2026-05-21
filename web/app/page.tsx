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
import {
  SOULPRINT_ADDRESS,
  SOULPRINT_ABI,
  parseDossier,
  Dossier,
  SAMPLE_DOSSIER,
  SAMPLE_ACTIVITY,
  SAMPLE_GENERATION,
} from "@/lib/soulprint";
import { DossierCard } from "@/components/DossierCard";
import { DossierSkeleton } from "@/components/DossierSkeleton";

const pub = createPublicClient({ chain: somniaTestnet, transport: http() });

type Result = { dossier: Dossier; generation?: number; activity?: number };

export default function Home() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [preview, setPreview] = useState(false);

  // Defensive: traitsOf may not exist on the deployed contract.
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
      return {
        archetype: r[1] || undefined,
        activity: Number(r[2]),
      };
    } catch {
      return null;
    }
  }

  // Primary read via profileOf; fall back to legacy granular views.
  async function readProfile(
    wallet: `0x${string}`
  ): Promise<{ raw: string; generation: number } | null> {
    try {
      const r = (await pub.readContract({
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "profileOf",
        args: [wallet],
      })) as readonly [bigint, string, bigint];
      if (r[0] > 0n && r[1]) return { raw: r[1], generation: Number(r[2]) };
      return null;
    } catch {
      // Legacy path
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
        return { raw, generation: Number(g) };
      } catch {
        return null;
      }
    }
  }

  async function poll(wallet: `0x${string}`) {
    for (let i = 0; i < 40; i++) {
      const profile = await readProfile(wallet);
      if (profile) {
        const traits = await tryTraits(wallet);
        const dossier = parseDossier(profile.raw);
        if (traits?.archetype && !dossier.archetype)
          dossier.archetype = traits.archetype;
        setResult({
          dossier,
          generation: profile.generation,
          activity: traits?.activity,
        });
        setStatus("");
        return;
      }
      setStatus(`Reading the chain… asking the validators… (${i * 3}s)`);
      await new Promise((r) => setTimeout(r, 3000));
    }
    setError("The agents took too long. Try reading again.");
  }

  async function onRead() {
    setResult(null);
    setPreview(false);
    setError("");
    if (!isAddress(address)) {
      setError("Enter a valid 0x wallet address.");
      return;
    }
    const eth = (window as unknown as { ethereum?: unknown }).ethereum;
    if (!eth) {
      setError("No wallet found. Install MetaMask and add Somnia Shannon Testnet.");
      return;
    }
    try {
      setBusy(true);
      setStatus("Opening your wallet…");
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
      setStatus("Transaction sent — confirming on Somnia…");
      await pub.waitForTransactionReceipt({ hash });
      setStatus("Reading the chain… asking the validators…");
      await poll(wallet);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.length > 160 ? msg.slice(0, 160) + "…" : msg);
    } finally {
      setBusy(false);
    }
  }

  function showSample() {
    setError("");
    setBusy(false);
    setStatus("");
    setResult({
      dossier: SAMPLE_DOSSIER,
      generation: SAMPLE_GENERATION,
      activity: SAMPLE_ACTIVITY,
    });
    setPreview(true);
  }

  return (
    <main className="relative mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:py-20">
      {/* technical grid backdrop */}
      <div aria-hidden className="grid-veil pointer-events-none absolute inset-0 -z-10" />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <header className="rise text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-soul-violet/30 bg-soul-violet/[0.06] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.28em] text-soul-violet/90">
          <span className="h-1.5 w-1.5 rounded-full bg-soul-magenta animate-pulse" />
          On-chain AI agents · Somnia Testnet
        </div>

        <h1 className="font-display mx-auto mt-7 max-w-2xl text-balance text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
          <span className="text-foreground">Soulprint — your wallet&apos;s </span>
          <span className="text-gradient">living on-chain identity</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm italic leading-relaxed text-foreground/55 sm:text-base">
          Not an AI caption for your wallet — an identity primitive other agents
          can build on.
        </p>
      </header>

      {/* ── READ PANEL ───────────────────────────────────────── */}
      <section
        className="rise panel mx-auto mt-12 max-w-xl rounded-2xl p-5 sm:p-6"
        style={{ animationDelay: "120ms" }}
      >
        <label className="text-[10px] uppercase tracking-[0.28em] text-soul-blue/70">
          Target wallet
        </label>
        <div className="mt-2.5 flex flex-col gap-3 sm:flex-row">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && onRead()}
            placeholder="0x…"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-soul-violet/25 bg-black/40 px-4 py-3.5 font-mono text-sm text-foreground outline-none transition focus:border-soul-magenta/70 focus:ring-2 focus:ring-soul-magenta/20"
          />
          <button
            onClick={onRead}
            disabled={busy}
            className="group relative shrink-0 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide text-black transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "linear-gradient(100deg,#ff2d9b,#b563ff 55%,#2dd4ff)",
            }}
          >
            <span className="relative z-10">
              {busy ? "Working…" : "Read me · 1 STT"}
            </span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/40">
          <span>Pays 1 STT · mints a soulbound NFT to the wallet.</span>
          <button
            onClick={showSample}
            className="font-semibold text-soul-blue/80 underline-offset-4 transition hover:text-soul-blue hover:underline"
          >
            See a sample dossier →
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-soul-magenta/30 bg-soul-magenta/[0.07] px-4 py-3 text-sm text-soul-magenta">
            {error}
          </p>
        )}
      </section>

      {/* ── OUTPUT ───────────────────────────────────────────── */}
      <section className="mt-12">
        {busy && !result && <DossierSkeleton status={status} />}
        {result && (
          <div className="space-y-4">
            {preview && (
              <p className="mx-auto max-w-lg text-center text-[11px] uppercase tracking-[0.25em] text-soul-violet/50">
                Sample preview — connect a wallet for the real read
              </p>
            )}
            <DossierCard
              d={result.dossier}
              generation={result.generation}
              activity={result.activity}
            />
          </div>
        )}
        {!busy && !result && (
          <div className="mx-auto max-w-lg text-center">
            <p className="text-sm leading-relaxed text-foreground/40">
              Paste a wallet above. On-chain Somnia agents read its history,
              write a dossier, and mint it — then it self-evolves on its own.
            </p>
          </div>
        )}
      </section>

      {/* ── CLOSER ───────────────────────────────────────────── */}
      <footer className="mt-20 text-center">
        <p className="font-display text-xl font-bold tracking-tight text-foreground/80 sm:text-2xl">
          Mint once. <span className="text-gradient">It evolves forever.</span>
        </p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-foreground/30">
          Built on Somnia · Soulbound ERC-5192
        </p>
      </footer>
    </main>
  );
}
