"use client";

import type { ActivityEvent } from "@/lib/soulprint";
import { tier } from "@/lib/tiers";
import { TimeAgo } from "./TimeAgo";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** The "it's alive" stream for the Mint page: who just minted, who just evolved. */
export function ActivityFeed({
  events,
  onSelect,
  seeded,
}: {
  events: ActivityEvent[];
  onSelect?: (wallet: `0x${string}`) => void;
  seeded?: boolean;
}) {
  return (
    <div className="panel rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.24em] text-soul-mid">
          Live activity
        </h3>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-soul-dim">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          minting &amp; evolving
        </span>
      </div>

      <ul className="space-y-1">
        {events.map((e) => {
          const t = tier(e.rarity);
          const evolve = e.kind === "evolve";
          return (
            <li key={e.id}>
              <button
                onClick={() => onSelect?.(e.wallet)}
                className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/[0.04]"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold"
                  style={{ borderColor: t.color, color: t.color }}
                >
                  {evolve ? `g${e.generation}` : "new"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground/85 group-hover:text-foreground">
                    <span className="font-mono text-[12px] text-soul-mid">{short(e.wallet)}</span>{" "}
                    {evolve ? (
                      <>evolved → <span style={{ color: t.color }}>gen {e.generation}</span></>
                    ) : (
                      <>minted a Soulprint</>
                    )}
                  </span>
                  <span className="block truncate text-[11px] text-soul-dim">
                    {e.type ?? e.archetype ?? "Soulprint"}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-soul-dim">
                  <TimeAgo unix={e.time} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {seeded && (
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-soul-dim/70">
          Sample activity · goes live after redeploy
        </p>
      )}
    </div>
  );
}
