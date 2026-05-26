# Soulprint — Demo Video Runbook (strategic overview)

> Target length: **3:00**. Format: screen recording + TTS voice-over.
>
> **For the actual recording**, use the second-by-second shooting script with locked narration
> at [`docs/demo-recording-script.md`](demo-recording-script.md). That doc has the click-by-click
> shot list, locked TTS-ready narration text, MetaMask cues, and the post-record mixing guide.
> THIS doc is the strategic overview — pre-flight checklist, fallback plans, things to NOT say.

---

## Pre-flight (do once, 10 min before recording)

```bash
# 1. Repo: ensure latest master is checked out
git pull origin master

# 2. Verify the live pair is healthy
npx hardhat run scripts/watchCron.ts --network somnia       # ticks > 0, gen > 0
npx hardhat run scripts/inspectSub.ts --network somnia      # subscriptionId != 0

# 3. Speed up the cron so a tick lands inside the recording (60s instead of 1800s)
DEMO=1 npx hardhat run scripts/setCronParams.ts --network somnia

# 4. Make sure the burner's tx_count will jump during the demo (sets up Stage 3 → Stage 4)
#    Skip this if you're recording the "ambient autonomy" version instead.
N=60 npx hardhat run scripts/bumpTxCount.ts --network somnia

# 5. Build + start the frontend in prod mode (the demo runs against this)
cd web && npm run build && npm run start
# leave it running on http://localhost:3000

# 6. Open the explorer tabs you'll cut between (one per browser tab):
#    - https://shannon-explorer.somnia.network/address/0x6876041cc67f9cd1b11e6e1827b13f3622d256e5   (Soulprint)
#    - https://shannon-explorer.somnia.network/address/0x0bf4e395ad3746632f86b5254fa18f0db3479d95   (SoulprintCron)
#    - https://shannon-explorer.somnia.network/address/0x3F86D1A143271A6c772f1CE57a24bAe2241004cC   (burner / cron owner)
#    Filter SoulprintCron by "Internal Txns" — the autonomous ticks show up there, not as normal tx.
#    Filter the burner address: confirm there are NO outgoing tx to the cron between ticks (the autonomy proof).
```

## Post-recording (do once, after you're happy with the take)

```bash
# Reset the cron to the 30-min prod cadence
DEMO=0 npx hardhat run scripts/setCronParams.ts --network somnia
```

---

## The shot list (the actual recording, 3:00 total)

### 0:00 – 0:20 · COLD OPEN — the pitch

**ON SCREEN**: the Soulprint mint page (`/`). Slowly zoom on the headline.

**NARRATION:**
> *"Every wallet has a personality. The transactions, the protocols, the gas spent — that's
> the story. Soulprint reads that story end-to-end on Somnia, with on-chain AI agents — and mints
> it as a living, soulbound NFT that keeps evolving on its own. No off-chain server. No keeper.
> No human in the loop."*

---

### 0:20 – 0:50 · MINT — read → reason → soulbound NFT

**ON SCREEN**: paste the burner address `0x3F86…04cC` (or the user's own wallet) into the input,
hit **Read me · 1 STT**, watch the skeleton, watch the card appear.

**NARRATION:**
> *"This is what a mint looks like. The contract fires a Somnia JSON API agent to read this wallet's
> activity from the chain explorer. It feeds that to Somnia's on-chain LLM — Qwen3-30B, running
> across validators with consensus-verified output. The result is a witty, structured dossier:
> archetype, strength, weakness, karma — minted as a soulbound NFT. ERC-5192. It can't be sold,
> transferred, or faked. End to end: about six seconds."*

> *"And notice the card itself: this isn't just text. The wallet has a Stage and a Form — one of
> thirty distinct spirit forms picked from a 10-stage × 3-archetype-line evolution system. Stored
> on-chain. Indexable by any contract."*

---

### 0:50 – 1:10 · KEEP IT ALIVE — Prepaid Evolution Fuel + Boost

**ON SCREEN**: hover on the new "FUEL · 1 evo" indicator under the Stage ladder (the green dot
turns into a tooltip). Then click **★ Boost · 1 STT** below the card; wallet prompts; tx lands;
the fuel indicator jumps from "1 evo" to "3+ evos".

**NARRATION:**
> *"Every Soulprint carries its own prepaid evolution fuel. The mint paid for the first
> autonomous evolution. After that, when the fuel runs out, the soul freezes at its last form —
> the project doesn't pay forever for any one wallet's identity. But here's the gameplay:
> anyone can keep any soul alive. I just topped up this one with one STT — that's locked into
> the soul, the contract owner can't withdraw it. Boost a friend. Boost a founder. Pool-fund the
> top of the leaderboard. Keeping a soul alive becomes a public good."*

---

### 1:10 – 1:30 · COMPOSE — the agent-first surface

**ON SCREEN**: split-view. Left = a terminal with the MCP server running.
Right = code snippet of `ExampleGate.sol::enter()`.

```bash
# In the terminal, on camera:
node mcp/dist/index.js
# Then in another tool that speaks MCP, call:
# get_soulprint(wallet = "0x3F86D1A143271A6c772f1CE57a24bAe2241004cC")
```

**NARRATION:**
> *"This isn't an end-product NFT — it's a primitive. Any contract or agent can read a wallet's
> Soulprint in one call: `profileOf`, `traitsOf`, or `evolutionOf` for the current Stage and Form.
> Here's an MCP server doing exactly that, so any AI agent on the planet can pull a wallet's
> identity over a standard protocol. And here's an `ExampleGate` contract — access gated by your
> Soulprint's on-chain activity score. Reputation you can't buy, can't transfer, can't fake."*

---

### 1:30 – 2:30 · AUTONOMY — the criterion-#4 proof

**This is the most important shot of the video.** Take your time.

**ON SCREEN — Frame 1 (15s)**: dashboard `/dashboard`. Card shows Stage 3, Form
*"Pathfinder Shade"*. Point at it.

**NARRATION:**
> *"Right now this Soulprint is at Stage 3 — a Pathfinder Shade. We're going to do nothing.
> Watch what happens."*

**ON SCREEN — Frame 2 (15s)**: cut to the Somnia explorer, SoulprintCron page,
filter = **Internal Transactions**. Highlight the most recent autonomous tick — sender =
the precompile `0x0000…0100`. Open the burner address (cron owner) in the next tab and **highlight
that there are no outgoing transactions from it to the cron**.

**NARRATION:**
> *"On the left: the cron's most recent tick. The sender is the Somnia Reactivity precompile —
> address `0x0…0100`. On the right: the contract owner's address. Look at the outgoing transactions.
> There are none. The owner hasn't touched this thing. It's the validator network firing the
> contract on schedule, exactly when it asked to be fired."*

**ON SCREEN — Frame 3 (20s)**: stay on the cron explorer page. Wait for the next tick to land
(since we sped the cron to 60s, this is the live moment of the video). Three events appear on the
page: `Ticked`, `DossierUpdated`, and the next subscription scheduled.

**NARRATION:**
> *"Here's the next tick, live. The cron fires, calls `evolveBatch`, the agent pipeline runs — and
> then the cron reschedules itself, in the same handler, no human transaction. That's the autonomy
> criterion. Not a webhook. Not a keeper bot. Just the chain ticking the contract on time, forever."*

**ON SCREEN — Frame 4 (10s)**: back to the dashboard. Hard refresh. The card visually changed:
new spirit form (Stage 4 → *"Cartographer Spirit"*), generation counter went up, the stage ladder
took a step.

**NARRATION:**
> *"Same wallet. New form. The evolution happened on-chain because the wallet's activity actually
> changed. Soulprint's cost gate caught it, the AI rewrote the dossier, and the visual identity
> evolved — Pathfinder Shade to Cartographer Spirit — without us pressing a single button."*

---

### 2:30 – 3:00 · CLOSE — what this is and isn't

**ON SCREEN**: the README "How we map to the judging criteria" table.

**NARRATION:**
> *"Soulprint is a soulbound, self-evolving identity primitive for Somnia. The AI runs natively
> on-chain — not Gemini or Groq off-chain with a settlement transaction. The dossier is a composable
> read other contracts build on. The autonomy is real cron, real consensus, real ticks. Forty-one
> Hardhat tests green. Two contracts and a Reactivity handler. Mint once. It evolves forever."*

**ON SCREEN — last 3s**: cut to the live address line in the README, with the explorer link
visible. Hold.

---

## Fallbacks (if something breaks on the day)

| If… | Do… |
|---|---|
| The cron didn't tick in the recording window | Show its tick history on the explorer page (`Ticked` events going back hours) and narrate over that. The point — autonomy — is the same. |
| The mint takes >10s | Cut it. The pipeline is ~6s; if Somnia is slow, just show a pre-minted card from earlier in the session. |
| `bumpTxCount.ts` didn't push the wallet to Stage 4 | Use a different wallet that's already across a Stage boundary, or narrate Stage 3 → Stage 3 (generation bump only — still proves the cycle). |
| Reserve runs low mid-recording (you'll see `EvolutionSkipped` events instead of `DossierUpdated`) | `FUND_STT=5 npx hardhat run scripts/fundSoulprint.ts --network somnia`, retake. |

## Things to NOT say

- Don't say *"AI describes your wallet"* — the framing is **identity primitive**, not "AI caption."
- Don't claim cross-chain or mainnet — Somnia testnet only.
- Don't say *"AI judges good vs bad"* — the dossier is a roast, not a credit score.
- Don't say *"private"* — it's all public on-chain.

## Encode submission checklist

- [ ] Demo video uploaded (YouTube unlisted is fine)
- [ ] Video link in `README.md` (replace the TODO placeholder near the top)
- [ ] Public GitHub link in the Encode dashboard
- [ ] "Add Challenge" → Somnia agent track (on the Encode dashboard)
- [ ] "Submit Now" for the final stage
- [ ] Cron reset to 1800s after recording (`DEMO=0 npx hardhat run scripts/setCronParams.ts`)
