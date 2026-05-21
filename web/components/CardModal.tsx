"use client";

import { useEffect } from "react";
import type { WalletProfile } from "@/lib/profile";
import { SoulCard } from "./SoulCard";
import { EvolutionTimeline } from "./EvolutionTimeline";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Opens a wallet's Soulprint in an overlay — separate from your own card. */
export function CardModal({
  wallet,
  profile,
  loading,
  onClose,
}: {
  wallet: `0x${string}`;
  profile: WalletProfile | null;
  loading: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10 sm:py-16">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.26em] text-soul-mid">
            Viewing · {short(wallet)}
          </span>
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-foreground/80 transition hover:border-white/30 hover:text-foreground"
          >
            ✕ close
          </button>
        </div>

        {loading ? (
          <div className="panel flex h-80 items-center justify-center rounded-2xl text-sm text-soul-dim">
            Loading Soulprint…
          </div>
        ) : profile ? (
          <>
            <SoulCard
              d={profile.dossier}
              generation={profile.generation}
              activity={profile.activity}
              txCount={profile.txCount}
              wallet={wallet}
            />
            <div className="mt-4">
              <EvolutionTimeline
                generation={profile.generation}
                lastUpdated={profile.lastUpdated}
                txCount={profile.txCount}
                rarity={Number(profile.dossier.rarity ?? 1)}
              />
            </div>
          </>
        ) : (
          <div className="panel flex h-60 flex-col items-center justify-center gap-2 rounded-2xl text-center text-sm text-soul-dim">
            <span>No Soulprint for this wallet yet.</span>
            <span className="font-mono text-xs">{short(wallet)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
