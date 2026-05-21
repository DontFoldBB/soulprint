"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { Dossier } from "@/lib/soulprint";
import "./SoulCard.css";

/** Rarity tiers (1–5). Monochrome → metallic; no neon. Higher = more "viral". */
const TIERS = [
  { name: "Common", color: "#8b9099", glow: "rgba(139,144,153,0.30)" },
  { name: "Uncommon", color: "#5fb389", glow: "rgba(95,179,137,0.34)" },
  { name: "Rare", color: "#5b93de", glow: "rgba(91,147,222,0.40)" },
  { name: "Epic", color: "#a06fd6", glow: "rgba(160,111,214,0.42)" },
  { name: "Legendary", color: "#f0b94e", glow: "rgba(240,185,78,0.48)" },
];

function shortAddr(a?: string) {
  if (!a || a.length < 10) return "0x····";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function Lock() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Address-seeded halftone disc — a unique "soul-print" sigil per wallet.
 *  Ported from DossierCard.tsx; sized to fill the SoulCard avatar slot. */
function Sigil({ color, glow, seed }: { color: string; glow: string; seed: number }) {
  const rot = seed % 360;
  const mask =
    "radial-gradient(circle at 50% 50%, black 28%, rgba(0,0,0,0.55) 54%, transparent 72%)";
  return (
    <div className="relative h-32 w-32 sm:h-36 sm:w-36">
      <div
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: color + "44", boxShadow: `0 0 30px ${glow}` }}
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
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: color, boxShadow: `0 0 16px ${glow}` }}
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

type TiltStyleVars = {
  "--sc-pointer-x": string;
  "--sc-pointer-y": string;
  "--sc-pointer-from-center": string;
  "--sc-pointer-from-top": string;
  "--sc-pointer-from-left": string;
  "--sc-card-opacity": string;
  "--sc-rotate-x": string;
  "--sc-rotate-y": string;
  "--sc-bg-x": string;
  "--sc-bg-y": string;
};

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, p = 3) => parseFloat(v.toFixed(p));
const adjust = (v: number, fromMin: number, fromMax: number, toMin: number, toMax: number) =>
  round(toMin + ((toMax - toMin) * (v - fromMin)) / (fromMax - fromMin));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export type SoulCardProps = {
  d: Dossier;
  generation?: number;
  activity?: number;
  txCount?: number;
  wallet?: string;
};

export function SoulCard({ d, generation, activity, txCount, wallet }: SoulCardProps) {
  const stars = Math.max(0, Math.min(5, Number(d.rarity ?? 0)));
  const tier = TIERS[(stars > 0 ? stars : 1) - 1];
  const tierName = tier.name;
  const seed = wallet ? parseInt(wallet.slice(2, 12), 16) || 0 : 0;

  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const touchX = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // ── Cursor-following 3D tilt (logic ported verbatim from React Bits ProfileCard) ──
  const setVars = useCallback((x: number, y: number, card: HTMLElement, wrap: HTMLElement) => {
    const w = card.clientWidth;
    const h = card.clientHeight;
    const px = clamp((100 / w) * x);
    const py = clamp((100 / h) * y);
    const cx = px - 50;
    const cy = py - 50;

    const vars: Record<string, string> = {
      "--sc-pointer-x": `${px}%`,
      "--sc-pointer-y": `${py}%`,
      "--sc-bg-x": `${adjust(px, 0, 100, 35, 65)}%`,
      "--sc-bg-y": `${adjust(py, 0, 100, 35, 65)}%`,
      "--sc-pointer-from-center": `${clamp(Math.hypot(py - 50, px - 50) / 50, 0, 1)}`,
      "--sc-pointer-from-top": `${py / 100}`,
      "--sc-pointer-from-left": `${px / 100}`,
      "--sc-rotate-x": `${round(-(cx / 5))}deg`,
      "--sc-rotate-y": `${round(cy / 4)}deg`,
    };
    for (const k in vars) wrap.style.setProperty(k, vars[k]);
  }, []);

  const onMove = useCallback(
    (e: PointerEvent) => {
      const card = cardRef.current;
      const wrap = wrapRef.current;
      if (!card || !wrap) return;
      const rect = card.getBoundingClientRect();
      setVars(e.clientX - rect.left, e.clientY - rect.top, card, wrap);
    },
    [setVars]
  );

  const onEnter = useCallback(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    wrap.classList.add("active");
    card.classList.add("active");
    wrap.style.setProperty("--sc-card-opacity", "1");
  }, []);

  const onLeave = useCallback(
    (e: PointerEvent) => {
      const wrap = wrapRef.current;
      const card = cardRef.current;
      if (!wrap || !card) return;
      // Smoothly animate back to centre.
      const startX = e.offsetX || card.clientWidth / 2;
      const startY = e.offsetY || card.clientHeight / 2;
      const targetX = card.clientWidth / 2;
      const targetY = card.clientHeight / 2;
      const duration = 500;
      const start = performance.now();
      const loop = (now: number) => {
        const p = clamp((now - start) / duration, 0, 1);
        const e2 = easeInOut(p);
        setVars(
          adjust(e2, 0, 1, startX, targetX),
          adjust(e2, 0, 1, startY, targetY),
          card,
          wrap
        );
        if (p < 1) {
          rafRef.current = requestAnimationFrame(loop);
        } else {
          wrap.classList.remove("active");
          card.classList.remove("active");
          wrap.style.setProperty("--sc-card-opacity", "0");
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    },
    [setVars]
  );

  useEffect(() => {
    const card = cardRef.current;
    const wrap = wrapRef.current;
    if (!card || !wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // While flipped, the back face is showing — don't run the front-face tilt.
    if (flipped) return;

    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);

    // Settle on centre at mount so the shine has a sensible default position.
    setVars(card.clientWidth / 2, card.clientHeight / 2, card, wrap);

    return () => {
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onEnter, onMove, onLeave, setVars, flipped]);

  // Tier-driven theming, passed to CSS via inline custom properties.
  const wrapperStyle = useMemo(() => {
    const base: TiltStyleVars = {
      "--sc-pointer-x": "50%",
      "--sc-pointer-y": "50%",
      "--sc-pointer-from-center": "0",
      "--sc-pointer-from-top": "0.5",
      "--sc-pointer-from-left": "0.5",
      "--sc-card-opacity": "0",
      "--sc-rotate-x": "0deg",
      "--sc-rotate-y": "0deg",
      "--sc-bg-x": "50%",
      "--sc-bg-y": "50%",
    };
    return {
      ...base,
      "--tier-color": tier.color,
      "--behind-glow-color": tier.glow,
      "--inner-gradient": `linear-gradient(150deg, ${tier.color}14 0%, #0d0d11 42%, #08080a 100%)`,
    } as CSSProperties;
  }, [tier]);

  const onCopy = useCallback(
    async (e: ReactMouseEvent) => {
      e.stopPropagation(); // never flip when copying
      if (!wallet) return;
      try {
        await navigator.clipboard.writeText(wallet);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      } catch {
        /* clipboard may be unavailable (insecure context) — fail silently */
      }
    },
    [wallet]
  );

  const toggleFlip = useCallback(() => setFlipped((f) => !f), []);

  // Horizontal swipe also flips the card (touch devices).
  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  }, []);
  const onTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      if (touchX.current == null) return;
      const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) > 40) toggleFlip();
    },
    [toggleFlip]
  );

  return (
    <div className="rise">
      {/* perspective stage → flipper (rotateY toggled) → two faces */}
      <div className="sc-stage" style={wrapperStyle}>
        <div
          className={"sc-flipper" + (flipped ? " is-flipped" : "")}
          onClick={toggleFlip}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="button"
          tabIndex={0}
          aria-label="Flip Soulprint card"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFlip();
            }
          }}
        >
          {/* ── FRONT FACE: holographic tilt card ─────────────── */}
          <div className="sc-face sc-face-front">
            <div ref={wrapRef} className="sc-wrapper">
              <section ref={cardRef} className="sc-card">
                <div className="sc-inside">
                  <div className="sc-shine" />
                  <div className="sc-glare" />
                  <div className="sc-content">
                    <div className="sc-top">
                      <span className="sc-brand">Soulprint</span>
                      <span className="sc-tier">{tierName}</span>
                    </div>

                    {/* Avatar slot → address-seeded halftone Sigil (no photo). */}
                    <div className="sc-avatar">
                      <Sigil color={tier.color} glow={tier.glow} seed={seed} />
                    </div>

                    <div className="sc-details">
                      <h3>{d.type ?? "Unidentified Wallet"}</h3>
                      <p>{(d.archetype ?? "Wallet") + " · " + tierName}</p>
                    </div>

                    {/* On-chain stats at a glance */}
                    <div className="sc-statrow">
                      <div className="sc-statcell">
                        <span className="sc-statcell-value" style={{ color: tier.color }}>
                          {activity ?? "—"}
                        </span>
                        <span className="sc-statcell-label">Activity</span>
                      </div>
                      <div className="sc-statcell">
                        <span className="sc-statcell-value">
                          {txCount !== undefined ? txCount.toLocaleString("en-US") : "—"}
                        </span>
                        <span className="sc-statcell-label">Txns</span>
                      </div>
                      <div className="sc-statcell">
                        <span className="sc-statcell-value">{generation ?? "—"}</span>
                        <span className="sc-statcell-label">Gen</span>
                      </div>
                    </div>

                    <div className="sc-spacer" />

                    <div className="sc-userinfo">
                      <div className="sc-user-text">
                        <span className="sc-handle">{shortAddr(wallet)}</span>
                        <span className="sc-status">
                          {generation !== undefined ? `gen ${generation} · ` : ""}soulbound
                        </span>
                      </div>
                      <button
                        type="button"
                        className="sc-copy-btn"
                        onClick={onCopy}
                        disabled={!wallet}
                      >
                        {copied ? "Copied!" : "Copy address"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* ── BACK FACE: the dossier details ────────────────── */}
          <div className="sc-face sc-face-back">
            <div className="sc-back-card">
              <div className="sc-back-content">
                <div className="sc-top">
                  <span className="sc-brand">Dossier</span>
                  <span className="sc-tier">{tierName}</span>
                </div>

                {d.style && <p className="sc-back-quote">&ldquo;{d.style}&rdquo;</p>}

                <div className="sc-back-stats">
                  <div className="sc-stat">
                    <div className="sc-stat-label">Rarity</div>
                    <div className="sc-stat-stars" style={{ color: tier.color }}>
                      {"★".repeat(stars || 1)}
                      <span style={{ color: "rgba(255,255,255,0.15)" }}>
                        {"★".repeat(5 - (stars || 1))}
                      </span>
                    </div>
                  </div>
                  {d.karma && (
                    <div className="sc-stat">
                      <div className="sc-stat-label">Karma</div>
                      <div className="sc-stat-value">{d.karma}</div>
                    </div>
                  )}
                </div>

                {activity !== undefined && (
                  <div className="sc-back-meter">
                    <ActivityMeter value={activity} color={tier.color} />
                  </div>
                )}

                {(d.strength || d.weakness) && (
                  <div className="sc-back-grid">
                    {d.strength && (
                      <div className="sc-back-box">
                        <div className="sc-stat-label">Strength</div>
                        <div className="sc-back-box-text">{d.strength}</div>
                      </div>
                    )}
                    {d.weakness && (
                      <div className="sc-back-box">
                        <div className="sc-stat-label">Weakness</div>
                        <div className="sc-back-box-text">{d.weakness}</div>
                      </div>
                    )}
                  </div>
                )}

                {d.notes && <p className="sc-back-notes">{d.notes}</p>}

                <div className="sc-spacer" />

                <div className="sc-back-footer">
                  <Lock /> soulbound · self-evolving
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="sc-flip-caption">tap or swipe to flip ⟲</p>
    </div>
  );
}
