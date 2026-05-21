# Soulprint — Dashboard redesign (design spec, 2026-05-21)

> Replaces the single hero + one card at the bottom of `web/app/page.tsx` with a
> **command-center dashboard** (concept "C"). Decided via brainstorming with the user.

## Goal
Turn the landing page into a dashboard that (a) drives a newcomer to mint their own
Soulprint and (b) showcases the ecosystem + **autonomous self-evolution** (judging
criterion #4) so it's visually obvious the system is alive.

## Two adaptive states (same page)

### State 1 — wallet NOT connected (CTA dominates; user's explicit pick)
- Hero: tagline + the existing read panel (`0x… → Read me · 1 STT`) + Connect Wallet
  + "See a sample dossier" — this is the dominant block.
- Below, secondary (proof-of-life, smaller): ecosystem stat strip + a recent-Soulprints
  / leaderboard teaser strip.

### State 2 — wallet connected (or after a lookup resolves)
- Thin **ecosystem stat strip** on top: `total minted`, `evolutions`, `Cron status`.
- **Hero = your zone**: the `SoulCard` (flip, kept as-is) + stat tiles
  (Activity 0–100, Generation, Karma, Rarity) + a raw line (tx count · last-updated ·
  Re-read button) + an **evolution timeline** (gen 1 → 2 → 3).
- Below: **leaderboard by activity** + **live evolution feed** (autonomy proof).

## Data sources (all from the NEW Soulprint contract)
Per wallet/token: `soulprintOf`, `dossier`, `txCountOf`, `generation`, `lastUpdated`,
`activityScore`, `archetypeOf`, `traitsOf`. Ecosystem: `totalSoulprints`,
`registeredWallets(i)` (length == `totalSoulprints`, enumerate 0..n-1).
Feeds/timeline from event logs: `SoulprintMinted(wallet, tokenId)`,
`DossierUpdated(tokenId, generation)`. Cron status: presence of recent
`DossierUpdated` with no human tx (and/or read from the cron contract later).

## Components (in `web/`)
- `app/page.tsx` — orchestrates the two states + data fetching.
- Keep `SoulCard.tsx` (the flip card) as-is — it's the centerpiece of "your zone".
- New: `StatStrip` (ecosystem counters), `StatTiles` (activity/gen/karma/rarity),
  `EvolutionTimeline` (per-token generation history from logs), `Leaderboard`
  (sorted by activityScore), `EvolutionFeed` (recent DossierUpdated across all tokens).
- Extend `lib/soulprint.ts` ABI with the missing views + event definitions.
- Styling: monochrome Somnia palette, reuse existing tokens/`globals.css`. Built via the
  `frontend-design` skill per project convention.

## Contract dependency / sequencing (important)
The full dashboard needs the **new** contract; the live one (`0x0b89…66a1`) is the old
build and lacks `totalSoulprints` / `registeredWallets` / `lastUpdated` / `DossierUpdated`.
Approach: build against the **new ABI with graceful degradation** — every ecosystem/feed
read is wrapped so a missing function/empty result renders an empty-but-not-broken state
(skeleton/"—"/sample). After redeploy + `SOULPRINT_ADDRESS` update, the dashboard lights
up fully with real data. Sample data (`SAMPLE_DOSSIER`) still powers the preview.

## Out of scope (YAGNI for now)
- No new contract changes for this work (data already exists on the new build).
- No charts library; timeline + meters are hand-rolled with existing CSS idioms.
- Background blob animation stays parked.

## Open thinning risk
With only 2 minted tokens pre-demo, leaderboard/feed look sparse. Acceptable: they grow
during the demo (and `evolveBatch`/Cron produces feed entries). Empty states must read as
"nothing yet", not "broken".
