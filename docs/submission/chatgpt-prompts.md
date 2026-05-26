# Prompts for ChatGPT — visual redesign of submission assets

> The pptxgenjs-generated deck and the box-and-arrow architecture PNG look templated
> (rounded-rect panels everywhere, generic concentric-circle hero, no real illustration).
> These three prompts ask ChatGPT to redo the same artifacts with real design taste.
>
> **Use ChatGPT-5 Thinking or GPT-4o with Python tools enabled** so it can generate the
> actual PPTX file and the PNG. Attach the spirit-form sample images when prompted
> (they're in `web/public/souls/` — pick 4-6 of them).

---

## PROMPT 1 — redesign the full pitch deck (PPTX)

Paste this into a fresh ChatGPT chat. Attach 4-6 of our spirit-form PNGs as references
(suggested: `explorer-2-pathfinder-shade.png`, `explorer-3-cartographer-spirit.png`,
`defi-3-flux-specter.png`, `power-4-aetherlord.png`, `sybil-4-hydra-of-husks.png`,
`newborn-1-spark-mote.png` from `web/public/souls/`).

```
You are designing a 12-slide hackathon pitch deck for a project called Soulprint —
my submission to the Encode Club × Somnia Agentathon. Output: a polished .pptx file,
16:9 widescreen.

CRITICAL CONSTRAINT: do NOT make it look AI-generated. That means:
- No accent lines under titles, no decorative full-width colored bars or ribbons.
- No identical rounded-rectangle panels filling every slide.
- No concentric-circle "hero mark" on the title slide.
- No equal 2x2 / 3x3 grid filling the whole slide — break the grid.
- No "icon in colored circle + bold header + body" repeated identically.
- Avoid centred body text — left-align paragraphs.
- Avoid the default Calibri/Arial-on-dark-background "corporate template" feel.

POSITIVE direction:
- Monochrome dark palette: near-black background (#0a0a0c), white headlines (#ffffff),
  muted gray body (#9ca3af). Single cool accent — soft blue (#5b93de). One warm
  highlight color for numbers only — gold (#f0b94e), used sparingly.
- Use REAL TYPOGRAPHY with character. Suggested pairing: a display serif for headlines
  (e.g. Editorial New, Tiempos Headline, or Playfair Display) + a clean grotesk for body
  (Inter, Helvetica Neue, or DM Sans). Mix sizes aggressively — 80pt headline can sit
  next to 11pt body.
- Use the attached spirit-form PNGs as the deck's signature visual element. They're
  the product's own evolution forms — monochrome ink-on-black illustrations. Drop them
  in asymmetrically (bleed off the edge, large on one side, tiny corner watermark, etc.)
  on the title slide, the Soul Evolution slide, the close slide, and one or two more.
- Asymmetric layouts. Some slides text-only with HUGE typography. Some slides image-heavy.
  Don't make every slide look like the same template.
- One signature visual motif repeated subtly across slides (e.g. a single small spirit
  silhouette in the corner; or a single-pixel dotted underline only under section
  numbers; or a half-bleed gradient corner). Pick ONE thing and commit.

The 12 slides, in order. Each entry below is what the slide must communicate —
you decide the layout and visual treatment, but every word of the content must be
included verbatim where I've marked it in QUOTES.

----------------------------------------------------------------
SLIDE 1 — TITLE
Headline (largest text on the slide): "Soulprint"
Tagline directly below: "A living AI dossier for your wallet."
Bottom-of-slide caption: "Mint once. It evolves forever."
Footer in tiny gray text: "Encode Club × Somnia Agentathon · Submission 2026"
Use one of the spirit PNGs as the hero — bleed it off the left edge at large size,
treated as if it's an ink painting. No concentric circles. No dot.

----------------------------------------------------------------
SLIDE 2 — PROBLEM
Eyebrow label: "THE GAP"
Headline (two lines): "Every wallet has personality. / Nobody can read it."
Body paragraph: "On-chain history holds an identity in raw counters — transactions,
deploys, NFT mints, gas spent. But it's locked in numbers no human reads, and no
contract composes on. Meanwhile most 'AI on-chain' projects today are smoke and
mirrors: they call Gemini or Groq off-chain and only settle the result on-chain.
The AI isn't really on-chain."
Right-side callout — display this large: "0" then small label "on-chain primitives
that compose on a wallet's identity today".

----------------------------------------------------------------
SLIDE 3 — SOLUTION
Eyebrow: "OUR ANSWER"
Headline: "An on-chain identity primitive, written by on-chain AI agents."
Five numbered steps (1-5), each one sentence. Lay them out as a vertical narrative,
not as a grid of identical cards:
  1. "Point Soulprint at any wallet — yours, or someone else's."
  2. "A Somnia JSON API agent reads its real on-chain activity."
  3. "A Somnia on-chain LLM (Qwen-3 30B, fixed seed, validator-consensus) writes a
      witty, structured dossier."
  4. "It mints as a soulbound NFT (ERC-5192). Can't be sold. Can't be transferred."
  5. "An on-chain Cron keeps re-evaluating it — autonomously, forever."
Closing line (smaller, italic, accent color): "End to end — about six seconds. AI
executed by validators, output verified by consensus."

----------------------------------------------------------------
SLIDE 4 — LIVE DEMO LINKS
Headline (huge): "Try it. Now."
Subline: "Everything below is live on Somnia Shannon testnet (chainId 50312)."
Four links — display them as a list, NOT as identical card panels:
  • FRONTEND       https://soulprint-psi.vercel.app
  • GITHUB         https://github.com/DontFoldBB/soulprint
  • SOULPRINT      0x6876041cc67f9cd1b11e6e1827b13f3622d256e5
  • SOULPRINTCRON  0x0bf4e395ad3746632f86b5254fa18f0db3479d95
Each link with a one-line note underneath:
  - FRONTEND: "Mint a soulprint, look up any wallet."
  - GITHUB: "Public repo. 47 Hardhat tests green."
  - SOULPRINT: "ERC-721 + ERC-5192 soulbound, dynamic on-chain tokenURI."
  - SOULPRINTCRON: "Somnia Reactivity handler. Self-rescheduling autonomy."

----------------------------------------------------------------
SLIDE 5 — ARCHITECTURE
Headline: "Architecture"
Subline: "A two-step on-chain agent pipeline with a cost-gate in the middle, an
autonomy loop above."
Draw a clean horizontal flow diagram (left to right):
  read(wallet) → JSON API agent (tx_count) → cost-gate (unchanged? skip) →
  LLM agent (Qwen-3 30B) → soulbound mint
Below the flow, a second band labeled "Autonomy":
  SoulprintCron → tick → evolveBatch() → self-reschedule  (no human tx between ticks)
Make the diagram feel hand-drawn or technical-illustration style, not corporate-flowchart.
Thin lines, generous whitespace.

----------------------------------------------------------------
SLIDE 6 — SOUL EVOLUTION SYSTEM
Headline: "The Soul Evolution System"
Subline: "On-chain visual evolution — derived from real activity, not from the LLM's
mood."
Centered formula display (large): "10 stages × 3 archetype lines = 30 spirit forms"
Then three short sub-points, in any layout that ISN'T three identical card panels:
  - "Stage 1-10 bucketed from on-chain tx_count. Stage 4 at 75 tx, Stage 10 at 200k."
  - "Form lookup = (archetype × stage) → one of 30 monochrome spirit PNGs."
  - "Stage and Form are stored on-chain — stageOf / formIdOf / formSlugOf / evolutionOf —
     and surfaced as tokenURI traits."
Use multiple of the attached spirit PNGs as a side gallery on this slide — show the
RANGE (a Stage 1 alongside a Stage 10).

----------------------------------------------------------------
SLIDE 7 — PREPAID EVOLUTION FUEL
Headline: "Prepaid Evolution Fuel"
Subline: "Solves the 'autonomous tick eats the project's reserve forever' problem,
on-chain."
Compare BEFORE vs NOW. (NOT in two identical panels — use typography contrast: BEFORE
in muted strikethrough-feeling text, NOW in confident accent color.)
BEFORE:
  - "One mint → autonomous evolution forever, from the project's pocket."
  - "100 active wallets ≈ 100 STT / day burn."
  - "Owner can withdraw the entire reserve — no protection for funded evolutions."
NOW (LIVE):
  - "Mint earmarks INITIAL_FUEL_GRANT (0.4 STT ≈ 1 evolution) into the token's evoBalance."
  - "Each successful re-evolution deducts EVOLUTION_COST. Out of fuel → soul freezes
     (EvolutionPaused)."
  - "ANYONE can call topUpEvolution(tokenId). Owner cannot withdraw it (gated by
     availableForWithdraw; totalReserved is sacred)."
Closing pull-quote, italic, larger: "Keeping a soul alive becomes a public good. Boost
a friend. Boost a stranger."

----------------------------------------------------------------
SLIDE 8 — AUTONOMY (criterion #4)
Eyebrow: "ENCODE CRITERION #4 · AUTONOMOUS PERFORMANCE"
Headline: "Autonomy — proven live on-chain"
Hero number, huge: "35" with small label below "autonomous ticks on the previous live
cron". Beside it: "2 real evolutions · 33 cost-gated skips · 0 human tx" formatted as
three stat chips.
Body paragraph: "SoulprintCron is a Somnia Reactivity SomniaEventHandler. On each
scheduled tick the handler calls Soulprint.evolveBatch() and then schedules the next
tick — inside the same handler. The chain ticks the contract for us, on time, forever.
Sender of every tick is the Reactivity precompile (address 0x...0100). The contract
owner's address has zero outgoing tx to the cron — fully verifiable on the explorer.
Fresh cron at 0x0bf4...9d95 is armed now; same code as the proven one — criterion holds."

----------------------------------------------------------------
SLIDE 9 — AGENT-FIRST COMPOSABILITY (criterion #2)
Eyebrow: "ENCODE CRITERION #2 · AGENT-FIRST DESIGN"
Headline: "It's not an NFT. It's a primitive other agents read."
Three things, in any layout that's NOT three identical card panels:
  - "ONE-CALL READS — profileOf, traitsOf, evolutionOf, evolutionFuel. Any contract or
     agent gets a wallet's Soulprint in one read."
  - "MCP SERVER — node mcp/dist/index.js exposes get_soulprint(wallet) over the Model
     Context Protocol. Any AI agent can read a wallet's identity."
  - "EXAMPLEGATE — a separate contract whose enter() succeeds only if the caller's
     Soulprint activityScore clears a threshold. Reputation that can't be bought,
     transferred, or faked."

----------------------------------------------------------------
SLIDE 10 — HOW WE MAP TO THE 4 JUDGING CRITERIA
Headline: "How we map to the 4 judging criteria"
Four rows. Each row: criterion number, criterion name, one-sentence delivery.
  1. FUNCTIONALITY — "Live on Somnia testnet. read → AI → soulbound mint pipeline runs
     end-to-end in ~6 s. 47 Hardhat tests green."
  2. AGENT-FIRST DESIGN — "Orchestrates TWO Somnia base agents (JSON API + LLM) per
     pipeline. profileOf / traitsOf / evolutionOf / evolutionFuel for any contract to
     read. MCP server + ExampleGate as live consumers."
  3. INNOVATION & TECHNICAL CREATIVITY — "Native on-chain inference (not off-chain).
     Chained read→reason agent pipeline. Soulbound IDENTITY (not collectible).
     On-chain dynamic tokenURI. Cost-gated evolution. 30-form Soul Evolution System.
     Prepaid Evolution Fuel."
  4. AUTONOMOUS PERFORMANCE — "SoulprintCron self-reschedules INSIDE the handler.
     ticks() rises, subscriptionId re-arms, zero human tx between ticks. Previous cron:
     35 ticks → 2 real evolutions, all verifiable on explorer."

----------------------------------------------------------------
SLIDE 11 — TECH STACK & NUMBERS
Headline: "Tech stack & numbers"
Five big stats, displayed as confident large typography (not as five identical card
boxes):
  47 — Hardhat tests
  30 — spirit PNG forms
  10 — evolution stages
  ~6s — end-to-end mint
  0 — human tx per evolution
Then a stack-list (any visual treatment, NOT a chip grid):
  Solidity 0.8.30 · OpenZeppelin v5 · ERC-721 + ERC-5192 · viaIR · cancun EVM ·
  Hardhat + viem · Somnia Agents · Somnia Reactivity · Qwen-3 30B (on-chain) ·
  Model Context Protocol · Next.js 16 · Turbopack · Vercel · TypeScript 5.7

----------------------------------------------------------------
SLIDE 12 — CLOSE
Big headline left or center: "Soulprint"
Three subline rows underneath:
  "A composable identity primitive other agents read."
  "Cost-bounded by design.   Soulbound.   Self-evolving.   Live on Somnia."
  (italic, larger, accent): "Mint once.  It evolves forever."
Tiny footer: "github.com/DontFoldBB/soulprint · soulprint-psi.vercel.app"
Use one spirit PNG as the hero — different from slide 1, possibly larger / bleeding
off the right edge.

----------------------------------------------------------------

OUTPUT: produce the .pptx file using python-pptx. After generating, render each slide
to PNG and show them all to me so I can review. Iterate on any slide where the typography
is mushy, the spirit images aren't placed well, or the layout reverts to "AI-template
look".
```

---

## PROMPT 2 — redesign the architecture diagram (single PNG)

Paste this into a separate ChatGPT chat (or continue the same one). This is one image, 1600×900 PNG.

```
Design a single 1600×900 PNG architecture diagram for Soulprint — a Somnia hackathon
project. Style: technical illustration with a hand-drawn / sketched quality, NOT a
corporate flowchart. Think early-Google-keynote whiteboard sketch, or a Stripe-style
clean technical diagram.

CRITICAL CONSTRAINT: do NOT make it look AI-generated. That means:
- No boxes-with-rounded-corners-and-bold-headers everywhere.
- No identical card panels in a grid.
- No "icon in colored circle" decorations.
- No accent ribbon at the bottom of the canvas.
- No gradients fading from corner to corner.

POSITIVE direction:
- Monochrome dark canvas (#0a0a0c background, white & muted-gray ink). One cool blue
  accent (#5b93de) for arrows and key callouts. One warm gold (#f0b94e) for ONE
  callout (the cost-gate).
- Lines should feel slightly imperfect — thin, single-stroke, not heavy borders.
- Typography: serif headline ("Soulprint — Architecture"), grotesk for labels.
- Use real arrow paths with thoughtful curves, not straight 90-degree polylines.
- The big idea: judges should see in 3 seconds that there are TWO loops — the pipeline
  (left-to-right) and the autonomy cron (re-firing the pipeline on a schedule).

WHAT TO DEPICT:

Headline (top-left): "Soulprint — Architecture"
Sub-headline (smaller): "A two-step on-chain agent pipeline with a cost-gate in the
middle, and an autonomy loop above."

Pipeline (horizontal, occupying the center two-thirds of the canvas):
  read(wallet)  →  JSON API agent (tx_count from explorer)  →  cost-gate
  (tx_count unchanged? skip) AND (evoBalance < cost? pause)  →  LLM agent
  (Qwen-3 30B, consensus-verified)  →  soulbound mint (ERC-721 + ERC-5192)

Above the pipeline (autonomy loop, drawn as a curved arrow looping back to evolveBatch
which feeds into JSON API agent):
  SoulprintCron (Somnia Reactivity handler) → tick → evolveBatch() → self-reschedule
  Annotate: "0 human tx between ticks. Sender of every tick = Reactivity precompile
  0x...0100. Previous cron reached 35 autonomous ticks."

Below the pipeline (composability bar, three small labels):
  one-call reads: profileOf · traitsOf · evolutionOf · evolutionFuel
  MCP server: mcp/ exposes get_soulprint(wallet)
  ExampleGate: enter() — activityScore >= N

Bottom right corner, tiny: "github.com/DontFoldBB/soulprint"

Output: single 1600×900 PNG, transparent or near-black background. After generating,
show it to me and offer iterations if any text is unreadable or the layout is cramped.
```

---

## PROMPT 3 — title slide hero image only (optional)

If you decide to keep my pptxgenjs deck but just swap the title-slide art, this prompt
generates one standalone hero image you can drop into slide 1.

```
Generate a single hero illustration for the title slide of a hackathon pitch deck.

Subject: a single "spirit form" — an abstract, monochrome figure that reads as both
a sigil and a living being. Think: ink-and-wash illustration, calligraphic, with
subtle motion. Inspiration: Hayao Miyazaki "kodama" forest spirit + Japanese sumi-e
ink wash + cyberpunk circuit-board glow. Mostly negative space.

Style constraints:
- Monochrome — near-black background (#0a0a0c), white-to-pale-blue (#5b93de) ink.
- No text. No logos. No words anywhere.
- No symmetric mandala. No concentric circles.
- Composition: figure off-center (bleeding off the left edge of the image), leaves the
  right two-thirds of the canvas open for title text to be laid over later.
- Aspect ratio: 1600×900 (16:9).
- Feel: contemplative, slightly mystical, technically precise.

This is the visual signature for "Soulprint" — a project that turns a wallet's
on-chain identity into a living, evolving soulbound NFT. The hero should embody
"a soul born from data".

Output: single 1600×900 PNG, no text.
```

---

## How to use this with ChatGPT

1. Open `https://chat.openai.com`, pick **GPT-5 Thinking** or **GPT-4o** with Python tools
   enabled (the icon usually labelled "Code Interpreter" or "Advanced Data Analysis").
2. For Prompt 1: attach 4-6 spirit PNGs from `web/public/souls/` (drag them into the
   message). Then paste the prompt. ChatGPT will generate a `.pptx` file you download.
3. For Prompt 2: just paste. ChatGPT will generate a PNG you download.
4. For Prompt 3: just paste. ChatGPT will return a hero image you save.
5. Drop the new files into `docs/submission/` (overwriting the old ones), commit, push.

If a slide / image still looks "AI-template", tell ChatGPT specifically WHAT looks
templated (e.g. "the cards on slide 3 are still identical rounded rectangles — break
the grid, use typography contrast instead") and ask for one more pass on that slide
only. Don't accept "good enough" — push back twice if needed, then ship.
