"use client";

import { useEffect, useState } from "react";
import { loadWalletProfile, type WalletProfile } from "@/lib/profile";
import { tier } from "@/lib/tiers";
import { TimeAgo } from "./TimeAgo";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Wallets you follow. Loads each profile and shows its key stats + last-evolved,
 *  so you can watch a wallet you minted for keep changing over time. */
export function WatchList({
  addresses,
  onSelect,
  onRemove,
}: {
  addresses: `0x${string}`[];
  onSelect?: (wallet: `0x${string}`) => void;
  onRemove?: (wallet: `0x${string}`) => void;
}) {
  const [profiles, setProfiles] = useState<Record<string, WalletProfile | null>>({});

  // Load any address we haven't fetched yet.
  useEffect(() => {
    addresses.forEach((a) => {
      if (a in profiles) return;
      loadWalletProfile(a).then((p) => setProfiles((cur) => ({ ...cur, [a]: p })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.join(",")]);

  return (
    <div className="panel rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.24em] text-soul-mid">
          Watching
        </h3>
        <span className="text-[10px] uppercase tracking-[0.2em] text-soul-dim">
          {addresses.length}
        </span>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-soul-dim">
          Mint or look up a wallet, then hit ★ Watch — followed wallets show here so
          you can see them evolve.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {addresses.map((a) => {
            const p = profiles[a];
            const loaded = a in profiles;
            const t = tier(Number(p?.dossier.rarity ?? 1));
            return (
              <li key={a}>
                <div className="group flex items-center gap-1 rounded-lg pr-1 transition hover:bg-white/[0.04]">
                  <button
                    onClick={() => onSelect?.(a)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2.5 py-2 text-left"
                    title="View this Soulprint"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: t.color, boxShadow: `0 0 8px ${t.glow}` }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground/90 group-hover:text-foreground">
                        {p?.dossier.type ?? (loaded ? "No Soulprint yet" : "Loading…")}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-soul-dim">
                        {short(a)}
                        {p ? ` · ${p.dossier.archetype ?? "Wallet"}` : ""}
                      </span>
                    </span>
                    {p && (
                      <span className="shrink-0 text-right">
                        <span className="font-display text-sm font-bold text-foreground">
                          gen {p.generation}
                        </span>
                        <span className="block text-[10px] text-soul-dim">
                          <TimeAgo unix={p.lastUpdated ?? 0} />
                        </span>
                      </span>
                    )}
                    <span className="shrink-0 text-[11px] text-soul-dim opacity-0 transition group-hover:opacity-100">
                      view →
                    </span>
                  </button>
                  <button
                    onClick={() => onRemove?.(a)}
                    className="shrink-0 rounded-md px-2 py-1 text-soul-dim transition hover:text-foreground"
                    aria-label="Stop watching"
                    title="Stop watching"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
