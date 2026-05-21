"use client";

import type { Ecosystem } from "@/lib/soulprint";

/** Top ecosystem strip: total minted · self-evolutions · Cron status. */
export function StatStrip({
  eco,
  loading,
}: {
  eco: Ecosystem | null;
  loading: boolean;
}) {
  const cells = [
    { label: "Soulprints minted", value: eco ? fmt(eco.minted) : "—" },
    { label: "Autonomous evolutions", value: eco ? fmt(eco.evolutions) : "—" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cells.map((c) => (
        <div key={c.label} className="panel rounded-xl px-4 py-3">
          <div className="font-display text-2xl font-extrabold leading-none text-foreground sm:text-3xl">
            {loading && !eco ? <span className="shimmer rounded">&nbsp;&nbsp;&nbsp;</span> : c.value}
          </div>
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-soul-dim">
            {c.label}
          </div>
        </div>
      ))}

      {/* Cron / autonomy status */}
      <div className="panel flex flex-col justify-center rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={
              "h-2 w-2 rounded-full " +
              (eco?.cronLive ? "bg-emerald-400 animate-pulse" : "bg-soul-dim")
            }
          />
          <span className="font-display text-base font-bold text-foreground sm:text-lg">
            {eco?.cronLive ? "Cron live" : eco ? "Idle" : "—"}
          </span>
        </div>
        <div className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-soul-dim">
          Self-evolution
        </div>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}
