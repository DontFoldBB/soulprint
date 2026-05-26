# Soulprint — Handoff snapshot (2026-05-26)

## ⟶ UPDATE 2026-05-26 — PREPAID EVOLUTION FUEL SHIPPED + REDEPLOY

**Closed the long-standing economics gap (`docs/economics.md` part 1).** Per-token `evoBalance`
plus public `topUpEvolution` plus owner-`withdraw` gated on `availableForWithdraw()` — the
"autonomous tick eats forever" problem is now structurally bounded.

**Contract changes (live in `0x6876…56e5`):**
- `evoBalance[tokenId]` (per-token STT reserved for future evolutions) + `totalReserved` sum
- Constants: `EVOLUTION_COST = 0.4 STT`, `INITIAL_FUEL_GRANT = 0.4 STT` (~1 evolution included
  with mint)
- New external: `topUpEvolution(uint256 tokenId) payable` — ANYONE can fund any soul's fuel
- New view: `evolutionFuel(tokenId) → (balance, costPerEvolution, evolutionsRemaining)`
- New view: `availableForWithdraw()` — caps `withdraw` so owner never dips into `totalReserved`
- New event: `EvolutionPaused(tokenId, balance)` (out of fuel)
- New event: `ToppedUp(tokenId, by, amount, newBalance)`
- `handleStats` now fuel-gates the re-evolution branch (after the tx_count cost-gate)
- `evolveBatch` pre-filters out-of-fuel souls — saves the JSON poll on frozen souls
- **+6 tests, 47/47 green** (was 41)

**Frontend wiring:**
- `web/lib/profile.ts` reads `evolutionFuel` → adds `fuelEvosLeft` to `WalletProfile`
- `web/components/SoulCard.tsx` + `.css` — minimal "FUEL · N evos" indicator under the Stage
  ladder; turns ember-red on empty
- `web/components/BoostButton.tsx` — new; calls `topUpEvolution` with 1 STT default; wired into
  `app/page.tsx` (next to ☆ Watch), `app/dashboard/page.tsx` (under your-soulprint card), and
  `CardModal.tsx` (between the card and EvolutionTimeline)
- `web/lib/soulprint.ts` ABI extended with `evolutionFuel`, `topUpEvolution`, `EVOLUTION_COST`
- web build green

**REDEPLOYED 2026-05-26 (latest live pair):**
- **Soulprint:** `0x6876041cc67f9cd1b11e6e1827b13f3622d256e5` (12 STT seeded, includes the fuel
  system + the entire Soul Evolution System + audit hardening). Smoke-tested: read(burner)
  minted "The Ghost / Testnet Explorer" in ~6s; `evolutionFuel(1)` reports
  `(0.4, 0.4, 1)` ✓; `totalReserved=0.4` ✓; `availableForWithdraw=11.26` ✓.
- **SoulprintCron:** `0x0bf4e395ad3746632f86b5254fa18f0db3479d95` (40 STT, `subscriptionId` 2267508
  armed, 30-min interval, batch 5, `ticks=0`).
- Old `0xbc55…463ab` Soulprint + `0x3cad…4a6b` Cron retired via `scripts/retireOld.ts` (~47.7 STT
  recovered). Old cron reached 35 ticks → 2 real evolutions → criterion #4 was proven live on
  that deploy too; event history stays on-chain.
- All 15 address references repointed (`web/lib`, `mcp/src`, `scripts/*`, README, CLAUDE,
  this doc, runbook).

**Demo angle for the video:**
- The Boost button is the new "wow" moment between the Mint and Autonomy sections of the runbook
  — see `docs/demo-runbook.md` (0:50–1:10).
- "Anyone can keep any soul alive" is a strong virality / public-good narrative beat that maps
  cleanly to criteria #2 (Agent-First — anyone, including bots/contracts, can `topUpEvolution`)
  and #3 (Innovation — bounded-cost-by-design + boost mechanic).


> Read this first when resuming in a fresh session. It captures current state, what's on GitHub,
> and what's left. Pairs with `CLAUDE.md` (project context), `docs/reference/somnia-agents-guide.md`
> (Agents+Reactivity reference), `docs/plans/2026-05-20-road-to-top.md`, `docs/economics.md`.

## ⟶ UPDATE 2026-05-25 — SOUL EVOLUTION SYSTEM REDEPLOYED + LIVE

**This session built + shipped the Soul Evolution System on-chain:**
- **10 stages × 30 forms** evolution system designed and deployed end-to-end.
- `contracts/Soulprint.sol` extended: `stageOf(tokenId)`, `formIdOf(tokenId)`, `formSlugOf(tokenId)`,
  `evolutionOf(wallet)` + helpers (`_stageFromTxCount`, `_archetypeIdx`, `_formIdFor`, `_formSlug`).
  Stage 1–10 = bucketed `tx_count` thresholds; Form 1–30 = lookup(archetype × stage). Stage+Form added
  to `tokenURI` attributes. **41 tests green** (was 36; +5 new for stage/form/`evolutionOf`/tokenURI).
- **30 monochrome spirit PNGs** (51 MB) generated via ChatGPT (per the spec prompts), saved to
  `web/public/souls/<slug>.png`. Verified via the contact sheet at `web/public/souls-contact.html`.
- Full spec + ready-to-paste prompts: `docs/specs/2026-05-23-soul-evolution-system.md` (§6.3).
- Frontend: `web/lib/evolution.ts` (JS mirror of contract stage/form logic — also reads on-chain
  directly via the new `evolutionOf` getter once that path is wired).
  `web/lib/profile.ts` extended with `stage/stageName/formId/formSlug/formName`.
  `web/components/SoulCard.tsx + .css` — image driven by `formSlug`, **headline = plain-English role
  name** (Cartographer, Yield Farmer, DeFi Whale, Sybil Hydra, Onchain Legend …; see NAMES in
  evolution.ts), **STYLE quote as the viral hook**, KARMA in meta, **10-dot Stage ladder**.
  Front kept minimal — Strength/Weakness/Notes stay on the back-face (flip).
- web lint+build green, 41 tests green.

**REDEPLOYED 2026-05-25 (latest live pair):**
- **Soulprint:** `0xbc55dc48cdafb62cc054e1b9424b0429c1750af9` (12 STT reserve, evolution system
  on-chain, audit hardening preserved).
- **SoulprintCron:** `0x3cadf41dcc651366b23cce43086dd646043c4a6b` (40 STT, 30-min interval, batch 5,
  `subscriptionId` 2071983 armed at deploy, `ticks` accrues from 0).
- Old `0x92c5…463ab` Soulprint + `0x9f4f…cc3e6` Cron drained via `scripts/retireOld.ts`
  (~39.6 STT recovered) and abandoned — their event history stays on-chain. All 12
  address references repointed (`web/lib`, `mcp/src`, `scripts/*`, `README`, `CLAUDE.md`, this doc).

**Next stretch after redeploy:** extend the LLM prompt in `_requestDossier` so the agent emits
additional AI fields per wallet — `HEADLINE` / `ROAST` / `PROPHECY` / `VIBE_TAG` — same agent call,
more AI content per token. Frontend then surfaces them. The biggest "max-AI" lever left.

---

## ⟶ UPDATE 2026-05-22 — LIVE STATE VERIFIED ON-CHAIN + P0/P2 FIXES + REDEPLOY

**REDEPLOYED 2026-05-22 (latest):** new **Soulprint `0x92c5f242…463ab`** (12 STT reserve, includes
the contract hardening below; smoke-tested live — minted "The Ghost / Testnet Explorer" in ~6s) +
new **Cron `0x9f4f4476…cc3e6`** (40 STT, `subscriptionId` 1192136 armed, `ticks` from 0). The old
`0x5cc8…` / `0x9eef…` were drained via `retireOld.ts` (≈50 STT recycled) and abandoned — their event
history (incl. the 21-tick autonomy proof) stays on-chain. All web/mcp/scripts/docs repointed.
**Earlier mentions of `0x5cc8…` / `0x9eef…` below are the now-retired predecessors.**

Verified the live contracts directly on Somnia (not just from docs) and fixed two silent bugs.

- **Soulprint `0x5cc8…f232` reserve was DRAINED (0.317 STT)** — below the ~0.36 STT a single
  evolution needs, so the cron was ticking but only emitting `EvolutionSkipped` (no real evolution;
  `generation` stuck at 2 for ~10h). **Topped up to 10.32 STT** via the new `scripts/fundSoulprint.ts`
  (tx `0x4c081a7e…544a`, 10 STT from the burner). Re-run that script (`FUND_STT=N`) when it gets low;
  `withdraw()` recovers unused STT.
- **LIVE cron is `0x9eefd1e1…da1d`** (confirmed: `ticks`=21, `subscriptionId`=1181487 i.e. armed,
  39.9 STT, 30-min interval, batch 5, target = current Soulprint). The cron mechanism (self-reschedule,
  no human tx) is genuinely live → **criterion #4 holds**.
- **`0xb7cc93f4…03cc` is a DEAD old cron** (0 STT, `subscriptionId`=0, points at retired Soulprint
  `0x30E5…`). The ops scripts wrongly targeted it → **repointed `watchCron.ts`/`restartCron.ts`/
  `inspectSub.ts` to the live `0x9eef…`** (`recoverCron.ts` keeps `0xb7cc…` with a "retired" note).
  `inspectSub.ts` now reads the *current* subscriptionId from the cron (it changes every tick).
- **Frontend mint bug fixed:** `web/app/page.tsx` sent 1 STT flat, but the contract needs **2 STT to
  profile someone else** → "profile any wallet" reverted. Now sends 1 (self) / 2 (other) by signer,
  with matching button label + helper text. `npm run build` green.
- **README fully refreshed** to the real state (both live addresses + explorer links, criterion #4 ✅,
  28 tests, SoulprintCron/MCP/ExampleGate/cost-gated evolution). Stale root `AGENTS.md` (a Codex-era
  dup of CLAUDE.md) → replaced with a pointer to `CLAUDE.md`.
- **Demo tip:** cost-gating only re-evolves a wallet whose `tx_count` changed. The burner's count just
  changed (it sent the top-up tx), so the next autonomous cron tick should bump token #1 `generation`
  2→3 with NO human tx — a clean shot to capture for the video.
- **Contract hardening (audit response — in code + tests, NOT yet redeployed):** added a
  `pendingRead` guard (a 2nd `read`/`reread` for the same wallet while a pipeline is in flight now
  reverts — kills duplicate pipelines / fake `generation` bumps); made the free-mint refund
  **non-reverting** (a rejecting recipient or a thin reserve can no longer revert the whole mint —
  emits `RefundFailed`, and a free slot is consumed only on a successful refund); added an owner
  `clearPending` escape hatch. **31 tests green** (was 28). The LIVE `0x5cc8…` still runs the
  pre-fix bytecode → a redeploy is needed to put these on-chain (see next).
- **Redeploy is STT-gated:** `SoulprintCron.soulprint` is **immutable**, so a new Soulprint forces a
  NEW funded cron (≥32 STT) + re-proving autonomy from `ticks`=0. Burner is ~27 STT → below the 32
  floor; needs a faucet top-up first. The two fixed bugs need adversarial conditions (deliberate
  double-submit; near-empty reserve + a contract recipient), so the low-volume live demo is
  unaffected — deferring the redeploy is safe.
- **Still open:** demo video + final Encode submission writeup (deferred by the user).

## ⟶ UPDATE 2026-05-21 (later session) — REDEPLOYED + CRON LIVE

- **Soulprint (CURRENT):** `0x5cc8b871013a252d9fdbc807b6f0a5d0d951f232` — adds **cost-gated
  evolution** (skips LLM + `generation` bump when `tx_count` unchanged → re-evolves only on real
  activity; verified live: an idle re-evolve emitted `EvolutionSkipped`, gen stayed 1). Seeded 3 STT.
  Earlier builds `0x30e5…36149` and `0x0b89…66a1` are retired. Address is in `web/lib/soulprint.ts`,
  `mcp/src/soulprint.ts`, `scripts/{smokeTest,deployCron,watchCron,evolveOnce}.ts`.
- **🎉 SoulprintCron LIVE — autonomy criterion #4 PROVEN:** current `0x9eefd1e11cf7e813d1bb62ed52a105a1cb46da1d`
  (~40 STT, now **30-min** interval, batch 5). Autonomy was verified at a 30s interval on the prior
  build: ticks fired and self-rescheduled with NO human tx and `generation` rose 1→2→3 on its own.
  `setParams(interval, batch)` retunes cadence. Scripts: `scripts/deployCron.ts`, `restartCron.ts`,
  `recoverCron.ts`, `watchCron.ts`, `inspectSub.ts`, `evolveOnce.ts`. Two bugs were fixed to get here:
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

---

> **⚠ HISTORICAL — everything below is the original day-1 snapshot.** It predates the 2026-05-22
> redeploy + audit fixes and is OUTDATED (old addresses, "needs redeploy", "1 STT flat", old test
> counts, "cron not proven"). For current state use the dated blocks at the TOP of this file.

## (historical) Deployed state — superseded by the 2026-05-22 redeploy
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
