# Encode Submission — Text Fields (copy-paste)

> All four free-text blocks the Encode Checkpoint 2 form asks for. Pick the length you need —
> short versions fit in narrow textboxes; long versions if the form allows.

---

## 1. Challenge Explanation
*"Describe how you are incorporating the selected challenge(s)."*

### Short (≈80 words)
Soulprint is a submission to the Somnia agent track. The contract orchestrates two of Somnia's
on-chain base agents — **JSON API Request** (reads a wallet's tx_count from the chain explorer)
and **LLM Inference / Qwen-3 30B** (writes a witty structured dossier) — into one chained
read→reason pipeline, mints the result as a soulbound ERC-5192 NFT, and uses a
**Somnia Reactivity SomniaEventHandler** (`SoulprintCron`) to autonomously re-evaluate every
profile over time with no off-chain keeper.

### Long (≈220 words)
Soulprint targets the Somnia **agent track**. The single product is a chained on-chain agent
pipeline: when anyone calls `read(wallet)` on the Soulprint contract, the contract fires the
Somnia **JSON API Request** agent to fetch the wallet's real activity (`transactions_count`)
from the chain explorer. The callback applies a cost-gate (skip the expensive step if nothing
changed) and then fires the Somnia on-chain **LLM Inference** agent (Qwen-3 30B, fixed seed,
consensus-verified across validators) to write a structured "dossier" — invented archetype,
strength, weakness, style, karma, rarity. The result mints as a soulbound NFT (ERC-5192,
non-transferable).

For criterion #4 (Autonomous Performance) the system includes `SoulprintCron`, a
**Somnia Reactivity** `SomniaEventHandler` that uses
`SomniaExtensions.scheduleSubscriptionAtTimestamp` to keep ticking the pipeline forever —
each tick calls `evolveBatch()` and reschedules itself inside the same handler, so the
schedule continues with zero human transactions. We verified the mechanism live: the previous
deploy reached 35 autonomous ticks → 2 real evolutions on the only minted wallet, with all
other ticks correctly cost-gated. Every agent callback is gated
(`msg.sender == platform`, request-pending check) and every response status (Success / Failed /
TimedOut) is handled.

---

## 2. Submission Details
*"Provide a detailed explanation of your submission. Describe what you've done, the process, and any relevant context."*

### What Soulprint is
A soulbound, self-evolving on-chain identity primitive for Somnia. We point Soulprint at any
wallet, the on-chain agent pipeline reads its real activity and writes a witty, structured
dossier, and it mints as an ERC-5192 soulbound NFT bound to that wallet. A Somnia Reactivity
Cron then keeps re-evaluating every minted wallet over time — autonomously, with no off-chain
keeper. Other contracts and agents can read any wallet's Soulprint in one call
(`profileOf` / `traitsOf` / `evolutionOf` / `evolutionFuel`) — it is positioned as a
**composable reputation primitive**, not an end-product collectible.

### What was built
- **`Soulprint.sol`** (the core, deployed): the chained agent pipeline, soulbound mint
  (ERC-5192), fully on-chain dynamic `tokenURI`, cost-gated re-evolution, refund-on-mint
  hardening, and on-chain views (`profileOf`, `traitsOf`, `evolutionOf`, `evolutionFuel`,
  `stageOf`, `formIdOf`, `formSlugOf`, `activityScore`, `availableForWithdraw`).
- **Soul Evolution System**: 10 stages × 3 archetype lines → 30 distinct spirit forms. Stage
  derived on-chain from `tx_count`; Form is a lookup over (archetype × stage). Both stored
  on-chain and surfaced as `tokenURI` traits so marketplaces and agents can index without
  parsing the dossier text.
- **Prepaid Evolution Fuel**: every Soulprint carries its own STT-denominated evolution
  budget (`evoBalance`). The mint earmarks `INITIAL_FUEL_GRANT` (0.4 STT, ~1 evolution).
  Each successful re-evolution deducts `EVOLUTION_COST`. When fuel runs out the soul freezes
  (`EvolutionPaused`). **Anyone** can call `topUpEvolution(tokenId)` to revive any soul —
  keeping a soul alive becomes a public good. The owner's `withdraw` is gated by
  `availableForWithdraw` (= `balance - totalReserved`) so prepaid fuel is sacred and can
  never be withdrawn by the project.
- **`SoulprintCron.sol`**: the autonomy engine. A Somnia Reactivity `SomniaEventHandler` that
  uses `scheduleSubscriptionAtTimestamp` to tick `evolveBatch` and self-reschedule.
- **`ExampleGate.sol`**: a third-party composability demo — an NFT-as-access contract whose
  `enter()` succeeds only if the caller's Soulprint `activityScore` clears a threshold.
- **MCP server** (`mcp/`): a Model Context Protocol server exposing `get_soulprint(wallet)`
  so any AI agent can read a wallet's live profile over a standard protocol.
- **Next.js frontend** (`web/`, deployed to Vercel): mint flow, evolution-aware SoulCard with
  fuel gauge, Boost button (calls `topUpEvolution`), dashboard with leaderboard and
  per-wallet modals.
- **47 Hardhat tests** green covering the full pipeline, the evolution system, the fuel
  system, autonomy handler, ExampleGate, and audit hardening.

### Process / context
We built this iteratively. We started by getting the read→reason→soulbound pipeline working
live in a day. Then we added agent-callable views (`profileOf`, `traitsOf`) and the MCP server
to satisfy criterion #2. Then we built the cost-gated evolution → `SoulprintCron` autonomy
loop to prove criterion #4 live (the prior cron reached 35 autonomous ticks). Then we shipped
the Soul Evolution System (30 spirit forms, on-chain `stageOf`/`formIdOf`/`formSlugOf`) to
make the evolution genuinely visual and not just a generation counter. Finally we closed the
economics gap with Prepaid Evolution Fuel — bounding the project's forever-cost per minted
wallet, and turning longevity into a public good.

The system uses **native on-chain inference** (Qwen-3 30B running across Somnia validators,
fixed seed, output verified by consensus) — not an off-chain LLM with on-chain settlement.

### Live state at time of writing
- Soulprint: [`0x6876041cc67f9cd1b11e6e1827b13f3622d256e5`](https://shannon-explorer.somnia.network/address/0x6876041cc67f9cd1b11e6e1827b13f3622d256e5)
  (12 STT seeded; smoke-tested live; `evolutionFuel(1) = (0.4 STT, 0.4 STT, 1 evolution)`).
- SoulprintCron: [`0x0bf4e395ad3746632f86b5254fa18f0db3479d95`](https://shannon-explorer.somnia.network/address/0x0bf4e395ad3746632f86b5254fa18f0db3479d95)
  (40 STT, `subscriptionId` 2267508 armed, 30-min interval).
- Frontend: <https://soulprint-psi.vercel.app>
- Code: <https://github.com/DontFoldBB/soulprint>

---

## 3. Link to Code
```
https://github.com/DontFoldBB/soulprint
```

## 4. Link to Presentation
```
https://soulprint-psi.vercel.app/soulprint-deck.pdf
```
(Hosted on the same Vercel project as the live frontend — opens inline in any browser.
GitHub raw fallback: `https://github.com/DontFoldBB/soulprint/raw/master/docs/submission/soulprint-deck.pdf`.)

## 5. Link to Demo Video
> YouTube unlisted link goes here AFTER you record per `docs/demo-recording-script.md`.

## 6. Live Demo Link
```
https://soulprint-psi.vercel.app
```

---

## 7. Submission Files — what to upload

The form accepts up to 25MB. Upload these from `docs/submission/`:

| File | What it is |
|---|---|
| `soulprint-deck.pdf` | The 12-slide presentation. PDF export of the PPTX. |
| `architecture.svg` | Standalone architecture diagram (open in any browser to view). |
| `submission-text.md` | (Optional) This file — gives reviewers the long-form text in one place. |

Both PDF and SVG are well under 25 MB. PPTX `soulprint-deck.pptx` is also in this folder if a
reviewer wants the editable source.
