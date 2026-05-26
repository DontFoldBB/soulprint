# Soulprint — Demo Video Recording Script

> **Final shooting script for the Encode submission video.** Read top-to-bottom once.
> One continuous take, target **2:30**. You record SILENT video, then generate the
> narration via TTS, then overlay. Each "moment" below has its own narration line; the
> word counts add up to ~150 wpm so audio sync is near-automatic.
>
> Pair: [`docs/demo-runbook.md`](demo-runbook.md) (strategic overview, fallback plans).

---

## 1. Pre-flight (10 minutes, once)

### A. OBS Studio
- Settings → Video: `1920×1080`, `30 FPS`
- Settings → Output → Recording: MP4, H.264, "Indistinguishable"
- Settings → Audio → Mic/Aux: **DISABLED** (TTS later)
- One `Display Capture` source covering your primary screen
- Test-record 5 seconds, stop, scrub to verify

### B. Browser (Chrome, F11 fullscreen, zoom 100%)
Pre-open these tabs **in this exact order**:
1. <https://soulprint-psi.vercel.app> — Mint
2. <https://soulprint-psi.vercel.app/dashboard> — Dashboard
3. <https://shannon-explorer.somnia.network/address/0x0bf4e395ad3746632f86b5254fa18f0db3479d95> — SoulprintCron → click **Internal Txns** filter
4. <https://shannon-explorer.somnia.network/address/0x3F86D1A143271A6c772f1CE57a24bAe2241004cC> — burner / cron owner address

### C. Terminal
One terminal window in `F:\pet_projects\somnia_hackaton\`, font ≥16pt, dark theme.
Pre-type this command (don't run it yet):

```powershell
npx hardhat run scripts/watchCron.ts --network somnia
```

### D. MetaMask
- Connected to **Somnia Shannon testnet** (chainId 50312, RPC `https://api.infra.testnet.somnia.network`)
- Connected to **your everyday wallet** (NOT the burner). At least **2 STT** balance.
- MetaMask is **unlocked** before you press record.

### E. Tell me you're 5 minutes from recording
I'll run these from my side in parallel — gives you fresh autonomy state during the take:

```powershell
DEMO=1 npx hardhat run scripts/setCronParams.ts --network somnia    # 60s ticks
N=30   npx hardhat run scripts/bumpTxCount.ts   --network somnia    # bump burner past Stage 4 threshold
```

### F. After you're done recording
```powershell
DEMO=0 npx hardhat run scripts/setCronParams.ts --network somnia    # back to 30-min prod cadence
```

---

## 2. The shot list (one take, ~2:30)

> Each block: **what's on screen** → **what you do** → **how long to hold** → **the
> narration line that plays over this moment** (TTS reads this; you don't speak).
>
> If you fluff a shot, pause 3 seconds and redo from the last clean moment. Easy cut in editing.

---

### [0:00 – 0:08]   COLD OPEN
**Screen:** Tab 1 — `soulprint-psi.vercel.app` home page, top of viewport.
**Do:** Sit still. Cursor parked. Hold 4 sec. Then slow-scroll down to reveal the "LIVE ACTIVITY" feed, hold 4 sec.
**Narration:**
> *Soulprint. A living AI dossier for your wallet. Built on Somnia, with on-chain AI agents that read a wallet's history and write a witty dossier — minted as a soulbound NFT.*

---

### [0:08 – 0:14]   PASTE & READ
**Screen:** Scrolled back to the mint form at the top.
**Do:** Click the address input. Paste the burner address: `0x3F86D1A143271A6c772f1CE57a24bAe2241004cC`. Hover on the **Read me · 1 STT** button. Don't click yet.
**Narration:**
> *Watch a mint. Paste any wallet — yours, or someone else's — and click Read.*

---

### [0:14 – 0:24]   AGENT PIPELINE FIRES
**Screen:** Mint form.
**Do:** Click **Read me · 1 STT**. MetaMask popup appears → click **Confirm**. Hold while the skeleton renders (~6–8 sec).
**Narration:**
> *A Somnia JSON API agent fetches the wallet's on-chain activity. The on-chain LLM — Qwen-3 30B, running across validators with consensus-verified output — writes the dossier. End to end, about six seconds.*

---

### [0:24 – 0:34]   THE CARD
**Screen:** Full SoulCard rendered.
**Do:** Slow cursor sweep across the card. Hover on the spirit PNG (3 sec). Hover on the 10-dot Stage ladder (3 sec). Hover on the "soulbound" footer (3 sec).
**Narration:**
> *It mints as a soulbound NFT. ERC-5192 — can't be sold, can't be transferred. Every wallet has a Stage from one to ten and one of thirty spirit forms, derived from real on-chain activity and stored on-chain.*

---

### [0:34 – 0:42]   THE FUEL
**Screen:** Same card.
**Do:** Hover on the green "**FUEL · 1 evo**" indicator below the Stage ladder. Let the tooltip read.
**Narration:**
> *Here's the part most "AI on-chain" projects skip — sustainability. Every Soulprint carries its own prepaid evolution fuel. The mint paid for one autonomous evolution. After that, the soul freezes — until someone tops it up.*

---

### [0:42 – 1:00]   BOOST   🟠 *(MetaMask popup)*
**Screen:** Same card.
**Do:** Click **★ Boost · 1 STT** below the card. MetaMask popup → click **Confirm**. Hold ~10 sec while it lands. Button cycles "Boost sent…" → "Boosted ✓". Card fuel indicator jumps from "1 evo" to "3 evos" or higher.
**Narration:**
> *And anyone can keep any soul alive. I top this one up with one STT. The fuel locks into the soul — the contract owner can never withdraw it. Boost a friend. Boost a stranger. Keeping a soul alive becomes a public good.*

---

### [1:00 – 1:10]   DASHBOARD
**Screen:** Switch to Tab 2 — `/dashboard`.
**Do:** Hard-refresh (`Ctrl-F5`). Show System Overview stats. Slow-scroll down to the Leaderboard.
**Narration:**
> *The dashboard shows the whole ecosystem. Soulprints minted, autonomous evolutions counted, leaderboard ranked by on-chain activity.*

---

### [1:10 – 1:35]   AUTONOMY — TERMINAL
**Screen:** Alt-Tab to the terminal.
**Do:** Press **Enter** to run `npx hardhat run scripts/watchCron.ts --network somnia`. Output starts streaming — ticks, generation, subscription id. Hold ~20 sec. **If a live tick lands** mid-shot (since cron is at 60s), let it print prominently.
**Narration:**
> *Now — the autonomy proof. SoulprintCron is a Somnia Reactivity handler. On each scheduled tick, the handler calls evolveBatch and then schedules the next tick — inside the same handler. The chain ticks the contract on time, forever. No keeper bot. No webhook.*

---

### [1:35 – 1:50]   AUTONOMY — EXPLORER
**Screen:** Switch to Tab 3 — cron explorer page, **Internal Txns** filter visible.
**Do:** Slow scroll showing multiple `Ticked` events. Hover on the **From** column of the latest tick — the address starts with `0x000...0100`.
**Narration:**
> *Every tick comes from the Somnia Reactivity precompile — address zero-zero-zero-zero-zero-zero-one-hundred. Not from a human wallet. The previous live cron reached thirty-five ticks. Two real evolutions. Zero human transactions between them.*

---

### [1:50 – 2:00]   THE OWNER'S ADDRESS
**Screen:** Switch to Tab 4 — burner / cron-owner address page.
**Do:** Show the outgoing transactions list. There are NO outgoing tx to the cron address.
**Narration:**
> *And here is the contract owner's address. Look at the outgoing transactions. Zero of them go to the cron. The autonomy is real — verifiable on the explorer.*

---

### [2:00 – 2:15]   COMPOSABILITY
**Screen:** Switch to Tab 2 — dashboard. Click a leaderboard entry — the wallet's modal opens with its SoulCard.
**Do:** Hover on the card — show its spirit form, fuel indicator, address. Hold ~10 sec.
**Narration:**
> *And Soulprint is not just an NFT — it's a primitive other contracts read. profileOf, traitsOf, evolutionOf, evolutionFuel. An MCP server exposes it to any AI agent. A gate contract grants access by activity score. Reputation that can't be bought, transferred, or faked.*

---

### [2:15 – 2:30]   CLOSE
**Screen:** Close the modal. Hard-refresh dashboard. Hold on the full dashboard view (System Overview + Your Soulprint + Leaderboard all visible).
**Do:** Sit still. Cursor parked.
**Narration:**
> *Soulprint. Forty-seven tests green. Live on Somnia. Cost-bounded by design. Soulbound. Self-evolving. Mint once — it evolves forever.*

---

### [2:30]   STOP RECORDING
Hold the final frame for 2 more seconds, then stop OBS.

---

## 3. Locked narration (paste into TTS)

> **The canonical text — copy verbatim into ElevenLabs / Google TTS / Edge TTS / OpenAI TTS.**
> 11 paragraphs, one per shot. Pauses are baked in by punctuation. Target ~150 wpm.

```
Soulprint. A living AI dossier for your wallet. Built on Somnia, with on-chain AI
agents that read a wallet's history and write a witty dossier — minted as a soulbound NFT.

Watch a mint. Paste any wallet — yours, or someone else's — and click Read.

A Somnia JSON API agent fetches the wallet's on-chain activity. The on-chain LLM —
Qwen-3 30B, running across validators with consensus-verified output — writes the
dossier. End to end, about six seconds.

It mints as a soulbound NFT. ERC-5192 — can't be sold, can't be transferred. Every
wallet has a Stage from one to ten and one of thirty spirit forms, derived from real
on-chain activity and stored on-chain.

Here's the part most "AI on-chain" projects skip — sustainability. Every Soulprint
carries its own prepaid evolution fuel. The mint paid for one autonomous evolution.
After that, the soul freezes — until someone tops it up.

And anyone can keep any soul alive. I top this one up with one STT. The fuel locks
into the soul — the contract owner can never withdraw it. Boost a friend. Boost a
stranger. Keeping a soul alive becomes a public good.

The dashboard shows the whole ecosystem. Soulprints minted, autonomous evolutions
counted, leaderboard ranked by on-chain activity.

Now — the autonomy proof. SoulprintCron is a Somnia Reactivity handler. On each
scheduled tick, the handler calls evolveBatch and then schedules the next tick —
inside the same handler. The chain ticks the contract on time, forever. No keeper
bot. No webhook.

Every tick comes from the Somnia Reactivity precompile — address zero-zero-zero-zero-zero-zero-one-hundred.
Not from a human wallet. The previous live cron reached thirty-five ticks. Two real
evolutions. Zero human transactions between them.

And here is the contract owner's address. Look at the outgoing transactions. Zero
of them go to the cron. The autonomy is real — verifiable on the explorer.

And Soulprint is not just an NFT — it's a primitive other contracts read. profileOf,
traitsOf, evolutionOf, evolutionFuel. An MCP server exposes it to any AI agent. A
gate contract grants access by activity score. Reputation that can't be bought,
transferred, or faked.

Soulprint. Forty-seven tests green. Live on Somnia. Cost-bounded by design.
Soulbound. Self-evolving. Mint once — it evolves forever.
```

Word count ≈ 380. At 150 wpm = ~152 seconds. Fits 2:30 with ~10s breathing room.

---

## 4. Generate TTS audio

| Tool | Cost | Voice | Notes |
|---|---|---|---|
| **ElevenLabs** (recommended) | Free tier ~10 min/mo | "Adam" or "Brian" | Stability 70%, Similarity 70%. Export MP3 44.1kHz. |
| **OpenAI TTS** `tts-1-hd` | ~$0.012 for this script | "onyx" or "echo" | Solid quality, near-free cost. |
| **Edge TTS** (free, unlimited) | $0 | `en-US-AndrewNeural` | Use the free `edge-tts` Python package. Slightly more robotic. |
| **Google Cloud TTS** | 4M chars/mo free | `en-US-Neural2-J` (male) | Excellent. Needs a GCP account. |

After export, play it back with a stopwatch. Should be **145–160 seconds**. If too fast → set speed to 0.95×. If too slow → 1.05× or trim the longest pause.

Save as `narration.mp3` next to your video file.

---

## 5. Mix audio + video (CapCut Desktop, free, ~15 minutes)

1. **New project → 1080p 30fps.**
2. Import `recording.mp4` and `narration.mp3`.
3. Video on top track, narration on audio track.
4. **Align starts**: drag narration so first syllable matches the first meaningful frame.
5. **Walk shot-by-shot down section 2**: at each `[X:XX]` cue, verify the right shot is on screen. Trim video clips that ran too long (scissors tool); slow-down (right-click → Speed 0.9×) any that ended too early.
6. **Mute the original video audio**: right-click video → Volume → 0%.
7. **Export**: `1080p 30fps, H.264, High bitrate, AAC audio`. File size 20–60 MB.

Sync hiccups and fixes:
- Narration runs out before video → trim final shot.
- Narration is ahead of visual → slow down the offending shot.
- MetaMask popup took 12 sec instead of 8 → split the clip, delete the dead middle.

---

## 6. Upload & submit

1. **YouTube**: upload as **Unlisted**. Title: `Soulprint — Encode × Somnia Agentathon`. Description: the 60-second pitch from README + GitHub link.
2. **README**: replace the `<link — 2–5 min walkthrough>` placeholder with the YouTube URL. Commit + push.
3. **Encode form**: paste the YouTube link into "Link to Demo Video".

Done. All 7 Required fields closed.

---

## 7. While you record — what I can do in parallel

Tell me when you're 5 minutes from pressing record. I will:
- Speed cron to 60s ticks (`DEMO=1 setCronParams.ts`)
- Bump burner tx_count to guarantee an evolution lands mid-recording (`N=30 bumpTxCount.ts`)
- Watch `watchCron.ts` from my side and tell you "tick incoming in 15 seconds" so you can land shot **[1:10 – 1:35]** on a live tick
- Be ready to manually trigger an evolution (`reread` or `evolveBatch`) just before your "Boost → fuel refill" shot, in case the cron is sluggish

After you finish: I'll reset cron to 30-min cadence (`DEMO=0 setCronParams.ts`).
