# Soulprint — Demo Video Recording Script

> **Audio-first workflow.** Generate the narration MP3 first, then record video while
> listening to it through headphones — your actions naturally sync to the voice. OBS
> captures desktop audio too, so the recording comes out as a finished MP4 with audio
> baked in. **No CapCut mixing required.**
>
> Pair: [`docs/demo-runbook.md`](demo-runbook.md) (strategic context, fallbacks).

---

## Workflow at a glance

```
STEP 1   Generate narration.mp3 from the locked text (TTS, 3 min)
STEP 2   Tell me you're 5 minutes from recording — I pre-stage on-chain (1 min)
STEP 3   Configure OBS (Desktop Audio capture ON, mic OFF)
STEP 4   Headphones on. Press record. Press play on narration.mp3.
         Follow the shot list — each click cued by what the voice is saying.
STEP 5   Stop OBS. Upload the MP4 directly to YouTube. Done.
```

You record ONCE. If you fluff a shot, restart the whole take — it's only 2:30. Three
attempts and you'll have a clean one.

---

## STEP 1 — Generate the narration MP3

Open one of these tools, paste the locked narration text at the bottom of this file,
download MP3.

| Tool | Cost | Voice | Settings |
|---|---|---|---|
| **ElevenLabs** (recommended — best quality) | Free tier ~10 min/mo, no card | "Adam" or "Brian" | Stability 70%, Similarity 70%, Speed default. Output MP3 44.1 kHz. |
| **OpenAI TTS** (`tts-1-hd`) | ~$0.012 for this script | "onyx" or "echo" | Default settings. Cheapest near-pro option. |
| **Edge TTS** (Python `edge-tts`) | $0, unlimited | `en-US-AndrewNeural` | Free, no signup, runs in terminal. |
| **Google Cloud TTS** | 4M chars/mo free | `en-US-Neural2-J` | Needs GCP project. |

After download:
1. Save as `narration.mp3` somewhere convenient (e.g. `F:\pet_projects\somnia_hackaton\outputs\narration.mp3`).
2. **Play it once with headphones**. Time it with a stopwatch — should land **145–160
   seconds**. If shorter, lower the TTS speed to 0.95×. If longer, bump to 1.05×.
3. Get a feel for the cadence — note where the voice says "Watch a mint", "Boost a
   friend", "Now — the autonomy proof", "Soulprint. Forty-seven tests green." Those are
   your visual cues.

---

## STEP 2 — Tell me you're 5 minutes from recording

I'll run this from my side so the cron ticks during your take:

```powershell
DEMO=1 npx hardhat run scripts/setCronParams.ts --network somnia    # 60s ticks
N=30   npx hardhat run scripts/bumpTxCount.ts   --network somnia    # bump burner past Stage 4 threshold
```

I'll also stream `watchCron.ts` from my side and message you "tick in ~15 sec" so you
can land the autonomy shot on a live tick. If the cron is sluggish I can dry-fire
`evolveBatch` to force one.

---

## STEP 3 — OBS setup

### Settings → Video
- Base + Output resolution: `1920×1080`
- FPS: `30`

### Settings → Output → Recording
- Format: `MP4`
- Encoder: `H.264`
- Quality: `Indistinguishable`

### Settings → Audio  ⚠️ THIS IS THE KEY DIFFERENCE
- **Mic/Aux: DISABLED** (you're not speaking)
- **Desktop Audio: ENABLED** (this captures the narration MP3 playing on your computer → it ends up in the MP4)

### Sources
- One `Display Capture` source covering your primary screen
- Verify the Audio Mixer panel shows `Desktop Audio` with a visible level meter; mic strip should be silent/grayed

### Pre-record test (30 seconds)
1. Start recording.
2. Open VLC / browser, play `narration.mp3` for 5 seconds.
3. Stop recording.
4. Open the resulting MP4 — narration should be audible. If not: re-check Desktop Audio in OBS Audio settings, restart OBS.

---

## STEP 4 — Pre-flight checklist before pressing record

### Browser (Chrome, F11 fullscreen, zoom 100%)
Tabs in this exact order:
1. <https://soulprint-psi.vercel.app> — Mint
2. <https://soulprint-psi.vercel.app/dashboard> — Dashboard
3. <https://shannon-explorer.somnia.network/address/0x0bf4e395ad3746632f86b5254fa18f0db3479d95> — SoulprintCron → click **Internal Txns** filter
4. <https://shannon-explorer.somnia.network/address/0x3F86D1A143271A6c772f1CE57a24bAe2241004cC> — burner / cron-owner

### Terminal
Open one terminal in `F:\pet_projects\somnia_hackaton\`, font ≥16pt, dark theme.
**Pre-type** this command, don't run yet:

```powershell
npx hardhat run scripts/watchCron.ts --network somnia
```

### MetaMask
- Connected to **Somnia Shannon testnet**
- Your everyday wallet (NOT the burner), ≥ **2 STT**
- **Unlocked**

### Audio playback
- Open `narration.mp3` in VLC / browser / Windows Media Player — **paused at 0:00**
- **Headphones plugged in** so audio doesn't leak from speakers (if you use speakers,
  no problem — Desktop Audio captures the same stream either way)

---

## STEP 5 — The recording session

> **Start sequence:** Tab 1 (Mint) is the front window. Press **OBS Record**.
> Wait 1 sec. Press **Play** on the narration MP3. Follow the shot list below.

Each block: **what the voice is saying** (your cue) → **what you do at that moment**.
Times are approximate — let the audio drive pacing, not the clock.

---

### [voice says: "Soulprint. A living AI dossier..."]   COLD OPEN — ~12 sec
**Tab 1, mint page top of viewport.** Sit still 4 sec. Then slow-scroll DOWN to reveal
LIVE ACTIVITY feed, hold 4 sec, slow-scroll back UP to the mint form.

---

### [voice says: "Watch a mint. Paste any wallet..."]   PASTE — ~6 sec
**Tab 1, mint form.** Click the address input. Paste burner:
`0x3F86D1A143271A6c772f1CE57a24bAe2241004cC`. Hover on **Read me · 1 STT**. Don't click yet.

---

### [voice says: "A Somnia JSON API agent fetches..."]   READ + WAIT — ~13 sec
Click **Read me · 1 STT**. 🟠 MetaMask popup → click **Confirm**. Hold steady while
the card skeleton renders and the real card appears (~6 sec).

---

### [voice says: "It mints as a soulbound NFT. ERC-5192..."]   THE CARD — ~16 sec
SoulCard is on screen. Slow cursor sweep across it.
- Hover on the spirit PNG (~4 sec)
- Hover on the 10-dot Stage ladder (~4 sec)
- Hover on the "soulbound" footer (~4 sec)

---

### [voice says: "Here's the part most AI on-chain projects skip..."]   FUEL — ~14 sec
Hover on the green **FUEL · 1 evo** indicator below the Stage ladder. Let the tooltip
read. Keep hovering steady.

---

### [voice says: "And anyone can keep any soul alive. I top this one up..."]   BOOST 🟠 — ~17 sec
Click **★ Boost · 1 STT** below the card. 🟠 MetaMask popup → click **Confirm**. Hold
while it lands (~10 sec). Button cycles "Boost sent…" → "Boosted ✓". Card refreshes,
fuel indicator jumps from "1 evo" to "3 evos" or higher. Hover on the new fuel value.

---

### [voice says: "The dashboard shows the whole ecosystem..."]   DASHBOARD — ~6 sec
**Switch to Tab 2.** Hard-refresh (`Ctrl-F5`). Show System Overview stats; slow-scroll
down to the Leaderboard.

---

### [voice says: "Now — the autonomy proof. SoulprintCron is a Somnia Reactivity handler..."]   AUTONOMY — TERMINAL — ~17 sec
**Alt-Tab to the terminal.** Press **Enter** to run `watchCron.ts`. Output streams
ticks, generation, subscription id. Hold steady. If a live tick lands mid-shot (cron at
60s), let it print prominently — that's gold for the camera.

---

### [voice says: "Every tick comes from the Somnia Reactivity precompile..."]   AUTONOMY — EXPLORER — ~12 sec
**Switch to Tab 3** (cron explorer, Internal Txns filter). Slow scroll showing multiple
`Ticked` events. Hover on the **From** column of the latest tick — `0x000...0100`.

---

### [voice says: "And here is the contract owner's address..."]   THE OWNER — ~11 sec
**Switch to Tab 4** (burner / cron-owner address page). Show the outgoing transactions
list. There are NO outgoing tx to the cron — point at the empty / unrelated list.

---

### [voice says: "And Soulprint is not just an NFT — it's a primitive..."]   COMPOSABILITY — ~17 sec
**Switch to Tab 2** (dashboard). Click a leaderboard entry — the wallet's modal opens
with its SoulCard. Hover on the card. Hold ~10 sec showing spirit form, fuel indicator,
address.

---

### [voice says: "Soulprint. Forty-seven tests green. Live on Somnia..."]   CLOSE — ~7 sec
Close the modal. Hold on the full dashboard view. Sit still. Cursor parked.

---

### [audio ends — 2 sec silence]   STOP
Hold final frame for 2 more seconds, then stop OBS recording AND stop narration playback.

---

## STEP 6 — Inspect the file

The OBS output (`F:\Users\…\Videos\<timestamp>.mp4`) already has narration baked in via
Desktop Audio capture. Play it back end to end. Things to check:
- Audio plays through the whole video, in sync with what you see
- No mic crackle / room sound (mic was off, but worth confirming)
- File size ~50–200 MB for 2:30 at 1080p30
- Length: 2:30 ± 0:10

If audio is missing → Desktop Audio source wasn't active in OBS. Re-do.
If audio is out of sync by >2 sec → re-record (audio drift means you hit play on
narration too early/late). Easier than fixing in post.

If sync is off by <1 sec, ignore — judges won't notice.

---

## STEP 7 — Upload & submit

1. **YouTube**: upload as **Unlisted**.
   - Title: `Soulprint — Encode × Somnia Agentathon`
   - Description: paste the 60-second pitch from README + the GitHub link
2. **README**: replace `_<link — 2–5 min walkthrough>_` (line 14) with the YouTube URL.
   Commit + push.
3. **Encode form**: paste the YouTube link into "Link to Demo Video".

All 7 Required fields now closed.

---

## Locked narration — paste this into TTS

> Copy verbatim — punctuation drives TTS pacing. 376 words → ~152 seconds at 150 wpm.

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

---

## Fallback — if the audio-first workflow breaks down

If you hate listening through headphones, or OBS Desktop Audio refuses to work:

1. Record SILENT video following the same shot list (rough hold times in the cues).
2. Drop video + `narration.mp3` into **CapCut Desktop** (free).
3. Align the narration's first syllable with the first meaningful video frame.
4. Walk through the cues — if any shot ended too early, slow it down (right-click clip
   → Speed → 0.9×); if too long, trim with scissors.
5. Mute the original video track. Export 1080p H.264 AAC.

Worst case it's a 20-minute editing job vs. zero-minute upload. Not the end of the
world.
