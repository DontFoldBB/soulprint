# Soulprint — your wallet's living on-chain identity

> *Not an AI caption for your wallet — an identity primitive other agents can build on.*

**A soulbound, self-evolving identity primitive.** Somnia's on-chain AI agents read a wallet's
history into an archetype, mint it as a living NFT, and **autonomously re-evaluate it over time via
on-chain Cron** — composable by any contract via `profileOf`, with no server and no human in the loop.

**Mint once. It evolves forever.**

Built for the **Encode Club × Somnia Agentathon** (May–June 2026).

<!-- TODO before submission: replace with a 3–6s GIF of the mint flow (paste wallet → dossier card) -->
> 🌐 **Live frontend:** <https://soulprint-psi.vercel.app> (Vercel) · 🔴 **Live on Somnia Shannon testnet**
> · 📹 **Demo video:** _<link — 2–5 min walkthrough>_
> · 🎬 Shooting recipes: [`docs/demo-runbook.md`](docs/demo-runbook.md) (strategy) + [`docs/demo-recording-script.md`](docs/demo-recording-script.md) (second-by-second + locked narration)
> · 📦 **Encode submission artifacts:** [`docs/submission/`](docs/submission/) (deck PDF, architecture SVG, copy-paste text)

---

## 60-second pitch

Every wallet already has a personality written in its on-chain history — but it's locked in raw
counters no human reads. **Soulprint computes that identity entirely on-chain:**

1. You point Soulprint at a wallet (yours or anyone's).
2. A **Somnia JSON API agent** reads the wallet's real activity from the chain explorer.
3. A **Somnia on-chain LLM (Qwen3-30B)** distills it into a witty, structured **dossier** — an
   invented archetype + strength/weakness/style/karma/rarity.
4. It's minted as a **soulbound NFT (ERC-5192)** — bound to the wallet, can't be sold or moved.
5. An **on-chain Cron** (Somnia Reactivity) keeps re-evaluating it as the wallet behaves — each
   update is a new on-chain `generation`, with **no human transaction and no off-chain keeper.**

The whole read → reason → mint pipeline runs **end-to-end in ~6 seconds**, with the AI executed by
Somnia's validator network and verified by consensus — **not a single off-chain server in the loop.**

---

## Why this is different (the part most "AI on-chain" projects skip)

Most "AI on Somnia" projects call Gemini/Groq **off-chain** and only settle the result on-chain.
Soulprint uses Somnia's **native on-chain inference** — the AI runs deterministically across
validators (fixed seed, temp 0) and the output is consensus-verified state, like any other
on-chain value.

It's also not an end-product NFT — it's a **primitive**: a single `profileOf(wallet)` /
`traitsOf(wallet)` call lets any other contract or agent ask *"who is this wallet?"* and build on
the answer (gating, scoring, reputation, matchmaking). The included `ExampleGate` contract and the
`mcp/` server are two live consumers of exactly that.

---

## How we map to the judging criteria

| Criterion | What Soulprint does | Status |
|---|---|---|
| **1. Functionality** | Full read → AI → soulbound mint pipeline **deployed and working live** on Shannon testnet, ~6s end to end. **47 Hardhat tests** green. | ✅ Live |
| **2. Agent-First Design** | The contract **orchestrates two base agents** (JSON API → LLM) in one pipeline. `read(wallet)` + `ProfileRequested` let any agent trigger a run; `profileOf` / `traitsOf` / `evolutionOf` / `evolutionFuel` let any contract consume the result. Live consumers: an **MCP server** (`mcp/`) and **`ExampleGate`** (NFT-as-access). | ✅ Live |
| **3. Innovation & Technical Creativity** | Native on-chain inference (not off-chain), a **chained read→reason agent pipeline**, soulbound **identity** (not a tradeable collectible), a fully **on-chain dynamic `tokenURI`**, **cost-gated evolution** (cheap on-chain check gates the expensive LLM), a **30-form Soul Evolution System** (10 stages × 3 archetype lines — Stage + Form as `tokenURI` traits), and **Prepaid Evolution Fuel** (per-token `evoBalance`, public `topUpEvolution` — bounds the project's forever-cost and makes "keep this soul alive" a public good anyone can fund). | ✅ Live |
| **4. Autonomous Performance** | The dossier **self-evolves with no human in the loop**: `SoulprintCron` (a Somnia Reactivity `SomniaEventHandler`) fires on a schedule, calls `evolveBatch()`, and **self-reschedules the next tick**. Verifiable on-chain: `ticks()` keeps rising and `subscriptionId()` re-arms with **zero human transactions** between ticks. The previous live cron (`0x3cad…`) reached **35 autonomous ticks → 2 real evolutions on the soul that bumped tx_count**, all other ticks correctly cost-gated. | ✅ Live (35-tick history on prior cron; fresh cron armed) |

---

## Live deployment (Somnia Shannon testnet, chainId `50312`)

| | |
|---|---|
| **Soulprint** (core) | [`0x6876041cc67f9cd1b11e6e1827b13f3622d256e5`](https://shannon-explorer.somnia.network/address/0x6876041cc67f9cd1b11e6e1827b13f3622d256e5) |
| **SoulprintCron** (autonomy) | [`0x0bf4e395ad3746632f86b5254fa18f0db3479d95`](https://shannon-explorer.somnia.network/address/0x0bf4e395ad3746632f86b5254fa18f0db3479d95) |
| Somnia Agents platform | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` |
| Agents used | JSON API Request (`13174…`) + LLM Inference / Qwen3-30B (`12847…`) |

The contract, its file, and the NFT name/symbol are all **Soulprint** / **SOUL**.

### Verifying autonomy yourself (criterion #4)

`SoulprintCron` runs a one-shot Somnia Reactivity subscription that **reschedules itself inside the
handler**, so it recurs forever with no keeper. On the live cron:

- `ticks()` increments every interval and `subscriptionId()` is non-zero (the next tick is
  armed) — **read both on the explorer** and watch them advance with no human transaction.
- Each tick calls `Soulprint.evolveBatch()`, which re-reads registered wallets and re-runs the LLM
  for any whose on-chain activity changed, bumping `generation` and emitting `DossierUpdated`.
  Idle wallets are skipped (`EvolutionSkipped`) so the reserve isn't burned — **cost-gated by design**.
- Crucially, there are **no human transactions** to the cron between ticks: the schedule is the
  validator network executing the contract on time.

> Operating note: the LLM is deterministic, so re-evolution only produces a *new* dossier when the
> wallet's `transactions_count` actually changes. To watch a live evolution, make any transaction
> from a profiled wallet and watch its `generation` rise on the next tick — autonomously.

---

## How it works (architecture)

```
                  read(wallet) ─┐ (or ProfileRequested from another agent)
                                ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  Soulprint contract (ERC-721 + ERC-5192 soulbound)            │
   │                                                               │
   │  1. JSON API agent  ──► reads wallet stats from chain         │
   │     (shannon-explorer /addresses/{wallet}/counters)           │
   │                          │ tx_count                           │
   │     cost gate: tx_count unchanged? ──► skip the LLM           │
   │                          │ (changed)                          │
   │  2. LLM agent       ◄────┘ ──► writes the dossier             │
   │     (Qwen3-30B, deterministic, consensus-verified)            │
   │                          │                                    │
   │  3. mint soulbound NFT ──┘  dynamic tokenURI (on-chain JSON)  │
   │     generation++, emit DossierUpdated                         │
   └───────────────▲─────────────────────────────────┬───────────┘
                   │ evolveBatch()  (no human tx)      │ profileOf / traitsOf
   ┌───────────────┴───────────────┐    any contract/agent reads the profile
   │  SoulprintCron (Reactivity)    │    (e.g. ExampleGate, the MCP server)
   │  scheduled tick → self-reschedule
   └───────────────────────────────┘
```

**Async agent pattern:** `read()` fires a JSON API request; the platform calls back `handleStats`,
which (if activity changed) fires the LLM request; the platform calls back `handleDossier`, which
mints/updates. Every callback is gated (`msg.sender == platform` + pending-request check) and every
response status is handled.

**Dossier format** (what the on-chain LLM is prompted to produce):
`TYPE` (invented archetype + tier) · `ARCHETYPE` (one of a fixed set) · `STRENGTH` · `WEAKNESS` ·
`STYLE` · `KARMA` · `NOTES` · `RARITY`.

**Soul Evolution System** (derived on-chain, not from the LLM): every Soulprint also has a
`Stage` (1–10, bucketed from `tx_count`) and a `Form` (1–30, looked up from
archetype × stage) — see [`docs/specs/2026-05-23-soul-evolution-system.md`](docs/specs/2026-05-23-soul-evolution-system.md).
Both are stored on-chain (`stageOf`, `formIdOf`, `formSlugOf`) and surfaced as `tokenURI` traits so
agents and marketplaces can read the visual evolution without parsing the dossier text.

---

## Contract surface

| Function / event | Purpose |
|---|---|
| `read(address wallet) payable` | Start the pipeline for a wallet; mints on completion. **1 STT for your own wallet, 2 STT for anyone else.** First 100 self-mints are refunded. |
| `reread(uint256 tokenId)` | Owner refreshes an existing profile (new generation). |
| `evolveBatch(uint256 count)` | **Permissionless** round-robin re-evaluation of registered wallets — the Cron tick, also a manual fallback. Skips wallets the reserve can't fund (never half-fails). |
| `profileOf(address) → (tokenId, dossier, generation)` | **Agent-composable** one-call read. |
| `traitsOf(address) → (tokenId, archetype, activity, generation)` | Machine-readable traits (canonical archetype + 0–100 activity score). |
| `evolutionOf(address) → (tokenId, stage, formId, formSlug, generation)` | One-call read of the wallet's current Stage (1–10) + Form (1–30) — the on-chain visual evolution state. |
| `stageOf(tokenId)` / `formIdOf(tokenId)` / `formSlugOf(tokenId)` | Per-token reads of the Soul Evolution System. |
| `evolutionFuel(tokenId) → (balance, costPerEvolution, evolutionsRemaining)` | Prepaid fuel state: how much STT is left for this soul, the per-evolution cost, and how many full evolutions that funds. |
| `topUpEvolution(uint256 tokenId) payable` | **Anyone** can top up any soul's prepaid evolution fuel — keeping a soul alive is a public good. STT is locked into the per-token balance and never withdrawable by the contract owner. |
| `availableForWithdraw()` | What the owner is actually allowed to withdraw — everything in the contract balance EXCEPT `totalReserved` (the sum of all per-token fuel). |
| `activityScore` / `archetypeOf` | Deterministic on-chain score; canonical archetype parsed from the dossier. |
| `tokenURI(uint256)` | Fully on-chain, regenerated metadata + `attributes` + dossier per generation. |
| `locked(uint256) → true` / `_update` revert | ERC-5192 soulbound: profiles can't be transferred. |
| `withdraw(uint256)` (owner) | Recycle the STT reserve into the next deployment. |
| `ProfileRequested`, `SoulprintMinted`, `DossierUpdated`, `EvolutionSkipped`, `Locked` | Events for indexers / agents / the timeline. |

**Companion contracts**
- **`SoulprintCron`** — Somnia Reactivity handler; the autonomy engine (criterion #4).
- **`ExampleGate`** — minimal third party that composes on Soulprint: `enter()` succeeds only if the
  caller's soulbound `activityScore` clears a threshold. Access reflects real on-chain history and
  can't be bought.

**`mcp/` — Model Context Protocol server.** Exposes `get_soulprint(wallet)` so any AI agent can read
a wallet's live profile (read-only, no key). Concrete proof of Agent-First consumption.

---

## Cost-aware by design

Two on-chain mechanisms bound the project's "forever-cost" from the autonomous tick:

1. **Cost-gated evolution.** A cheap on-chain check (`tx_count` vs the stored value) gates the
   expensive LLM, so idle wallets don't burn the reserve on every tick (cron emits `EvolutionSkipped`).
2. **Prepaid Evolution Fuel.** Each Soulprint carries its own `evoBalance` (in STT). The mint
   includes `INITIAL_FUEL_GRANT` (≈1 evolution) and every successful re-evolution deducts
   `EVOLUTION_COST` from THAT soul's balance — not from a shared kitty. When fuel runs out the
   cron emits `EvolutionPaused(tokenId, balance)` and the soul freezes at its last form.

**Anyone can revive a paused soul** via `topUpEvolution(tokenId) payable`. That STT is locked into
the per-token balance and the contract owner can never withdraw it (`withdraw` is gated by
`availableForWithdraw()`). Keeping a soul alive becomes a public good — boost a friend's, boost a
founder's, pool-fund the most active wallet on the leaderboard.

See [`docs/economics.md`](docs/economics.md) for the full thinking and the post-hackathon roadmap
(consumers-pay-to-read for the reputation primitive itself).

---

## Run it locally

```bash
# Contracts (repo root)
npm install
npx hardhat test                                        # 47 tests, must stay green
npx hardhat run scripts/deploy.ts --network somnia      # deploy (reads PRIVATE_KEY from .env)
npx hardhat run scripts/smokeTest.ts --network somnia   # live read of a wallet on testnet

# Autonomy (Cron) ops
npx hardhat run scripts/deployCron.ts --network somnia    # deploy + fund (>32 STT) + start()
npx hardhat run scripts/watchCron.ts  --network somnia    # watch ticks / generation rise, no human tx

# Demo helpers
DEMO=1 npx hardhat run scripts/setCronParams.ts --network somnia   # 60s ticks (recording mode)
DEMO=0 npx hardhat run scripts/setCronParams.ts --network somnia   # 1800s ticks (prod, reset after)
N=50   npx hardhat run scripts/bumpTxCount.ts   --network somnia   # bump burner tx_count → force a real evolution next tick

# MCP server (Agent-First)
cd mcp && npm install && npm run build && node dist/index.js

# Frontend
cd web && npm install && npm run dev                    # local dev server
```

A funded Somnia testnet wallet is required to deploy/mint. Get STT from
[testnet.somnia.network](https://testnet.somnia.network/). Never use a real-money wallet.

---

## Tech stack

Solidity 0.8.30 (Hardhat, `viaIR`, `evmVersion: cancun`) · OpenZeppelin v5 ERC-721 + ERC-5192
soulbound · Somnia Agents (JSON API + on-chain LLM) · Somnia Reactivity (Cron self-evolution) ·
Model Context Protocol server · Next.js 16 frontend.

## License

MIT — see [`LICENSE`](./LICENSE).
