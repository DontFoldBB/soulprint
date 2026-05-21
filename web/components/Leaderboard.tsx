"use client";

import type { SoulEntry } from "@/lib/soulprint";
import { tier } from "@/lib/tiers";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Top Soulprints by on-chain activity score. Click a row to load that wallet. */
export function Leaderboard({
  entries,
  onSelect,
}: {
  entries: SoulEntry[];
  onSelect?: (wallet: `0x${string}`) => void;
}) {
  const rows = [...entries].sort((a, b) => b.activity - a.activity).slice(0, 6);

  return (
    <div className="panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.24em] text-soul-mid">
          Leaderboard · by activity
        </h3>
        <span className="text-[10px] uppercase tracking-[0.2em] text-soul-dim">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <Empty>No Soulprints yet — be the first.</Empty>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((e, i) => {
            const t = tier(e.rarity);
            return (
              <li key={e.tokenId}>
                <button
                  onClick={() => onSelect?.(e.wallet)}
                  className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/[0.04]"
                >
                  <span className="w-4 shrink-0 text-center font-mono text-xs text-soul-dim">
                    {i + 1}
                  </span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: t.color, boxShadow: `0 0 8px ${t.glow}` }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground/90 group-hover:text-foreground">
                      {e.type ?? "Unidentified Wallet"}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-soul-dim">
                      {short(e.wallet)} · {e.archetype ?? "Wallet"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-display text-base font-bold text-foreground">
                      {e.activity}
                    </span>
                    <span className="block text-[10px] text-soul-dim">gen {e.generation}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-soul-dim">
      {children}
    </div>
  );
}
