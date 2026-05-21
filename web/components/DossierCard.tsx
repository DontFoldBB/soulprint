import { Dossier } from "@/lib/soulprint";

/** Rarity tiers (1–5). Monochrome → metallic; no neon. Higher = more "viral". */
// Rarity ladder — colour is the one accent that varies; base stays monochrome.
const TIERS = [
  { name: "Common", color: "#8b9099", glow: "rgba(139,144,153,0.30)" },
  { name: "Uncommon", color: "#5fb389", glow: "rgba(95,179,137,0.34)" },
  { name: "Rare", color: "#5b93de", glow: "rgba(91,147,222,0.40)" },
  { name: "Epic", color: "#a06fd6", glow: "rgba(160,111,214,0.42)" },
  { name: "Legendary", color: "#f0b94e", glow: "rgba(240,185,78,0.48)" },
];

function shortAddr(a?: string) {
  if (!a || a.length < 10) return "0x····";
  return `${a.slice(0, 6)}····${a.slice(-4)}`;
}

function Lock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Address-seeded halftone disc — a unique "soul-print" sigil per wallet. */
function Sigil({ color, glow, seed }: { color: string; glow: string; seed: number }) {
  const rot = seed % 360;
  const mask =
    "radial-gradient(circle at 50% 50%, black 28%, rgba(0,0,0,0.55) 54%, transparent 72%)";
  return (
    <div className="relative mx-auto h-28 w-28">
      <div
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: color + "44", boxShadow: `0 0 26px ${glow}` }}
      />
      <div
        className="absolute inset-[6px] rounded-full"
        style={{ border: `1px solid ${color}22` }}
      />
      <div
        className="halftone absolute inset-[10px] rounded-full"
        style={{
          color,
          transform: `rotate(${rot}deg)`,
          WebkitMaskImage: mask,
          maskImage: mask,
          filter: `drop-shadow(0 0 8px ${glow})`,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: color, boxShadow: `0 0 14px ${glow}` }}
      />
    </div>
  );
}

function ActivityMeter({ value, color }: { value: number; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.25em] text-soul-dim">Activity</span>
        <span className="font-display text-base font-bold text-foreground">
          {v}
          <span className="text-xs text-foreground/35">/100</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${v}%`, background: color, boxShadow: `0 0 10px ${color}66` }}
        />
      </div>
    </div>
  );
}

export function DossierCard({
  d,
  generation,
  activity,
  wallet,
}: {
  d: Dossier;
  generation?: number;
  activity?: number;
  wallet?: string;
}) {
  const stars = Math.max(0, Math.min(5, Number(d.rarity ?? 0)));
  const tier = TIERS[(stars > 0 ? stars : 1) - 1];
  const seed = wallet ? parseInt(wallet.slice(2, 12), 16) || 0 : 0;

  return (
    <article className="rise mx-auto w-full max-w-sm">
      {/* tier glow halo */}
      <div
        aria-hidden
        className="absolute"
        style={{ inset: "-1px" }}
      />
      <div
        className="foil panel relative overflow-hidden rounded-[28px]"
        style={{ borderColor: tier.color + "33", boxShadow: `0 30px 80px -30px ${tier.glow}` }}
      >
        {/* halftone wash top-right */}
        <div
          className="halftone pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-[0.06]"
          style={{ color: tier.color }}
        />

        <div className="relative p-6 sm:p-7">
          {/* header */}
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-foreground/80">
              Soulprint
            </span>
            <span
              className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: tier.color, borderColor: tier.color + "55", background: tier.color + "12" }}
            >
              {tier.name}
            </span>
          </div>

          {/* sigil */}
          <div className="mt-6">
            <Sigil color={tier.color} glow={tier.glow} seed={seed} />
          </div>

          {/* archetype + TYPE */}
          <div className="mt-6 text-center">
            {d.archetype && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-soul-mid">
                {d.archetype}
              </span>
            )}
            <h2 className="font-display mt-2 text-3xl font-extrabold leading-[1.05] tracking-tight">
              <span
                style={{
                  background: `linear-gradient(180deg,#ffffff 0%, ${tier.color} 115%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {d.type ?? "Unidentified Wallet"}
              </span>
            </h2>
          </div>

          {/* style quote */}
          {d.style && (
            <p className="mt-5 text-center font-display text-base italic leading-snug text-foreground/85">
              &ldquo;{d.style}&rdquo;
            </p>
          )}

          {/* rarity + karma */}
          <div className="mt-6 flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.25em] text-soul-dim">Rarity</div>
              <div className="mt-1 text-lg leading-none" style={{ color: tier.color }}>
                {"★".repeat(stars || 1)}
                <span className="text-foreground/15">{"★".repeat(5 - (stars || 1))}</span>
              </div>
            </div>
            {d.karma && (
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.25em] text-soul-dim">Karma</div>
                <div className="font-display mt-1 text-lg font-bold text-foreground">{d.karma}</div>
              </div>
            )}
          </div>

          {/* activity meter */}
          {activity !== undefined && (
            <div className="mt-6">
              <ActivityMeter value={activity} color={tier.color} />
            </div>
          )}

          {/* strength / weakness */}
          {(d.strength || d.weakness) && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {d.strength && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-soul-dim">Strength</div>
                  <div className="mt-1 text-sm leading-snug text-foreground/85">{d.strength}</div>
                </div>
              )}
              {d.weakness && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-soul-dim">Weakness</div>
                  <div className="mt-1 text-sm leading-snug text-foreground/85">{d.weakness}</div>
                </div>
              )}
            </div>
          )}

          {/* notes */}
          {d.notes && (
            <p className="mt-5 text-center text-sm leading-relaxed text-foreground/55">{d.notes}</p>
          )}

          {/* footer */}
          <div className="mt-7 flex items-center justify-between border-t border-white/[0.08] pt-4 text-[11px] text-foreground/45">
            <span className="font-mono">{shortAddr(wallet)}</span>
            <div className="flex items-center gap-3">
              {generation !== undefined && (
                <span className="inline-flex items-center gap-1.5" title="Self-evolves over time">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/60" />
                  gen {generation}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-foreground/60">
                <Lock /> soulbound
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
