import { Dossier } from "@/lib/soulprint";

function Lock() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ActivityMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.25em] text-soul-violet/70">
          Activity
        </span>
        <span className="font-display text-lg font-bold text-foreground">
          {v}
          <span className="text-xs text-foreground/40">/100</span>
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${v}%`,
            background:
              "linear-gradient(90deg,#ff2d9b,#b563ff 55%,#2dd4ff)",
            boxShadow: "0 0 14px rgba(255,45,155,0.55)",
          }}
        />
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-white/[0.06] py-3 sm:flex-row sm:gap-4">
      <span className="w-24 shrink-0 pt-0.5 text-[10px] uppercase tracking-[0.25em] text-soul-blue/70">
        {label}
      </span>
      <span className="text-sm leading-relaxed text-foreground/85">{children}</span>
    </div>
  );
}

export function DossierCard({
  d,
  generation,
  activity,
}: {
  d: Dossier;
  generation?: number;
  activity?: number;
}) {
  const stars = Math.max(0, Math.min(5, Number(d.rarity ?? 0)));
  const archetype = d.archetype;
  const karmaNum = d.karma ? Number(d.karma.replace(/[^\d+-]/g, "")) : NaN;
  const karmaPositive = !Number.isNaN(karmaNum) && karmaNum >= 0;

  return (
    <article className="rise relative mx-auto w-full max-w-lg">
      {/* glow halo */}
      <div
        aria-hidden
        className="absolute -inset-px rounded-[26px] opacity-70 blur-md"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,45,155,0.5), rgba(45,212,255,0.4))",
        }}
      />
      <div className="panel relative overflow-hidden rounded-[24px]">
        {/* corner registration marks */}
        <div className="pointer-events-none absolute right-5 top-5 font-mono text-[9px] uppercase tracking-[0.3em] text-soul-violet/40">
          SOULPRINT · CLASSIFIED
        </div>

        <div className="p-7 sm:p-8">
          {/* top meta bar */}
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-soul-magenta/40 bg-soul-magenta/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-soul-magenta">
                <Lock />
                Soulbound
              </span>
              {generation !== undefined && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-soul-blue/30 bg-soul-blue/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-soul-blue"
                  title="This dossier autonomously self-evolves over time"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-soul-blue" />
                  gen {generation}
                </span>
              )}
            </div>
          </header>

          {/* archetype chip */}
          {archetype && (
            <div className="mt-7">
              <span className="rounded-md border border-soul-violet/30 bg-soul-violet/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-soul-violet">
                {archetype}
              </span>
            </div>
          )}

          {/* the invented TYPE — hero of the card */}
          <h2 className="font-display mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl">
            <span className="text-gradient">{d.type ?? "Unidentified Wallet"}</span>
          </h2>

          {/* rarity + karma strip */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/40">
                Rarity
              </span>
              <span className="text-lg leading-none tracking-tight">
                <span className="text-soul-magenta">{"★".repeat(stars)}</span>
                <span className="text-foreground/15">{"★".repeat(5 - stars)}</span>
              </span>
            </div>
            {d.karma && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/40">
                  Karma
                </span>
                <span
                  className={`font-display text-lg font-bold ${
                    karmaPositive ? "text-soul-blue" : "text-soul-magenta"
                  }`}
                >
                  {d.karma}
                </span>
              </div>
            )}
          </div>

          {/* activity meter */}
          {activity !== undefined && (
            <div className="mt-6">
              <ActivityMeter value={activity} />
            </div>
          )}

          {/* style quote */}
          {d.style && (
            <blockquote className="mt-6 border-l-2 border-soul-magenta/60 pl-4 font-display text-lg italic leading-snug text-foreground/90">
              &ldquo;{d.style}&rdquo;
            </blockquote>
          )}

          {/* detailed rows */}
          <div className="mt-6">
            {d.strength && <Row label="Strength">{d.strength}</Row>}
            {d.weakness && <Row label="Weakness">{d.weakness}</Row>}
            {d.notes && <Row label="Notes">{d.notes}</Row>}
          </div>
        </div>
      </div>
    </article>
  );
}
