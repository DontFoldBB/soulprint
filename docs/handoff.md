# Soulprint — Handoff snapshot (2026-05-21)

> Read this first when resuming in a fresh session. It captures current state, what's on GitHub,
> and what's left. Pairs with `CLAUDE.md` (project context), `docs/reference/somnia-agents-guide.md`
> (Agents+Reactivity reference), `docs/plans/2026-05-20-road-to-top.md`, `docs/economics.md`.

## ⟶ UPDATE 2026-05-21 (later session) — REDEPLOYED + CRON LIVE

- **Soulprint redeployed:** `0x30e553c13eab2c125a466e2ccde228f692d36149` (new structured build,
  seeded 3 STT). Address propagated to `web/lib/soulprint.ts`, `mcp/src/soulprint.ts`,
  `scripts/smokeTest.ts`. Old `0x0b89…66a1` is now retired.
- **🎉 SoulprintCron LIVE — autonomy criterion #4 PROVEN:** `0xb7cc93f4b5ae156abf1f73ea1d6593a0564d03cc`
  (holds ~40 STT, 30s interval). Ticks fire and self-reschedule with NO human tx; `generation`
  rose 1→2→3… on its own. Scripts: `scripts/deployCron.ts`, `restartCron.ts`, `recoverCron.ts`,
  `watchCron.ts`, `inspectSub.ts`. Two bugs were fixed to get here:
  1. `maxFeePerGas: 0` → scheduled callback never mined (must be ≥ base fee ~6 gwei). Now 50 gwei.
  2. Funding cron with **exactly 32 STT** → the in-handler `_scheduleNext()` re-checks the 32-STT
     minimum, but tick gas dropped balance below 32 → revert rolled back the whole tick. Fund **>32**.
- **Frontend is now TWO tabs** (was a single page): `/` = Mint (lookup/mint any wallet — input always
  visible — + result card + live activity feed) and `/dashboard` = System overview stats + your
  Soulprint (big-ish) + Evolution timeline + **Watching** (localStorage follow-list) + Leaderboard.
  Foreign cards open in a **modal** (CardModal), not in place. Card front now shows Activity/Txns/Gen.
  New libs: `lib/wallet.ts`, `lib/profile.ts`, `lib/dashboard.ts`, `lib/tiers.ts`, `lib/watchlist.ts`.
  The dashboard reads the new contract, so it shows REAL live data (minted count, autonomous evolutions).
- **Old (now-stale) lines below** ("needs redeploy", criterion #4 not proven) are superseded by this block.

## What Soulprint is
A soulbound (ERC-5192), self-evolving on-chain identity for a wallet, for the Encode × Somnia
Agentathon. On-chain Somnia agents (JSON API → on-chain LLM) read a wallet's history into a witty
"dossier" + structured archetype/scores, mint it as a soulbound NFT, and it self-evolves via Cron.
Positioning: **a composable reputation primitive** other contracts/agents read — not "AI wrote text".

## GitHub / git
- Repo: **https://github.com/DontFoldBB/soulprint** (public, owner `DontFoldBB`). Branch `master`.
- Normal `git push origin master` works (I can run it). **Force-push needs the USER to run it**
  (`! git push --force origin master`) — the harness blocks me from force-pushing master.
- **Do NOT add `Co-Authored-By: Claude` to commits** (user removed it from history; keep it off).
- git identity is set locally (langepas / langepas11@gmail.com).
- `.env` is gitignored (holds PRIVATE_KEY). Never commit it.

## Contracts (in `contracts/`, solc 0.8.30 / viaIR / cancun, OZ v5) — 28 Hardhat tests passing
- `Soulprint.sol` (renamed from `Persona`): `read(wallet)` pipeline → JSON API (tx_count) → LLM →
  soulbound mint. Key surface: `read` (payable, **1 STT self / 2 STT to profile another wallet**;
  NFT mints to the target; first-100 self-mints refunded), `reread`, `profileOf` (tokenId, dossier,
  generation), `traitsOf` (tokenId, archetype, activity, generation), `archetypeOf`, `activityScore`
  (on-chain 0–100 from tx_count), `soulprintOf`, `withdraw(amount)` (owner-only, recycle STT reserve),
  `evolveBatch(count)` (permissionless round-robin autonomous re-evolution; the Cron tick + fallback),
  dynamic on-chain `tokenURI` with `attributes` (Archetype/Activity/Generation). LLM prompt emits
  TYPE/ARCHETYPE/STRENGTH/WEAKNESS/STYLE/KARMA/NOTES/RARITY.
- `SoulprintCron.sol`: `SomniaEventHandler` that `scheduleSubscriptionAtTimestamp` → on tick calls
  `soulprint.evolveBatch()` → self-reschedules. **Autonomy criterion #4.** Live-only (precompile
  0x0100); needs **≥32 STT on the cron contract** to subscribe.
- `ExampleGate.sol`: "NFT-as-access" demo — `enter()` only if caller's Soulprint `activityScore >=`
  threshold. Proves composability (criterion #2).
- `contracts/somnia-reactivity/` = **vendored** `@somnia-chain/reactivity-contracts` (MIT). Do NOT
  `npm install` that package — it peer-conflicts with hardhat-toolbox; we vendored it instead.
- Toolchain note: typescript pinned to **5.7.x** (toolbox peer); solc **0.8.30**.

## Deployed (LIVE) state — STALE, needs redeploy
- Live contract: `0x0b8912155847fc7c1570e0dd5cd37fe0837966a1` on Somnia Shannon testnet
  (chainId 50312). **This is the OLD pre-rename / pre-structured-dossier / pre-Cron / pre-pricing
  build** (it has `personaOf`, `profileOf`, `dossier`, `generation`, old prompt). Local code is ahead.
- Existing tokens on it: #1 burner `0x3F86D1A143271A6c772f1CE57a24bAe2241004cC` ("The Shy Minter");
  #2 user `0x7dE5Db5d19bB0bfFa8c1fD0c725556D66fBad8a0` ("The One-Trick Pony").
- Burner (deployer) `0x3F86…04cC` ~34 STT (a top-up was requested in Somnia TG). PRIVATE_KEY in `.env`.

## MCP server (`mcp/`)
`get_soulprint(wallet)` reads `profileOf` live (read-only, no key). Built + verified against live
contract. Register: `node mcp/dist/index.js` as an MCP server. Agent-First proof.

## Frontend (`web/`, Next.js 16 / Turbopack) — builds clean
- Monochrome **Somnia** palette (near-black + white/halftone, **no neon** — earlier neon was wrong).
  Drifting halftone bg blobs (currently very faint — animation is PARKED per user).
- `SoulCard.tsx` = holographic, cursor-tilt **FLIP card** (click/swipe). Front: address-seeded
  halftone **sigil** avatar, TYPE headline, "archetype · tier", short address, Copy button,
  gen/soulbound. Back: STYLE quote, rarity ★, karma, activity meter, strength/weakness, notes.
  **Rarity is colour-coded**: Common steel `#8b9099`, Uncommon green `#5fb389`, Rare blue `#5b93de`,
  Epic violet `#a06fd6`, Legendary gold `#f0b94e`. "tap or swipe to flip" caption below the card.
- `page.tsx`: **Connect Wallet** button (auto-loads your card), address lookup for ANY wallet,
  view-existing-without-tx, auto chain-switch to Somnia, "See a sample dossier" preview.
  **Mint value is 1 STT flat right now** to match the live OLD contract; the contract's 1/2 split
  (self/other) + dynamic label are reverted in the UI until redeploy (restore them then).
  Reads the OLD live contract (so traitsOf/archetype/activity
  degrade gracefully until redeploy).
- `web/lib/soulprint.ts` holds `SOULPRINT_ADDRESS` — **update it after redeploy**.
- `DossierCard.tsx` is now unused (kept as fallback; can delete).
- Run: `cd web && npm run dev` (was running on :3000). Heed `web/AGENTS.md` (Next 16 specifics).

## Submission (Encode dashboard)
- Project "Soulprint" created (name + description + the fingerprint-on-wallet image).
- Stage 1 "Project Creation" deadline **Mon May 25, 03:59 GMT+5**. TODO on dashboard:
  **Add Challenge** (the Somnia agent track) + **Submit Now** (stage-1; not the final). Final ~Jun 11.

## REMAINING WORK (priority order)
1. **Redeploy `Soulprint` (new code) to testnet** → update `SOULPRINT_ADDRESS` in `web/lib/soulprint.ts`,
   `mcp/src/soulprint.ts` default, `scripts/smokeTest.ts`, and `CLAUDE.md`. (Deployer wallet needs STT.)
2. **Live Cron autonomy proof** (criterion #4): deploy `SoulprintCron` pointing at the new Soulprint,
   fund it **≥32 STT**, call `start()`, show `generation`/`ticks` rising with NO human tx. ~34 STT is
   tight (top-up requested). `evolveBatch()` is the cheap permissionless fallback to demo autonomy.
3. **Demo video** (2–5 min): English script → user runs TTS + screen capture.
4. **Submission writeup** mapped to the 4 criteria; Add-Challenge + Submit on dashboard.
5. Polish: background animation (parked), delete unused `DossierCard.tsx`, maybe gated/cost-aware
   evolution (cheap JSON check gates the expensive LLM — see `docs/economics.md`).

## Judging criteria status
1. Functionality ✅ (live pipeline, will be stronger post-redeploy). 2. Agent-First ✅ (profileOf/
   traitsOf/ProfileRequested + MCP + ExampleGate). 3. Innovation ✅ (native on-chain inference,
   soulbound identity primitive, structured traits). 4. Autonomous Performance 🔴 coded+unit-tested,
   **not yet proven live** — the #1 remaining risk.
