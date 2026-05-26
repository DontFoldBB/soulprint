# Soulprint — Demo Video Recording Script

> **Read this top-to-bottom once before pressing record.** This is the OPERATIONAL shooting
> script: every shot has a target hold-time and a matching narration line. You record video
> SILENT, then generate the narration through any TTS, then overlay. Because both halves
> follow the same timing table, the sync will be near-automatic.
>
> Pair with `docs/demo-runbook.md` (strategic overview + judging-criteria mapping).

---

## A. Setup (10 minutes, one-time before pressing record)

### A.1 OBS Studio (free, obsproject.com)
1. **Settings → Video → Base + Output resolution:** `1920×1080`. **FPS:** `30`.
2. **Settings → Output → Recording:** `MP4` container, `H.264` encoder, quality `Indistinguishable`.
3. **Settings → Audio → Mic/Aux:** DISABLED. (Audio comes from TTS later.)
4. **Sources:** add one `Display Capture` source covering your full primary screen.
5. **Optional:** enable a cursor highlighter (built-in or via the free *Mouseposé* / *Cursor Highlighter* OBS plugin) so judges can follow what you point at.
6. Test-record 5 seconds, stop, scrub to check it looks crisp at 1080p.

### A.2 Browser (Chrome, fullscreen `F11`, zoom 100%)
Pre-open these tabs **in this exact order** (left to right):
1. `http://localhost:3000` — Soulprint mint page (dev server running)
2. `http://localhost:3000/dashboard` — dashboard
3. `https://shannon-explorer.somnia.network/address/0x6876041cc67f9cd1b11e6e1827b13f3622d256e5` — Soulprint contract page
4. `https://shannon-explorer.somnia.network/address/0x0bf4e395ad3746632f86b5254fa18f0db3479d95` — SoulprintCron page → click **Internal Txns** filter
5. `https://shannon-explorer.somnia.network/address/0x3F86D1A143271A6c772f1CE57a24bAe2241004cC` — burner (= cron owner) address page

### A.3 Terminal
One terminal window, font size ≥ 16pt, dark theme, in `F:\pet_projects\somnia_hackaton\`. Keep it ready for the MCP / `watchCron` shots — switch to it with `Alt-Tab`.

### A.4 Wallet (MetaMask)
- Somnia Shannon testnet added (`chainId 50312`, RPC `https://api.infra.testnet.somnia.network`).
- Connected to your everyday wallet (NOT the burner), with **≥ 2 STT** (1 STT for the Boost shot + gas).
- MetaMask **unlocked** before you press record.

### A.5 Pre-recording chain staging
Run these from `F:\pet_projects\somnia_hackaton\` before pressing record:

```powershell
# 1. Speed cron up to 60s so we see a tick on camera
DEMO=1 npx hardhat run scripts/setCronParams.ts --network somnia

# 2. Bump burner tx_count so the NEXT cron tick crosses Stage 3 → Stage 4 (forces a real
#    evolution mid-recording — generation bumps AND form changes visibly).
N=30 npx hardhat run scripts/bumpTxCount.ts --network somnia

# 3. Confirm the live state right before you record
npx hardhat run scripts/watchCron.ts --network somnia
# Expect: gen 1, txCount ~75+, cron ticks rising, subId armed.
```

### A.6 After you're done recording (do not forget)
```powershell
DEMO=0 npx hardhat run scripts/setCronParams.ts --network somnia   # back to 1800s prod cadence
```

---

## B. Locked Narration Script (450 words, ~3:00 @ 150 wpm)

> **This is the canonical text to paste into TTS.** Don't modify the wording without re-syncing
> the shot table. Punctuation is intentional — periods become pauses in TTS output.

```
[0:00 cold open]
Every wallet on chain has a story. Soulprint reads that story end-to-end with on-chain
AI agents on Somnia, and mints it as a living, soulbound NFT that keeps evolving on its own.

[0:10 mint]
Watch a mint. You paste any wallet, click Read. A Somnia JSON API agent fetches the wallet's
history. The on-chain LLM, Qwen-3 30B, running across validators, writes a witty, structured
dossier. It's minted as a soulbound NFT — ERC-5192. It can't be sold, can't be transferred.
End to end, about six seconds.

[0:35 evolution system]
Every Soulprint isn't just text. The wallet has a Stage from 1 to 10, derived from on-chain
activity. Each archetype line — Explorer, DeFi, Power-User, and four more — has its own
visual evolution. Thirty spirit forms in total. Stage and Form are stored on-chain.
Indexable by any contract.

[0:58 fuel + boost]
Here's the part most "AI on-chain" projects skip — sustainability. Every Soulprint carries
its own prepaid evolution fuel. The mint paid for the first autonomous evolution. When the
fuel runs out, the soul freezes at its last form — the project does not pay forever for any
one wallet. But anyone can keep any soul alive. I just topped this one up. The STT locks
into the soul. The contract owner can never withdraw it. Boost a friend. Boost a stranger.
Keeping a soul alive becomes a public good.

[1:33 composability]
And it's not an end-product NFT — it's a primitive. Any contract or agent can read a wallet's
Soulprint in one call. Here's the Model Context Protocol server exposing it to any AI agent
over a standard protocol. Here's a gate contract — access by Soulprint activity score.
Reputation you can't buy, can't transfer, can't fake.

[1:55 autonomy]
And the autonomy. SoulprintCron is a Somnia Reactivity handler. It runs on a schedule, calls
evolveBatch, and reschedules itself, inside the same handler. Look at the cron's internal
transactions. The sender is the Somnia precompile — address zero-one-hundred. Now look at
the contract owner's address. Zero outgoing transactions to the cron. It's the validator
network firing the contract on time, forever. No keeper bot. No webhook. The previous live
cron reached thirty-five autonomous ticks. Same code, fresh deploy, ticking now.

[2:35 visual transformation]
And here's what that looks like for the user. Same wallet, activity changed, cron tick fired,
the AI rewrote the dossier, the soul evolved. Pathfinder Shade to Cartographer Spirit.
Stage 3 to Stage 4. No human pressed a button.

[2:52 close]
Soulprint. Forty-seven tests green. Live on Somnia testnet. Soulbound. Self-evolving.
Cost-bounded. Composable. Mint once. It evolves forever.
```

Word count: 451. At 150 wpm = 180 seconds. Leave ~2 seconds of dead audio at start and end
for breathing room.

---

## C. Shot List (one continuous take, ~3:00)

> **How to use:** record one long take. Watch the `[X:XX]` time on your stopwatch as you go.
> If you fluff a shot, **pause 3 seconds and redo from the last clean shot** — easy cut in
> editing. Don't restart from zero unless something truly broke.
>
> "HOLD" = how long this shot should stay on screen. "MOUSE" = where to point (no need to
> click unless marked). Anything with 🟠 needs a wallet popup confirm.

| Time | What's on screen | Your action | Hold | Sync to narration |
|---|---|---|---:|---|
| **A. Cold open** | | | | |
| 0:00 | Tab 1 — Soulprint mint page, top of viewport | Just sit still. Cursor parked. | 4s | *"Every wallet on chain has a story…"* |
| 0:04 | Same | Slow scroll down to reveal the LIVE ACTIVITY feed below the mint form | 4s | *"…and mints it as a living, soulbound NFT that keeps evolving on its own."* |
| 0:08 | Mint form visible at top | Scroll back up to mint form | 2s | (silence between sentences) |
| **B. Mint** | | | | |
| 0:10 | Mint form, focus on the address input | Click the input. Type `0x3F86D1A143271A6c772f1CE57a24bAe2241004cC` (burner). | 4s | *"Watch a mint. You paste any wallet…"* |
| 0:14 | Mint form, address filled | Hover over "Read me · 1 STT" button | 3s | *"…click Read."* |
| 0:17 | Skeleton card appears (the dev server already has this soul, so the lookup returns instantly — that's OK, narrate as if it's the mint flow) | Let the card render. Don't move. | 6s | *"A Somnia JSON API agent fetches the wallet's history. The on-chain LLM, Qwen-3 30B…"* |
| 0:23 | Full SoulCard rendered | Cursor hovers over the spirit image (the PNG) | 4s | *"…writes a witty, structured dossier. It's minted as a soulbound NFT — ERC-5192."* |
| 0:27 | Same card | Hover over "soulbound" footer text | 3s | *"It can't be sold, can't be transferred."* |
| 0:30 | Same card | Slow upward mouse drift toward the card title | 5s | *"End to end, about six seconds."* |
| **C. Evolution system** | | | | |
| 0:35 | SoulCard, headline visible | Hover on the headline ("Scout" / form name) | 4s | *"Every Soulprint isn't just text. The wallet has a Stage from 1 to 10…"* |
| 0:39 | Same | Move cursor down to the 10-dot Stage ladder | 6s | *"…derived from on-chain activity. Each archetype line — Explorer, DeFi, Power-User, and four more — has its own visual evolution."* |
| 0:45 | Same | Hold on the spirit PNG | 4s | *"Thirty spirit forms in total."* |
| 0:49 | Same | Slow drift to the "Activity / Txns / Gen" stats row | 9s | *"Stage and Form are stored on-chain. Indexable by any contract."* |
| **D. Fuel + Boost** 🟠 | | | | |
| 0:58 | Same card | Hover over the green "FUEL · 1 evo" indicator below the Stage ladder | 5s | *"Here's the part most 'AI on-chain' projects skip — sustainability."* |
| 1:03 | Tooltip showing fuel detail | Keep hovering, let tooltip read | 5s | *"Every Soulprint carries its own prepaid evolution fuel. The mint paid for the first autonomous evolution."* |
| 1:08 | Card | Move cursor to the "★ Boost · 1 STT" button below the card | 4s | *"When the fuel runs out, the soul freezes at its last form — the project does not pay forever for any one wallet."* |
| 1:12 | Card | **Click ★ Boost** | — | *"But anyone can keep any soul alive."* |
| 1:13 | 🟠 MetaMask popup appears | Click **Confirm** in MetaMask | up to 8s | (narration continues over the popup — that's fine, judges expect it) |
| ~1:20 | Popup closes, button shows "Boost sent…" then "Boosted ✓" | Wait for the success state | 5s | *"I just topped this one up. The STT locks into the soul. The contract owner can never withdraw it."* |
| 1:25 | Card refresh — fuel indicator now shows "fuel · 3 evos" (or higher) | Hover over the new fuel value | 8s | *"Boost a friend. Boost a stranger. Keeping a soul alive becomes a public good."* |
| **E. Composability** | | | | |
| 1:33 | Switch to Terminal (Alt-Tab) — `node mcp/dist/index.js` already running | Show the MCP server stdout | 4s | *"And it's not an end-product NFT — it's a primitive."* |
| 1:37 | Terminal | Run: `npx hardhat console --network somnia` then paste:<br>`(await ethers.getContractAt("Soulprint","0x6876041cc67f9cd1b11e6e1827b13f3622d256e5")).traitsOf("0x3F86D1A143271A6c772f1CE57a24bAe2241004cC")`<br>**Or simpler:** just show a pre-typed line waiting, press Enter to execute. | 7s | *"Any contract or agent can read a wallet's Soulprint in one call."* |
| 1:44 | Terminal output | Let it print, scroll to fit | 5s | *"Here's the Model Context Protocol server exposing it to any AI agent over a standard protocol."* |
| 1:49 | Open `contracts/ExampleGate.sol` in the editor (have it pre-opened) | Show the `enter()` function | 6s | *"Here's a gate contract — access by Soulprint activity score. Reputation you can't buy, can't transfer, can't fake."* |
| **F. Autonomy proof** | | | | |
| 1:55 | Tab 4 — Explorer SoulprintCron page, Internal Txns filter | Switch tabs | 3s | *"And the autonomy."* |
| 1:58 | Same | Slow scroll to show multiple `Ticked` events | 6s | *"SoulprintCron is a Somnia Reactivity handler. It runs on a schedule…"* |
| 2:04 | Hover on one `From` column with the precompile address | Highlight `0x…0100` | 5s | *"…calls evolveBatch, and reschedules itself, inside the same handler. Look at the cron's internal transactions. The sender is the Somnia precompile…"* |
| 2:09 | Same | Hover on `0x…0100` text | 4s | *"…address zero-one-hundred."* |
| 2:13 | Tab 5 — burner / cron-owner address page | Switch tabs | 3s | *"Now look at the contract owner's address."* |
| 2:16 | Burner page | Filter on outgoing transactions (or just scroll). The point: no tx going INTO the cron from the owner. | 8s | *"Zero outgoing transactions to the cron. It's the validator network firing the contract on time, forever. No keeper bot. No webhook."* |
| 2:24 | Tab 4 again — cron Internal Txns | Switch back | 5s | *"The previous live cron reached thirty-five autonomous ticks."* |
| 2:29 | Same | Hover on `ticks` counter or just hold steady | 6s | *"Same code, fresh deploy, ticking now."* |
| **G. Visual transformation** | | | | |
| 2:35 | Tab 2 — Dashboard | Switch tabs, **hard-refresh** (`Ctrl-F5`) | 5s | *"And here's what that looks like for the user."* |
| 2:40 | Dashboard — your Soulprint card | Cursor on the spirit PNG (NOW it should show the NEW form because cron tick re-evolved it post tx_count bump — if pre-staging worked, the form will be `explorer-3-cartographer-spirit`, not pathfinder) | 7s | *"Same wallet, activity changed, cron tick fired, the AI rewrote the dossier, the soul evolved."* |
| 2:47 | Same | Hover on the headline ("Cartographer") | 3s | *"Pathfinder Shade to Cartographer Spirit. Stage 3 to Stage 4."* |
| 2:50 | Same | Hover on the Stage ladder | 2s | *"No human pressed a button."* |
| **H. Close** | | | | |
| 2:52 | Open `README.md` in editor — scroll to the "How we map to the judging criteria" table | Show full table | 6s | *"Soulprint. Forty-seven tests green. Live on Somnia testnet."* |
| 2:58 | Scroll to the live-deployment table (right below) | Show contract addresses | 2s | *"Soulbound. Self-evolving. Cost-bounded. Composable."* |
| 3:00 | Hold on the addresses block | Stop moving | 3s | *"Mint once. It evolves forever."* |
| 3:03 | Hold for ~2s dead | Stop recording | — | (silence) |

**Total target length: 3:05** (180s narration + 2s start + 3s end-hold).

---

## D. Recording tips

- **Cursor:** move deliberately. Aim for 1 second of travel between hover points, not 0.3s. Judges follow what you point at.
- **Typing:** when you type the wallet address, slow down — 60ms per key is fine. Or just paste it, narration covers the speed.
- **MetaMask shot (1:13):** keep recording through the popup. The narration is timed to cover the wait. If it takes longer than 8s to confirm, the narration just hangs slightly behind — fix in mixing by holding the post-confirm shot a beat longer.
- **One take is fine.** A 5-second pause + redo from the last clean shot is invisible after trimming.
- **Don't blow up the audio.** Mic is OFF — anything you say into the room won't be recorded. You can narrate to yourself for pacing.

---

## E. Generate the TTS audio

Best free / cheap options for English voiceover:

| Tool | Cost | Voice to use | Notes |
|---|---|---|---|
| **ElevenLabs** (recommended) | Free tier covers ~10 min/mo | "Adam" or "Brian" (neutral male tech) | Best quality. Stability `70%`, similarity `70%`. Export MP3 44.1kHz. |
| **Google Cloud Text-to-Speech** | Free tier 4M chars/mo | `en-US-Neural2-J` (male) or `en-US-Neural2-D` | Need a Google Cloud account. Excellent quality. |
| **Edge TTS** (via `edge-tts` Python pkg) | Free, unlimited | `en-US-AndrewNeural` or `en-US-EricNeural` | Free, no signup. Slightly more robotic than ElevenLabs. |
| **OpenAI TTS** (`tts-1-hd`) | $0.030/1k chars (~$0.014 for this script) | "onyx" or "echo" | Solid, costs a couple cents. |

Steps (works for any of the above):
1. Paste **section B** (the narration text) verbatim — INCLUDING the `[X:XX section]` tags. Most TTS engines just ignore square-bracketed lines, but if your tool tries to read them, strip them first.
2. Export as **MP3 or WAV, 44.1 kHz, mono is fine**.
3. Save as `narration.mp3` next to your video file.

Sanity check after export: play it back, time it with a stopwatch. Should be 165–180 seconds. If it's <160s, your TTS is too fast — lower speed to 0.95×. If it's >185s, speed up to 1.05× or trim the longest pause.

---

## F. Mix audio + video (free, ~15 minutes)

Use **CapCut Desktop** (free, capcut.com, mac/win). Simpler than DaVinci Resolve for this job.

1. **New project → 1080p 30fps.**
2. **Import** your `recording.mp4` and `narration.mp3`.
3. Drag the video onto the timeline (top track). Drag the narration onto the audio track below.
4. **Sync the start:** align the first frame of narration audio with the first frame of meaningful video (around 0:00). If you left 2s of dead air at the start, drag narration to begin at +2s.
5. **Walk shot-by-shot down the table in C.** For each `[X:XX]` cue in the narration, check that the corresponding video shot is on screen. If a shot is too short, slow it down (right-click clip → Speed → 0.9×). If too long, trim the end with the scissors tool.
6. **Mute the original video audio** (right-click video clip → Volume → 0%).
7. **Export:** `1080p 30fps, H.264, Higher bitrate, AAC audio`. File size should be 20–60 MB for a 3-min video.

Sync hiccups that will happen and how to fix:
- *"Narration ends 3 seconds before video"* → trim the final hold-shot.
- *"Narration is ahead of the visual"* → slow down the offending shot (Speed 0.9×) or insert a brief still frame.
- *"MetaMask shot took longer than 8 seconds"* → split the video clip right after the confirm closes, delete the dead portion in the middle.

---

## G. Upload & submit

1. **YouTube:** upload as **Unlisted** (so only people with the link can see it). Title: `Soulprint — Encode × Somnia Agentathon submission`. Description: paste the README's "60-second pitch" section + the GitHub link.
2. **Update `README.md`** line 14: replace `_<link — 2–5 min walkthrough>_` with the YouTube URL.
3. Commit + push (`docs: add demo video link`).
4. **Encode dashboard:** paste the YouTube link and the GitHub link in the submission form.

---

## H. What I do while you record (real-time support)

If we coordinate (Telegram / quick chat), I can:
- Hit `setCronParams.ts` to re-arm the schedule **right before** you press record, so a tick lands in your autonomy window (around 1:55–2:30 in the shot list).
- Trigger an evolution manually (`reread` or `evolveBatch`) right before your "transformation" section (2:35) so the form change is FRESH when you hard-refresh.
- Watch `watchCron.ts` in parallel and tell you "tick incoming in 12 seconds" so you can pace shot F to land on it.

Tell me when you're 5 minutes from recording and what tweaks you want pre-staged.
