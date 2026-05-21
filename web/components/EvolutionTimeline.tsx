"use client";

import { tier } from "@/lib/tiers";
import { TimeAgo } from "./TimeAgo";

/** A horizontal generation track: gen 1 → 2 → … → N, latest highlighted.
 *  Per-generation timestamps aren't stored on-chain, so we show the count and
 *  the last-evolved time — enough to convey "this dossier keeps changing". */
export function EvolutionTimeline({
  generation = 1,
  lastUpdated = 0,
  txCount,
  rarity = 1,
  onReread,
  rereadBusy,
}: {
  generation?: number;
  lastUpdated?: number;
  txCount?: number;
  rarity?: number;
  onReread?: () => void;
  rereadBusy?: boolean;
}) {
  const t = tier(rarity);
  const gens = Array.from({ length: Math.max(1, generation) }, (_, i) => i + 1);

  return (
    <div className="panel rounded-xl px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-soul-dim">
          Evolution timeline
        </span>
        {onReread && (
          <button
            onClick={onReread}
            disabled={rereadBusy}
            className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-foreground/70 transition hover:border-white/35 hover:text-foreground disabled:opacity-50"
          >
            {rereadBusy ? "Evolving…" : "Re-read ↻"}
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
        {gens.map((g, i) => {
          const isLast = i === gens.length - 1;
          return (
            <div key={g} className="flex items-center gap-1.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold"
                style={
                  isLast
                    ? { borderColor: t.color, color: t.color, boxShadow: `0 0 10px ${t.glow}` }
                    : { borderColor: "rgba(255,255,255,0.14)", color: "rgba(237,237,238,0.5)" }
                }
              >
                {g}
              </div>
              {!isLast && <div className="h-px w-5 bg-white/15" />}
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-foreground/45">
        {txCount !== undefined && <span>{txCount.toLocaleString("en-US")} tx read</span>}
        <span>last evolved <TimeAgo unix={lastUpdated} /></span>
      </div>
    </div>
  );
}
