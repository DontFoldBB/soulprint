# Soulprint — Project Context (read this first)

> **Tagline:** "A living AI dossier for your wallet." · punchline "Mint once. It evolves forever."
> Built for the **Encode Club Somnia Agentathon** (May 20 – June 11, 2026).

A self-updating dynamic NFT: connect/paste a wallet → on-chain **Somnia Agents** (JSON API
reads wallet stats + LLM Inference) generate an identity profile → minted as a **soulbound**
(ERC-5192) NFT → the profile **autonomously self-evolves** over time (Cron-Reactivity, no
human, no off-chain server). Other contracts/agents can invoke it and read profiles.

This is a hackathon project for a **beginner solo builder** who relies on Claude Code and
communicates in **Russian** (talk to the user in Russian). **All project artifacts — code,
docs, README, commit messages, AI prompts, the AI-generated NFT text, demo-video script —
are in ENGLISH.**

---

## ⟶ Resuming a session? Read `docs/handoff.md` FIRST (live snapshot, updated 2026-05-21)

GitHub: **https://github.com/DontFoldBB/soulprint** (public). Key deltas since day-1 below:
contract renamed Persona→**Soulprint** + structured dossier, tiered pricing (1 STT self / 2 STT
others), `withdraw`, `evolveBatch`, `SoulprintCron` (Cron autonomy), `ExampleGate`; 28 tests; solc
0.8.30; reactivity contracts **vendored** in `contracts/somnia-reactivity/` (don't npm-install that
pkg). MCP server in `mcp/`. Frontend redesigned (monochrome Somnia, holographic flip `SoulCard`,
Connect Wallet). **The live deployed contract (address below) is STALE — needs redeploy.** Pushes:
normal `git push` works; force-push must be run by the user. **Never add `Co-Authored-By: Claude`.**
Biggest remaining risk: **live Cron autonomy proof (criterion #4) not yet done.**

## Current status (day 1, 2026-05-20)

- ✅ Core contract **deployed & working live on Somnia testnet**: read → JSON API agent →
  LLM agent (Qwen3-30B) → soulbound mint, ~6s end to end. Verified by smoke test (funny,
  on-tone dossier with correct archetype).
- ✅ **13 Hardhat tests passing** (mock agent platform drives the async callbacks).
- ✅ Agent-callable entry done (`profileOf` view + `ProfileRequested` event).
- ✅ Next.js frontend wired to the deployed address + builds. (Minimal placeholder UI —
  to be replaced by a designed version, see Conventions.)
- ✅ All committed **locally** — **no GitHub remote yet** (must push to a public repo before
  submission).
- **Current deployed Soulprint:** `0x30e553c13eab2c125a466e2ccde228f692d36149`
  (redeployed 2026-05-21 with structured dossier + Cron-ready surface; address propagated
  to `web/lib/soulprint.ts`, `mcp/src/soulprint.ts`, `scripts/smokeTest.ts`).
- **Live SoulprintCron:** `0xb7cc93f4b5ae156abf1f73ea1d6593a0564d03cc` — **autonomy criterion #4
  PROVEN live**: ticks self-reschedule and `generation` rises with no human tx. Holds ~40 STT.
  Lesson: cron must hold **>32 STT** (the in-handler reschedule re-checks the 32-STT minimum
  after paying tick gas) and `maxFeePerGas` must be **> base fee** (0 → callback never mined).
- **Burner wallet (testnet only):** `0x3F86D1A143271A6c772f1CE57a24bAe2241004cC`. Topped up to
  ~84 STT on 2026-05-21. Private key is in `.env` (gitignored). NEVER use a real-money wallet here.

## Quick commands

```bash
# contracts (root dir)
npx hardhat test                 # run unit tests (must stay green)
npx hardhat compile
npx hardhat run scripts/deploy.ts --network somnia       # deploy (reads PRIVATE_KEY from .env)
npx hardhat run scripts/smokeTest.ts --network somnia     # live read of a wallet on testnet

# frontend
cd web && npm run dev            # local dev server
cd web && npm run build          # production build (catches TS errors)
```

## Architecture & key files

- `contracts/Soulprint.sol` — main contract (read pipeline, soulbound mint, dynamic tokenURI,
  refund, reread, profileOf, traitsOf, activityScore, withdraw). Renamed from `Persona` →
  `Soulprint` on 2026-05-21 (contract/file/NFT name/symbol = Soulprint/SOUL; mapping `soulprintOf`,
  event `SoulprintMinted`).
- `contracts/interfaces/ISomniaAgents.sol` — Somnia Agents platform + agent interfaces/structs.
- `contracts/mocks/MockAgentPlatform.sol` — synchronous platform stand-in for tests
  (`deliver(requestId, result, status)` invokes the callback).
- `test/Soulprint.test.ts` — unit tests (viem + hardhat).
- `scripts/deploy.ts`, `scripts/smokeTest.ts`, `scripts/checkExplorerApi.mjs` (spike).
- `web/` — Next.js 16 frontend (`app/page.tsx`, `components/DossierCard.tsx`,
  `lib/chain.ts`, `lib/soulprint.ts`).
- `docs/specs/2026-05-20-persona-design.md` — design spec (has branding/tone/scope decisions).
- `docs/plans/2026-05-20-persona-mvp.md` — task-by-task implementation plan (Tasks 0–19;
  resolved spike findings for explorer API and Reactivity API are recorded inside it).

> **Full detailed reference (READ for any Somnia integration work):**
> `docs/reference/somnia-agents-guide.md` — the complete official Somnia Agents dev guide
> (verbatim: agent call flow, 3 base agents + prices, BTC-oracle example, 4 gotcha tips, 5 use
> cases), plus all spike findings (explorer API, Reactivity API), gas differences, network info,
> reference repos, and idea-collision notes. The section below is the condensed version.

## Somnia technical reference (verified)

- Shannon testnet: chainId **50312**, RPC `https://api.infra.testnet.somnia.network`,
  explorer `https://shannon-explorer.somnia.network`, gas token **STT**.
- Solidity 0.8.24, Hardhat, `viaIR: true`, **`evmVersion: "cancun"`** (OZ v5 uses `mcopy`;
  Somnia supports it). OpenZeppelin v5 ERC-721 (`_update` hook for soulbound).
- **Agents platform (testnet):** `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`.
  Agent IDs: JSON API `13174292974160097713`, LLM Inference `12847293847561029384`,
  LLM Parse Website `12875401142070969085`.
- Async pattern: `createRequest{value: deposit}(agentId, callbackAddr, selector, payload)` →
  platform calls your callback `(requestId, Response[], ResponseStatus, Request)`.
- **Deposit formula:** `msg.value >= getRequestDeposit() + pricePerAgent * subcommitteeSize`.
  Per-validator: JSON API 0.03, LLM 0.07, Parse Website 0.10 STT; default subcommittee 3.
  Underfunding → request times out. Implement `receive() external payable` (rebates).
- Gate every callback: `require(msg.sender == platform)` + check the request was pending.
  Handle all statuses (Success/Failed/TimedOut) — decoding on non-Success panics.
- LLM model: **Qwen3-30B, temp=0, fixed seed** → deterministic (same input → same output).
- **Explorer API for wallet stats (JSON API agent target):**
  balance `https://shannon-explorer.somnia.network/api/v2/addresses/{addr}` → `coin_balance`;
  activity `.../api/v2/addresses/{addr}/counters` → `transactions_count`,
  `token_transfers_count`, `gas_usage_count`. (Blockscout v2; fresh addresses can lag.)
- **Reactivity (for Cron self-evolution):** package `@somnia-chain/reactivity-contracts`;
  base `SomniaEventHandler` (override `_onEvent`); precompile `0x0100`;
  `SomniaExtensions.scheduleSubscriptionAtTimestamp/Block/Epoch(handler, when, options)`
  (one-shot — self-reschedule for recurrence); **min 32 STT balance** on the contract to
  create a subscription (checked at creation, not consumed). In handler: `msg.sender==0x0100`,
  `tx.origin==owner`. SubscriptionOptions { uint64 priorityFeePerGas, maxFeePerGas, gasLimit }.

## Locked product decisions (2026-05-20)

- **Name: Soulprint** (ties to soulbound). "archetype/persona" = internal terms; "dossier" =
  the AI text. **Tone = BLEND:** AI output is BOTH structured (an **archetype** + 1–2 **scores**
  like Activity/Risk, machine-readable) AND a witty **summary** line (viral/roast hook for the
  user's ~250-person Telegram). Current contract prompt outputs TYPE/STRENGTH/WEAKNESS/STYLE/
  KARMA/NOTES/RARITY — fold the structured archetype+scores into this when refining.
- Archetypes: Newborn Wallet, Testnet Explorer, DeFi User, NFT Collector, Contract Deployer,
  Sybil-Like Farmer, Power User.
- Positioning: **dynamic on-chain identity / reputation primitive** (autonomy +
  agent-composability are the score-drivers), NOT "AI wrote a description."
- **NOT doing:** cross-chain reads, "AI judges good/bad wallet," privacy-as-headline.
  **Somnia testnet only.**

## Remaining work (rough order)

1. **Cron self-evolution** (the autonomy criterion) — add `SomniaEventHandler` + scheduled
   subscription; redeploy with ≥32 STT on the contract; prove `generation` increments with
   no human tx. Plan Task 19 has the resolved API. Hardest/riskiest part; has a fallback
   (permissionless `evolveAll()`) if needed.
2. **Structured-output + richer-stats refinements** (from Codex review): fetch more explorer
   fields (token transfers, NFT, deploys) so archetypes are accurate; add archetype + scores;
   render NFT `attributes` + a **timeline** (from `generation` + `DossierUpdated` events).
3. **Frontend redesign** — see Conventions (subagent + frontend-design, Somnia-styled).
4. **README + submission writeup mapped to the 4 judging criteria + 2–5 min demo video**
   (video via AI TTS: I write the English script → user runs Google TTS/ElevenLabs → records
   screen under the track).
5. **Push to public GitHub** before submission.

## Conventions

- **Frontend:** build/polish it via a **subagent using the `frontend-design:frontend-design`
  skill**, styled to match **Somnia's website** (somnia.network). Current `web/app/page.tsx`
  is a placeholder to replace.
- Talk to the user in **Russian**; keep all artifacts in **English**.
- Commit per logical step; never commit `.env` (gitignored). User is a beginner — explain
  crypto-ops (wallets, faucets, gas) simply and don't assume coding knowledge.
- The user pushes back honestly; ground ideas in their needs, don't just generate options.

## Judging criteria (optimize for these)

1. **Functionality** — works reliably, deployed, no critical failures during the program.
2. **Agent-First Design** — agents can discover, invoke, or interact with the system
   autonomously (we have `read`/`profileOf`/`ProfileRequested`).
3. **Innovation & Technical Creativity** — creative use of Somnia primitives.
4. **Autonomous Performance** — operates independently/stably (← the Cron self-evolution).

## Schedule (the user's dashboard shows GMT+5; programme tz Europe/London)

- Project Creation window: opens Wed May 20 ~21:30 (GMT+5), closes Mon May 25 03:59.
- Launch Event: ~Wed evening. **"How to build on Somnia"** (by George Walker, the engineer who
  built the Agents platform — most relevant workshop) ~Fri. "How to win a hackathon" ~Fri.
  Finale ~Thu Jun 11. Confirm exact times in the user's dashboard.
- Submission: working prototype + public GitHub + 2–5 min demo video.
- Community Telegram: https://t.me/+XHq0F0JXMyhmMzM0 · Somnia dev Discord: https://discord.com/invite/somnia (`#dev-chat`, ping @emreyeth for STT).

## Persistent memory

Cross-session memory lives at `C:\Users\lange\.claude\projects\F--pet-projects-somnia-hackaton\memory\`
(auto-loaded via MEMORY.md). It holds the user profile, feedback rules, and project notes.
Keep it updated as decisions change.
