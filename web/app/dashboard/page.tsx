"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Ecosystem,
  SAMPLE_DOSSIER,
  SAMPLE_ACTIVITY,
  SAMPLE_GENERATION,
  SAMPLE_ECOSYSTEM,
} from "@/lib/soulprint";
import { pub, connect, detectAddress } from "@/lib/wallet";
import { loadWalletProfile, type WalletProfile } from "@/lib/profile";
import { loadEcosystem } from "@/lib/dashboard";
import { useWatchlist } from "@/lib/watchlist";
import { SoulCard } from "@/components/SoulCard";
import { StatStrip } from "@/components/StatStrip";
import { EvolutionTimeline } from "@/components/EvolutionTimeline";
import { Leaderboard } from "@/components/Leaderboard";
import { WatchList } from "@/components/WatchList";
import { CardModal } from "@/components/CardModal";
import { TopNav } from "@/components/TopNav";

const SAMPLE_WALLET = "0x5e1f4c2a9b8d3e7f06a1c4b2d9e8f70a3b1c2d4e" as `0x${string}`;
const SAMPLE_PROFILE: WalletProfile = {
  dossier: SAMPLE_DOSSIER,
  tokenId: 7,
  generation: SAMPLE_GENERATION,
  activity: SAMPLE_ACTIVITY,
  txCount: 412,
  lastUpdated: Math.floor(Date.now() / 1000) - 2 * 3600,
};

export default function Dashboard() {
  const [connected, setConnected] = useState<string | null>(null);
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [viewWallet, setViewWallet] = useState<`0x${string}` | null>(null);
  const [eco, setEco] = useState<Ecosystem | null>(null);
  const [ecoLoading, setEcoLoading] = useState(true);
  const [error, setError] = useState("");
  const watch = useWatchlist();

  // A wallet opened in the overlay (separate from your own card below).
  const [viewAddr, setViewAddr] = useState<`0x${string}` | null>(null);
  const [viewProfile, setViewProfile] = useState<WalletProfile | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    detectAddress().then((a) => {
      if (a) {
        setConnected(a);
        setViewWallet(a);
        loadWalletProfile(a).then(setProfile);
      }
    });
    loadEcosystem(pub)
      .then(setEco)
      .catch(() => setEco(null))
      .finally(() => setEcoLoading(false));
  }, []);

  async function connectWallet() {
    setError("");
    try {
      const addr = await connect();
      setConnected(addr);
      setViewWallet(addr);
      const p = await loadWalletProfile(addr);
      setProfile(p); // null clears any previously shown card (no stale card on an unprofiled wallet)
      if (!p) setError('No Soulprint yet — head to Mint to create yours.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // Open another wallet's Soulprint in the overlay — does NOT replace your card.
  const onSelect = useCallback(async (wallet: `0x${string}`) => {
    setViewAddr(wallet);
    setViewProfile(null);
    setViewLoading(true);
    try {
      setViewProfile(await loadWalletProfile(wallet));
    } finally {
      setViewLoading(false);
    }
  }, []);

  const closeView = useCallback(() => {
    setViewAddr(null);
    setViewProfile(null);
  }, []);

  // Fall back to sample so the dashboard reads as "alive" before redeploy.
  const sampleEco = !(eco && eco.entries.length > 0);
  const ecoData = sampleEco ? SAMPLE_ECOSYSTEM : (eco as Ecosystem);
  const sampleCard = !profile;
  const card = profile ?? SAMPLE_PROFILE;
  const cardWallet = profile ? (viewWallet as `0x${string}`) : SAMPLE_WALLET;

  return (
    <main className="relative mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:py-14">
      <div aria-hidden className="grid-veil pointer-events-none absolute inset-0 -z-10" />

      <TopNav connected={connected} onConnect={connectWallet} />

      {/* System-wide stats */}
      <section className="rise space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.26em] text-soul-mid">
            System overview
          </h2>
          {sampleEco && (
            <span className="text-[10px] uppercase tracking-[0.2em] text-soul-dim/70">
              sample data
            </span>
          )}
        </div>
        <StatStrip eco={ecoData} loading={ecoLoading && sampleEco} />
      </section>

      {/* Your Soulprint — big */}
      <section
        className="rise mt-12 flex flex-col items-center"
        style={{ animationDelay: "120ms" }}
      >
        <h2 className="mb-5 text-[11px] uppercase tracking-[0.26em] text-soul-mid">
          {sampleCard ? "Your Soulprint (sample)" : "Your Soulprint"}
        </h2>

        <div className="dash-card-lg">
          <SoulCard
            d={card.dossier}
            generation={card.generation}
            activity={card.activity}
            txCount={card.txCount}
            wallet={cardWallet}
          />
        </div>

        <div className="mt-6 w-full max-w-md">
          <EvolutionTimeline
            generation={card.generation}
            lastUpdated={card.lastUpdated}
            txCount={card.txCount}
            rarity={Number(card.dossier.rarity ?? 1)}
          />
        </div>

        {sampleCard && (
          <button
            onClick={connectWallet}
            className="mt-5 rounded-full px-6 py-3 text-sm font-bold text-black transition"
            style={{ background: "linear-gradient(180deg,#ffffff,#cfcfd3)" }}
          >
            Connect wallet to see yours
          </button>
        )}
        {error && (
          <p className="mt-4 max-w-md rounded-lg border border-white/15 bg-white/[0.05] px-4 py-3 text-center text-sm text-foreground/80">
            {error}
          </p>
        )}
      </section>

      {/* Watching — wallets you follow */}
      <section className="mx-auto mt-12 max-w-xl">
        <WatchList
          addresses={watch.list}
          onSelect={onSelect}
          onRemove={(a) => watch.remove(a)}
        />
      </section>

      {/* Leaderboard */}
      <section className="mx-auto mt-6 max-w-xl">
        <Leaderboard entries={ecoData.entries} onSelect={sampleEco ? undefined : onSelect} />
      </section>

      <footer className="mt-20 text-center">
        <p className="font-display text-xl font-bold tracking-tight text-foreground/80 sm:text-2xl">
          Mint once. <span className="text-gradient">It evolves forever.</span>
        </p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-foreground/30">
          Built on Somnia · Soulbound ERC-5192
        </p>
      </footer>

      {viewAddr && (
        <CardModal
          wallet={viewAddr}
          profile={viewProfile}
          loading={viewLoading}
          onClose={closeView}
        />
      )}
    </main>
  );
}
