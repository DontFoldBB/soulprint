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

/** Deterministic PRNG (mulberry32) — the same wallet always yields the same soul-print. */
function mulberry32(seedInt: number) {
  let a = seedInt >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SigilArt = {
  paths: string[];
  minutiae: { x: number; y: number; r: number }[];
  ticks: { x1: number; y1: number; x2: number; y2: number }[];
  core: { x: number; y: number };
};

/** Build an address-seeded "soul fingerprint": warped concentric contour ridges (a
 *  biometric/topographic look), ridge-ending "minutiae" points, and a perimeter scan-ring.
 *  Pure math in a 100×100 viewBox, fully deterministic from `seed`. A shared harmonic warp
 *  with a slow per-ring phase drift keeps ridges parallel (never crossing) yet organic. */
function buildSigil(seed: number, stars: number): SigilArt {
  const rnd = mulberry32(seed || 1);
  const cx = 50 + (rnd() - 0.5) * 9;
  const cy = 50 + (rnd() - 0.5) * 9;

  const innerR = 6;
  const outerR = 44;
  const rings = 14 + Math.floor(rnd() * 4) + stars; // 14–22 ridges; rarer wallets = denser
  const step = (outerR - innerR) / rings;

  const harmonics = Array.from({ length: 3 }, () => ({
    f: 2 + Math.floor(rnd() * 4), // frequency 2–5
    a: 0.18 + rnd() * 0.5, // relative amplitude
    p: rnd() * Math.PI * 2, // phase
  }));
  const ampNorm = harmonics.reduce((s, h) => s + h.a, 0) || 1;
  const maxWarp = step * 0.46; // < step/2 so ridges never collide
  const squashX = 0.92 + rnd() * 0.1;
  const squashY = 0.85 + rnd() * 0.12; // gentle ovalisation
  const drift = (rnd() - 0.5) * 1.4;

  const warpAt = (th: number, ringI: number) => {
    let w = 0;
    for (const h of harmonics) w += h.a * Math.sin(h.f * th + h.p + ringI * 0.16 * drift);
    return (w / ampNorm) * maxWarp;
  };

  const SAMPLES = 132;
  const paths: string[] = [];
  for (let i = 0; i < rings; i++) {
    const baseR = innerR + i * step;
    let d = "";
    for (let s = 0; s <= SAMPLES; s++) {
      const th = (s / SAMPLES) * Math.PI * 2;
      const r = baseR + warpAt(th, i);
      const x = cx + Math.cos(th) * r * squashX;
      const y = cy + Math.sin(th) * r * squashY;
      d += (s === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    paths.push(d + "Z");
  }

  const minutiae: SigilArt["minutiae"] = [];
  const mCount = 4 + Math.floor(rnd() * 2) + stars;
  for (let m = 0; m < mCount; m++) {
    const ringI = 2 + Math.floor(rnd() * (rings - 3));
    const th = rnd() * Math.PI * 2;
    const r = innerR + ringI * step + warpAt(th, ringI);
    minutiae.push({ x: cx + Math.cos(th) * r * squashX, y: cy + Math.sin(th) * r * squashY, r: 0.7 + rnd() * 0.7 });
  }

  const ticks: SigilArt["ticks"] = [];
  for (let t = 0; t < 60; t++) {
    if (rnd() > 0.55) continue;
    const th = (t / 60) * Math.PI * 2;
    const r0 = outerR + 2.5;
    const r1 = r0 + 1.4 + rnd() * 1.8;
    ticks.push({ x1: 50 + Math.cos(th) * r0, y1: 50 + Math.sin(th) * r0, x2: 50 + Math.cos(th) * r1, y2: 50 + Math.sin(th) * r1 });
  }

  return { paths, minutiae, ticks, core: { x: cx, y: cy } };
}

/** Address-seeded generative "soul fingerprint" — a unique biometric sigil per wallet.
 *  Monochrome silver ridges; the rarity tier appears only as a glow/accent (no colour fills). */
function Sigil({ color, glow, seed, stars }: { color: string; glow: string; seed: number; stars: number }) {
  const art = useMemo(() => buildSigil(seed, stars), [seed, stars]);
  const glowId = `sg-glow-${seed}`;
  const mask =
    "radial-gradient(circle at 50% 50%, black 66%, rgba(0,0,0,0.55) 84%, transparent 97%)";
  return (
    <div className="relative h-32 w-32 sm:h-36 sm:w-36">
      {/* disc frame + tier halo */}
      <div
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: color + "33", boxShadow: `0 0 34px ${glow}, inset 0 0 24px ${color}1a` }}
      />
      <div className="absolute inset-[6px] rounded-full" style={{ border: `1px solid ${color}1c` }} />
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        style={{ WebkitMaskImage: mask, maskImage: mask }}
        aria-hidden
      >
        <defs>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.7" />
          </filter>
        </defs>

        {/* soft tier-coloured glow beneath the minutiae + core */}
        <g filter={`url(#${glowId})`} fill={color} opacity="0.55">
          {art.minutiae.map((m, i) => (
            <circle key={i} cx={m.x} cy={m.y} r={m.r + 1.1} />
          ))}
          <circle cx={art.core.x} cy={art.core.y} r="3.4" />
        </g>

        {/* fingerprint ridges — silver, brighter at the core, fading outward */}
        <g fill="none" strokeLinejoin="round" strokeLinecap="round">
          {art.paths.map((d, i) => {
            const t = i / art.paths.length; // 0 = innermost ridge, →1 = outermost
            const isCore = i < 3; // innermost ridges pick up the tier hue
            return (
              <path
                key={i}
                d={d}
                stroke={isCore ? color : "#e7e9ee"}
                strokeWidth={0.58 - t * 0.26}
                opacity={0.5 - t * 0.36}
              />
            );
          })}
        </g>

        {/* perimeter scan-ring ticks */}
        <g stroke={color} strokeWidth="0.5" opacity="0.4" strokeLinecap="round">
          {art.ticks.map((k, i) => (
            <line key={i} x1={k.x1} y1={k.y1} x2={k.x2} y2={k.y2} />
          ))}
        </g>

        {/* crisp minutiae + bright core */}
        {art.minutiae.map((m, i) => (
          <circle key={i} cx={m.x} cy={m.y} r={m.r} fill="#f4f5f8" />
        ))}
        <circle cx={art.core.x} cy={art.core.y} r="1.7" fill="#ffffff" />
        <circle cx={art.core.x} cy={art.core.y} r="3.0" fill="none" stroke={color} strokeWidth="0.5" opacity="0.7" />
      </svg>
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
  /** Optional curated AI form image (e.g. /souls/<slug>.png); falls back to generative Sigil. */
  imageUrl?: string;
  /** Evolution stage 1..10 (Dormant→Eternal). Renders the 10-dot ladder under the stats. */
  stage?: number;
  /** Stage label (e.g. "Tempered"). Appended to the archetype·tier meta line. */
  stageName?: string;
  /** Form's canonical title (e.g. "Cartographer Spirit"). Used as the card headline so the
   *  name actually matches the picture; the LLM's witty TYPE becomes the italic subtitle. */
  formName?: string;
  /** Prepaid evolutions this soul can still afford autonomously (0 → soul is paused). */
  fuelEvosLeft?: number;
};

export function SoulCard({ d, generation, activity, txCount, wallet, imageUrl, stage, stageName, formName, fuelEvosLeft }: SoulCardProps) {
  const stars = Math.max(0, Math.min(5, Number(d.rarity ?? 0)));
  const tier = TIERS[(stars > 0 ? stars : 1) - 1];
  const tierName = tier.name;
  const seed = wallet ? parseInt(wallet.slice(2, 12), 16) || 0 : 0;

  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const touchX = useRef<number | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
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
      const done = (ok: boolean) => {
        setCopyState(ok ? "copied" : "failed");
        setTimeout(() => setCopyState("idle"), 1400);
      };
      try {
        // Async Clipboard API — unavailable in insecure contexts / some in-app browsers.
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(wallet);
          done(true);
          return;
        }
        throw new Error("no clipboard api");
      } catch {
        // Fallback: hidden textarea + execCommand("copy"). Surfaces a visible "Copy failed"
        // if even this is blocked, instead of silently leaving the clipboard empty.
        try {
          const ta = document.createElement("textarea");
          ta.value = wallet;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          const ok = document.execCommand("copy");
          document.body.removeChild(ta);
          done(ok);
        } catch {
          done(false);
        }
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
        {/* Mouse/touch flip enhancement only. The keyboard- and screen-reader-accessible
            flip control is the <button> caption below the card — so this is NOT a
            role="button" wrapping the inner Copy <button> (no nested interactive controls). */}
        <div
          className={"sc-flipper" + (flipped ? " is-flipped" : "")}
          onClick={toggleFlip}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* ── FRONT FACE: holographic tilt card ─────────────── */}
          <div className="sc-face sc-face-front">
            <div ref={wrapRef} className="sc-wrapper">
              <section ref={cardRef} className="sc-card">
                <div className="sc-inside">
                  {imageUrl ? (
                    <>
                      {/* The image IS the card front (no inner chrome, no shine/glare). A gentle
                          floating animation in CSS makes the spirit hover so the still PNG reads
                          as alive — without distorting pixels (which felt unnatural). */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="sc-art-img" src={imageUrl} alt="" />
                      {/* hue retint: only chromatic accent pixels (lantern/eyes/crown/…) take the tier color */}
                      <div
                        className="sc-art-hue"
                        style={{ background: tier.color, mixBlendMode: "hue" }}
                      />
                      <div className="sc-content is-art">
                        <div className="sc-art-top">
                          <span className="sc-brand">Soulprint</span>
                          <span className="sc-tier">{tierName}</span>
                        </div>
                        <div className="sc-art-overlay">
                          <h3>{formName ?? d.type ?? "Unknown Soul"}</h3>
                          {formName && d.type && (
                            <p className="sc-art-nick">aka &ldquo;{d.type}&rdquo;</p>
                          )}
                          {d.style && (
                            <p className="sc-art-vibe">&ldquo;{d.style.replace(/^"|"$/g, "")}&rdquo;</p>
                          )}
                          <p>
                            {[
                              d.archetype ?? "Wallet",
                              tierName,
                              d.karma ? `Karma ${d.karma}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <div className="sc-art-stats">
                            <div>
                              <span className="sc-art-stat-v" style={{ color: tier.color }}>
                                {activity ?? "—"}
                              </span>
                              <span className="sc-art-stat-l">Activity</span>
                            </div>
                            <div>
                              <span className="sc-art-stat-v">
                                {txCount !== undefined ? txCount.toLocaleString("en-US") : "—"}
                              </span>
                              <span className="sc-art-stat-l">Txns</span>
                            </div>
                            <div>
                              <span className="sc-art-stat-v">{generation ?? "—"}</span>
                              <span className="sc-art-stat-l">Gen</span>
                            </div>
                          </div>
                          {stage !== undefined && (
                            <div
                              className="sc-art-ladder"
                              aria-label={`Stage ${stage} of 10`}
                              title={`Stage ${stage} / 10`}
                            >
                              {Array.from({ length: 10 }, (_, i) => {
                                const n = i + 1;
                                const cls = n === stage ? "is-cur" : n < stage ? "is-on" : "";
                                return <span key={n} className={cls} />;
                              })}
                            </div>
                          )}
                          {fuelEvosLeft !== undefined && (
                            <div
                              className={`sc-art-fuel ${fuelEvosLeft === 0 ? "is-empty" : ""}`}
                              title={
                                fuelEvosLeft === 0
                                  ? "Out of fuel — soul is paused. Boost it to resume autonomous evolution."
                                  : `Prepaid for ${fuelEvosLeft} more autonomous evolution${fuelEvosLeft === 1 ? "" : "s"}`
                              }
                            >
                              <span className="sc-art-fuel-dot" />
                              <span className="sc-art-fuel-label">
                                {fuelEvosLeft === 0
                                  ? "fuel · empty"
                                  : `fuel · ${fuelEvosLeft} evo${fuelEvosLeft === 1 ? "" : "s"}`}
                              </span>
                            </div>
                          )}
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
                              {copyState === "copied"
                                ? "Copied!"
                                : copyState === "failed"
                                ? "Copy failed"
                                : "Copy address"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="sc-shine" />
                      <div className="sc-glare" />
                      <div className="sc-content">
                        <div className="sc-top">
                          <span className="sc-brand">Soulprint</span>
                          <span className="sc-tier">{tierName}</span>
                        </div>
                        <div className="sc-avatar">
                          <Sigil color={tier.color} glow={tier.glow} seed={seed} stars={stars} />
                        </div>
                        <div className="sc-details">
                          <h3>{d.type ?? "Unidentified Wallet"}</h3>
                          <p>{(d.archetype ?? "Wallet") + " · " + tierName}</p>
                        </div>
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
                            {copyState === "copied"
                              ? "Copied!"
                              : copyState === "failed"
                              ? "Copy failed"
                              : "Copy address"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
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
      <button type="button" className="sc-flip-caption" onClick={toggleFlip}>
        {flipped ? "show front ⟲" : "tap or swipe to flip ⟲"}
      </button>
    </div>
  );
}
