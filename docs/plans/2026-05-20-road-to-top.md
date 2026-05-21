# Soulprint — Road to the "Top" Version

> Construction plan from today's state to a submission that maximally scores all 4 judging
> criteria. Supersedes the MVP plan (`2026-05-20-persona-mvp.md`, Tasks 0–19) for what's LEFT.
> Constraints baked in: **low STT balance (~33)**, the **≥32 STT gate** to create a Reactivity
> subscription, and **no GitHub remote yet** (user's call — push later, dates are preserved).

## Definition of "top"
A live dApp that, for each of the 4 criteria, has a concrete, demoable proof:
1. **Functionality** — full pipeline live, no failures during the program.
2. **Agent-First** — `profileOf`/`traitsOf`/`ProfileRequested` let agents invoke + consume it.
3. **Innovation** — native on-chain inference + soulbound identity + structured machine-readable traits.
4. **Autonomous Performance** — dossier self-evolves via on-chain Cron with **no human tx**.

## Already done (baseline)
- ✅ Live pipeline (JSON API → LLM → soulbound mint), ~6s, deployed on Shannon testnet.
- ✅ 18 Hardhat tests green; soulbound (ERC-5192); one-per-wallet; refund; `reread`.
- ✅ Agent-composability: `profileOf`, `traitsOf`, `ProfileRequested`.
- ✅ Structured dossier: canonical `ARCHETYPE`, on-chain `activityScore`, NFT `attributes`.
- ✅ README (judge-facing, 4-criteria map) + MIT LICENSE.
- ⏳ NOT live-redeployed since the structured-dossier change (batch with Cron redeploy).

---

## Dependency / parallelism map
```
        ┌─────────────────────────── PARALLEL ───────────────────────────┐
Phase B (frontend, 0 STT, web/ only)        Phase C (Cron, contracts/ only)
        │                                            │
        │                                   C0 top-up STT (async wait)
        │                                   C1 Cron logic on mock (free)
        │                                   C2 evolveAll() fallback (free)
        ▼                                            ▼
        └────────────► Phase D (submission package) ◄────── C3 live Cron proof (needs STT)
```
- **B and C touch different files** (`web/` vs `contracts/`) → can run in parallel / interleaved.
- **C is the critical path** and is gated by STT → start C0 (ask for STT) NOW, async.
- Do all Cron *logic* on the local mock for free; spend STT only on the final live proof.

---

## Phase A — Dossier content (cheap; mostly done)

### A1. Structured dossier — DONE ✅
Archetype + activityScore + attributes + traitsOf shipped today.

### A2. (Optional, +1 agent call) Richer stats for archetype accuracy
- **Goal:** add `token_transfers_count` (and maybe `is_contract`) so archetypes beyond
  Newborn/Explorer/Power-User (i.e. DeFi/NFT/Contract-Deployer) become accurate.
- **Files:** `contracts/Persona.sol` (new Stage + `_requestTransfers`/`handleTransfers`), `test/`.
- **Cost:** +~0.12 STT per read (one more JSON call); dev on mock is free.
- **Verify:** new TDD tests; archetype reflects transfer activity.
- **Exit:** keep ≤3 agent calls; tests green.
- **Decision:** do ONLY if A1's archetype quality looks weak in the live smoke test. Otherwise skip.
- **Conflicts:** edits the same contract as Phase C → serialize (do A2 before C1, or fold into C redeploy).

---

## Phase B — Frontend redesign (0 STT, parallel-safe)

### B1. Somnia-styled redesign via the frontend-design subagent
- **Goal:** replace the placeholder `web/app/page.tsx` with a designed UI matching somnia.network,
  carrying the locked positioning (hero: "your wallet's living on-chain identity", the
  "not an AI caption" line).
- **Files:** `web/app/*`, `web/components/*` (DossierCard et al.). Read from the deployed contract.
- **Must surface the new structured fields:** archetype badge, Activity meter (0–100),
  rarity stars, generation, the witty dossier text, NFT attributes.
- **How:** dispatch a subagent using `frontend-design:frontend-design` (per repo conventions).
- **Cost:** 0 STT (pure web; reads existing chain state).
- **Verify:** `cd web && npm run build` passes; manual local view against the live contract.
- **Exit:** designed read→loader→dossier flow; on-brand; mobile-ok.
- **Depends on:** A1 (structured fields) — satisfied.

### B2. Evolution timeline (visualizes the autonomy story)
- **Goal:** a small timeline/history of `generation` + `DossierUpdated` events → shows the NFT
  visibly changing over time (the "self-evolving" hook), even before Cron is live (reread feeds it).
- **Files:** `web/` (read logs via viem `getLogs`), a `Timeline` component.
- **Cost:** 0 STT.
- **Verify:** build passes; renders generations for a profiled wallet.
- **Exit:** timeline visible on the persona view.
- **Depends on:** B1.

---

## Phase C — Autonomous self-evolution (the headline criterion; STT-gated)

### C0. Top up STT — START NOW (async, blocks C3)
- **Goal:** get well above 32 STT (target ~60–80) so the Cron contract can hold ≥32 *and* still
  fund agent calls + redeploys.
- **How:** Somnia Discord `#dev-chat`, ping @emreyeth (or developers@somnia.foundation); also the
  standard faucets. This is a wait → kick it off immediately.
- **Exit:** burner / a fresh deployer wallet holds ≥60 STT.

### C1. Cron self-evolution logic (build + unit-test on the mock — FREE)
- **Goal:** add Somnia Reactivity so the contract re-runs the pipeline on a schedule with no human.
- **Approach:** `SomniaEventHandler` base; one-shot `scheduleSubscriptionAtTimestamp` that
  **self-reschedules inside the handler** (cron pattern). See the full working contract + API in
  `docs/reference/somnia-agents-guide.md` §C.
- **Files:** `contracts/Persona.sol` (or a handler module), `contracts/interfaces/ISomniaReactivity.sol`,
  `test/` (a mock scheduler driving the handler).
- **Cost:** 0 STT (all on local mock + unit tests).
- **Verify:** TDD — handler triggers a re-read; `generation` bumps; tolerant of underfunding.
- **Exit:** logic unit-tested green; ready for a funded deploy.
- **Conflicts:** edits `contracts/` → serialize with A2.

### C2. Permissionless `evolveAll()` fallback (FREE insurance)
- **Goal:** a batched, permissionless `evolveAll()` that re-reads N registered wallets per call —
  so autonomy is demoable even if live Cron wiring slips.
- **Files:** `contracts/Persona.sol`, `test/`.
- **Cost:** 0 STT to build/test; small STT per live batch.
- **Verify:** TDD — cursor advances, batch re-reads, skips when underfunded.
- **Exit:** green; gives a guaranteed autonomy story.
- **Note:** do this regardless — cheap insurance for criterion #4.

### C3. Live proof on testnet (spends STT; needs C0)
- **Goal:** redeploy (with the structured-dossier + Cron changes), fund ≥32 STT, schedule a short
  interval, and prove `generation` increments with **zero human tx**.
- **Files:** `scripts/deploy.ts` (seed ≥32), update `web/lib/persona.ts` `PERSONA_ADDRESS` + CLAUDE.md.
- **Cost:** ≥32 STT locked on contract + gas + a few agent calls.
- **Verify:** watch `generation`/`DossierUpdated` advance with no tx from us (cast/viem/explorer).
- **Exit:** recorded live autonomous evolution → the centerpiece of the demo video.
- **Depends on:** C0, C1 (and C2 as fallback), B can be ongoing in parallel.

---

## Phase D — Submission package (end)

### D1. README — DONE ✅ (refine once C3 flips autonomy from 🚧 to ✅)
### D2. Demo video (2–5 min)
- **Goal:** script (English) with a 10-second hook → live mint → dossier → **autonomous evolution** proof.
- **How:** Claude writes script → user runs TTS (Google/ElevenLabs) + screen recording.
- **Depends on:** C3 (the autonomy shot) + B1 (the pretty UI).
### D3. Push to public GitHub (when user is ready)
- `gh repo create` + push; commit dates already preserved. Verify no secrets (`.env` gitignored ✅).
### D4. Submission writeup mapped to the 4 criteria
- One short paragraph per criterion, each pointing at a concrete artifact/tx/feature.

---

## Recommended execution order (for a solo builder, minimizing STT pain)
1. **Now:** fire off **C0** (ask for STT in Discord — async) AND start **B1** (frontend, 0 STT).
2. **While STT arrives:** finish **B1/B2**, and build+unit-test **C1 + C2** on the mock (free).
   (Optionally **A2** first if archetypes look weak — fold into the same contract edit.)
3. **When STT lands:** **C3** — redeploy + live-prove Cron + live-smoke the structured dossier.
4. **Submission:** **D2** (video), **D4** (writeup), **D3** (GitHub push) — at the end.

## Self-review
- Critical path = C (Cron), gated by C0 (STT). De-risked by doing all logic free on the mock and by
  the C2 fallback. B runs fully in parallel (different files), so no idle time waiting for STT.
- Cost discipline: only A2 (optional) and C3 spend STT; everything else is free (mock/web).
- No GitHub dependency anywhere until D3, per the user's choice.
- Open question for the user: ambition ceiling — is genuine on-chain Cron (C3) the bar, or is the
  permissionless `evolveAll()` (C2) an acceptable "autonomy" story if STT/Reactivity wiring slips?
