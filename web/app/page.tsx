"use client";

import { useCallback, useEffect, useState } from "react";
import { parseEther, isAddress } from "viem";
import { somniaTestnet } from "@/lib/chain";
import {
  SOULPRINT_ADDRESS,
  SOULPRINT_ABI,
  Ecosystem,
  SAMPLE_DOSSIER,
  SAMPLE_ACTIVITY,
  SAMPLE_GENERATION,
} from "@/lib/soulprint";
import { pub, walletClient, ensureChain, connect, detectAddress } from "@/lib/wallet";
import { loadWalletProfile, type WalletProfile } from "@/lib/profile";
import { deriveForm } from "@/lib/evolution";
import { loadEcosystem, buildActivity } from "@/lib/dashboard";
import { useWatchlist } from "@/lib/watchlist";
import { SoulCard } from "@/components/SoulCard";
import { DossierSkeleton } from "@/components/DossierSkeleton";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TopNav } from "@/components/TopNav";

export default function Home() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<WalletProfile | null>(null);
  const [preview, setPreview] = useState(false);
  const [connected, setConnected] = useState<string | null>(null);
  const [eco, setEco] = useState<Ecosystem | null>(null);
  const watch = useWatchlist();

  useEffect(() => {
    detectAddress().then((a) => a && setConnected(a));
    loadEcosystem(pub).then(setEco).catch(() => setEco(null));
  }, []);

  async function poll(wallet: `0x${string}`, prevGen = 0) {
    for (let i = 0; i < 40; i++) {
      const r = await loadWalletProfile(wallet);
      if (r && r.generation > prevGen) {
        setResult(r);
        setStatus("");
        loadEcosystem(pub).then(setEco).catch(() => {});
        return;
      }
      setStatus(`Reading the chain… asking the validators… (${i * 3}s)`);
      await new Promise((res) => setTimeout(res, 3000));
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
    const wallet = address as `0x${string}`;
    try {
      setBusy(true);
      setStatus("Reading the chain…");
      const existing = await loadWalletProfile(wallet);
      if (existing) {
        setResult(existing);
        setStatus("");
        return;
      }
      if (typeof window === "undefined" || !("ethereum" in window)) {
        setError("No Soulprint yet for this wallet. Connect a wallet on Somnia Shannon to mint one.");
        return;
      }
      setStatus("Opening your wallet…");
      const wc = walletClient();
      const [from] = await wc.requestAddresses();
      setStatus("Switching to Somnia Shannon…");
      await ensureChain(wc);
      // Tiered pricing (Soulprint.sol): 1 STT to profile your OWN wallet, 2 STT for
      // someone else's. The signer (`from`) is the source of truth, so we send exactly
      // what the contract requires and never revert with "underpaid".
      const isSelf = from.toLowerCase() === wallet.toLowerCase();
      const hash = await wc.writeContract({
        account: from,
        chain: somniaTestnet,
        address: SOULPRINT_ADDRESS,
        abi: SOULPRINT_ABI,
        functionName: "read",
        args: [wallet],
        value: parseEther(isSelf ? "1" : "2"),
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

  async function connectWallet() {
    setError("");
    setResult(null); // drop any card from a previous lookup before loading the new wallet
    try {
      const addr = await connect();
      setConnected(addr);
      setAddress(addr);
      setPreview(false);
      setBusy(true);
      setStatus("Loading your Soulprint…");
      const existing = await loadWalletProfile(addr);
      setResult(existing); // null clears the card for an unprofiled wallet (no stale card)
      if (!existing) setError("No Soulprint yet for this wallet — read it above to mint one.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  const onSelect = useCallback(async (wallet: `0x${string}`) => {
    setPreview(false);
    setError("");
    setResult(null); // drop any previously shown card so nothing stale lingers
    setAddress(wallet);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    setBusy(true);
    setStatus("Loading Soulprint…");
    try {
      const r = await loadWalletProfile(wallet);
      if (r) setResult(r);
      else
        setError(
          "That's sample activity — look up or connect a real wallet to see a live Soulprint."
        );
    } finally {
      setBusy(false);
      setStatus("");
    }
  }, []);

  function showSample() {
    setError("");
    setBusy(false);
    setStatus("");
    setPreview(true);
    const sampleEvo = deriveForm(SAMPLE_DOSSIER.archetype, 412);
    setResult({
      dossier: SAMPLE_DOSSIER,
      tokenId: 7,
      generation: SAMPLE_GENERATION,
      activity: SAMPLE_ACTIVITY,
      txCount: 412,
      lastUpdated: Math.floor(Date.now() / 1000) - 2 * 3600,
      stage: sampleEvo.stage,
      stageName: sampleEvo.stageName,
      formId: sampleEvo.formId,
      formSlug: sampleEvo.slug,
      formName: sampleEvo.name,
    });
  }

  const events = buildActivity(eco);
  const seeded = !eco || eco.entries.length === 0;
  const cardWallet = preview
    ? "0x5e1f4c2a9b8d3e7f06a1c4b2d9e8f70a3b1c2d4e"
    : (address as `0x${string}`);

  // Button label reflects whose wallet you're reading.
  const typedAddr = isAddress(address);
  const isMine = typedAddr && !!connected && address.toLowerCase() === connected.toLowerCase();
  const readLabel = busy
    ? "Working…"
    : !typedAddr || isMine
    ? "Read me · 1 STT"
    : "Read wallet · 2 STT";

  return (
    <main className="relative mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:py-14">
      <div aria-hidden className="grid-veil pointer-events-none absolute inset-0 -z-10" />

      <TopNav connected={connected} onConnect={connectWallet} />

      <header className="rise text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.28em] text-soul-mid">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 animate-pulse" />
          On-chain AI agents · Somnia Testnet
        </div>
        <h1 className="font-display mx-auto mt-7 max-w-2xl text-balance text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl">
          <span className="text-foreground">Soulprint — your wallet&apos;s </span>
          <span className="text-gradient">living on-chain identity</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm italic leading-relaxed text-foreground/55 sm:text-base">
          Not an AI caption for your wallet — an identity primitive other agents can build on.
        </p>
      </header>

      {/* MINT PANEL — always available, even when connected */}
      <section
        className="rise panel mx-auto mt-12 max-w-xl rounded-2xl p-5 sm:p-6"
        style={{ animationDelay: "120ms" }}
      >
        <label className="text-[10px] uppercase tracking-[0.28em] text-soul-mid">
          Mint / look up any wallet
        </label>
        <div className="mt-2.5 flex flex-col gap-3 sm:flex-row">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && onRead()}
            placeholder="0x…"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-3.5 font-mono text-sm text-foreground outline-none transition focus:border-white/40 focus:ring-2 focus:ring-white/10"
          />
          <button
            onClick={onRead}
            disabled={busy}
            className="shrink-0 rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide text-black transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "linear-gradient(180deg,#ffffff,#cfcfd3)" }}
          >
            {readLabel}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/40">
          <span>1 STT for your own wallet · 2 STT for anyone else. Soulbound NFT mints to the target wallet.</span>
          <button
            onClick={showSample}
            className="font-semibold text-foreground/70 underline-offset-4 transition hover:text-foreground hover:underline"
          >
            See a sample →
          </button>
        </div>
        {error && (
          <p className="mt-4 rounded-lg border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-foreground/80">
            {error}
          </p>
        )}
      </section>

      {/* RESULT CARD — only takes space when there's something to show */}
      {((busy && !result) || result) && (
        <section className="mt-10">
          {busy && !result && <DossierSkeleton status={status} />}
          {result && (
            <div className="space-y-3">
              {preview && (
                <p className="text-center text-[11px] uppercase tracking-[0.25em] text-soul-dim">
                  Sample preview — connect a wallet for the real read
                </p>
              )}
              <SoulCard
                d={result.dossier}
                generation={result.generation}
                activity={result.activity}
                txCount={result.txCount}
                wallet={cardWallet}
                imageUrl={result.formSlug ? `/souls/${result.formSlug}.png` : undefined}
                stage={result.stage}
                stageName={result.stageName}
                formName={result.formName}
              />
              {!preview && isAddress(address) && (
                <div className="flex justify-center">
                  <button
                    onClick={() =>
                      watch.has(address)
                        ? watch.remove(address as `0x${string}`)
                        : watch.add(address as `0x${string}`)
                    }
                    className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-xs font-semibold text-foreground/80 transition hover:border-white/30 hover:text-foreground"
                  >
                    {watch.has(address) ? "★ Watching — tap to unfollow" : "☆ Watch this wallet"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* LIVE ACTIVITY */}
      <section className="mx-auto mt-10 max-w-xl">
        <ActivityFeed events={events} onSelect={onSelect} seeded={seeded} />
      </section>

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
