// Generates docs/submission/soulprint-deck.pptx — Encode × Somnia Agentathon submission deck.
// Monochrome dark aesthetic matching the project's UI (near-black, white, single accent blue).
// 12 slides, 16:9 widescreen, varied layouts (no AI-slop accent lines / colored ribbons).
//
// Run:  $env:NODE_PATH = "C:\Users\lange\AppData\Roaming\npm\node_modules"
//       node docs/submission/build-deck.js

const PptxGenJS = require("pptxgenjs");
const path = require("path");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in
pptx.author = "Soulprint";
pptx.title = "Soulprint — Encode × Somnia Agentathon";

// ── Palette ──────────────────────────────────────────────────────────────────
const BG = "0A0A0C";          // near-black background
const CARD = "16181D";        // panel background
const STROKE = "27272A";      // subtle border
const TEXT = "FFFFFF";        // primary text
const TEXT2 = "D1D5DB";       // body text
const MUTED = "71717A";       // labels, meta
const ACCENT = "5B93DE";      // single accent blue (matches SoulCard Rare tier)
const GOLD = "F0B94E";        // used sparingly for numbers / highlights

const FONT_H = "Calibri";     // headers
const FONT_B = "Calibri";     // body
const FONT_M = "Consolas";    // monospace (addresses, code)

const W = 13.33, H = 7.5;
const MARGIN = 0.6;

// ── Helpers ──────────────────────────────────────────────────────────────────
function addBackground(slide) {
  slide.background = { color: BG };
}
function addEyebrow(slide, slideNum) {
  slide.addText(
    [
      { text: "SOULPRINT", options: { color: TEXT, bold: true } },
      { text: "   ·   ", options: { color: MUTED } },
      { text: "Encode × Somnia Agentathon", options: { color: MUTED } },
    ],
    { x: MARGIN, y: 0.35, w: 8, h: 0.3, fontFace: FONT_H, fontSize: 10, charSpacing: 4 }
  );
  slide.addText(`${String(slideNum).padStart(2, "0")} / 12`, {
    x: W - MARGIN - 1.0, y: 0.35, w: 1.0, h: 0.3,
    fontFace: FONT_M, fontSize: 9, color: MUTED, align: "right",
  });
}
function addFootline(slide) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: H - 0.04, w: W, h: 0.04, fill: { color: ACCENT }, line: { type: "none" },
  });
}
function panel(slide, x, y, w, h) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: CARD },
    line: { color: STROKE, width: 0.75 },
    rectRadius: 0.08,
  });
}

// ── Slide 1 — TITLE ──────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  // Big centered halftone-ish mark — simulated with overlapping translucent circles
  for (let i = 0; i < 4; i++) {
    s.addShape(pptx.ShapeType.ellipse, {
      x: W / 2 - 2 - i * 0.15, y: 1.5 - i * 0.05, w: 4 + i * 0.3, h: 4 + i * 0.3,
      fill: { color: CARD }, line: { color: STROKE, width: 0.5 },
    });
  }
  s.addShape(pptx.ShapeType.ellipse, {
    x: W / 2 - 0.4, y: 3.35, w: 0.8, h: 0.8, fill: { color: ACCENT }, line: { type: "none" },
  });
  // Tagline above title
  s.addText("A LIVING AI DOSSIER FOR YOUR WALLET", {
    x: 0, y: 0.6, w: W, h: 0.4, fontFace: FONT_H, fontSize: 14,
    color: MUTED, align: "center", charSpacing: 12,
  });
  // Title
  s.addText("Soulprint", {
    x: 0, y: 5.4, w: W, h: 1.0, fontFace: FONT_H, fontSize: 72,
    color: TEXT, align: "center", bold: true,
  });
  // Subtitle line
  s.addText("Mint once.  It evolves forever.", {
    x: 0, y: 6.4, w: W, h: 0.5, fontFace: FONT_H, fontSize: 22,
    color: ACCENT, align: "center", italic: true,
  });
  // Footer
  s.addText("Encode Club × Somnia Agentathon  ·  Submission 2026", {
    x: 0, y: 7.0, w: W, h: 0.3, fontFace: FONT_H, fontSize: 10,
    color: MUTED, align: "center", charSpacing: 4,
  });
  addFootline(s);
}

// ── Slide 2 — PROBLEM ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 2);
  s.addText("Every wallet has personality.\nNobody can read it.", {
    x: MARGIN, y: 1.2, w: 7.5, h: 1.8, fontFace: FONT_H, fontSize: 36,
    color: TEXT, bold: true, valign: "top",
  });
  s.addText(
    "On-chain history holds an identity in raw counters — transactions, deploys, NFT mints, " +
    "gas spent. But it's locked in numbers no human reads, and no contract composes on.\n\n" +
    "Meanwhile most “AI on-chain” projects today are smoke and mirrors: they call Gemini " +
    "or Groq off-chain and only settle the result on-chain. The AI isn't really on-chain.",
    {
      x: MARGIN, y: 3.4, w: 7.5, h: 3.0, fontFace: FONT_B, fontSize: 14,
      color: TEXT2, valign: "top", paraSpaceAfter: 6,
    }
  );
  // Right-side stat callout
  panel(s, 9.0, 1.5, 3.8, 5.0);
  s.addText("THE GAP", {
    x: 9.2, y: 1.75, w: 3.4, h: 0.3, fontFace: FONT_H, fontSize: 10,
    color: MUTED, charSpacing: 4,
  });
  s.addText("0", {
    x: 9.2, y: 2.2, w: 3.4, h: 1.6, fontFace: FONT_H, fontSize: 110,
    color: ACCENT, bold: true, align: "center",
  });
  s.addText("on-chain primitives that compose on a wallet's identity today", {
    x: 9.2, y: 4.0, w: 3.4, h: 1.4, fontFace: FONT_B, fontSize: 13,
    color: TEXT2, align: "center", italic: true,
  });
  s.addText("(an MCP server, a gating contract,\nan agent that asks “who is this?”)", {
    x: 9.2, y: 5.4, w: 3.4, h: 0.9, fontFace: FONT_B, fontSize: 10,
    color: MUTED, align: "center",
  });
  addFootline(s);
}

// ── Slide 3 — SOLUTION ───────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 3);
  s.addText("An on-chain identity primitive,\nwritten by on-chain AI agents.", {
    x: MARGIN, y: 1.2, w: 12, h: 1.7, fontFace: FONT_H, fontSize: 32,
    color: TEXT, bold: true, valign: "top",
  });
  // 5 numbered steps
  const steps = [
    ["1", "Point Soulprint at any wallet (yours or someone else's)."],
    ["2", "A Somnia JSON API agent reads its real on-chain activity."],
    ["3", "A Somnia on-chain LLM (Qwen-3 30B, fixed seed, validator-consensus) writes a witty, structured dossier."],
    ["4", "It mints as a soulbound NFT (ERC-5192). Can't be sold, can't be transferred."],
    ["5", "An on-chain Cron keeps re-evaluating it — autonomously, forever."],
  ];
  steps.forEach(([n, t], i) => {
    const y = 3.3 + i * 0.62;
    s.addShape(pptx.ShapeType.ellipse, {
      x: MARGIN, y, w: 0.45, h: 0.45,
      fill: { color: CARD }, line: { color: ACCENT, width: 1.25 },
    });
    s.addText(n, {
      x: MARGIN, y, w: 0.45, h: 0.45, fontFace: FONT_H, fontSize: 16,
      color: ACCENT, align: "center", valign: "middle", bold: true,
    });
    s.addText(t, {
      x: MARGIN + 0.7, y: y + 0.02, w: 11.4, h: 0.5,
      fontFace: FONT_B, fontSize: 14, color: TEXT2, valign: "middle",
    });
  });
  s.addText("End to end — about six seconds. AI executed by validators, output verified by consensus.", {
    x: MARGIN, y: 6.7, w: 12, h: 0.35, fontFace: FONT_H, fontSize: 12,
    color: ACCENT, italic: true,
  });
  addFootline(s);
}

// ── Slide 4 — LIVE DEMO LINKS ────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 4);
  s.addText("Try it. Now.", {
    x: MARGIN, y: 1.2, w: 12, h: 1.0, fontFace: FONT_H, fontSize: 40,
    color: TEXT, bold: true,
  });
  s.addText("Everything below is live on Somnia Shannon testnet (chainId 50312).", {
    x: MARGIN, y: 2.3, w: 12, h: 0.4, fontFace: FONT_B, fontSize: 14, color: MUTED,
  });
  // 4 link cards in a 2x2 grid
  const links = [
    ["FRONTEND",            "soulprint-psi.vercel.app",                              "Mint a soulprint, look up any wallet."],
    ["GITHUB",              "github.com/DontFoldBB/soulprint",                       "Public repo. 47 Hardhat tests green."],
    ["SOULPRINT CONTRACT",  "0x6876041cc67f9cd1b11e6e1827b13f3622d256e5",            "ERC-721 + ERC-5192 soulbound, dynamic on-chain tokenURI."],
    ["SOULPRINTCRON",       "0x0bf4e395ad3746632f86b5254fa18f0db3479d95",            "Somnia Reactivity handler. Self-rescheduling autonomy."],
  ];
  links.forEach(([label, value, note], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = MARGIN + col * 6.15, y = 3.0 + row * 1.85, w = 6.0, h = 1.65;
    panel(s, x, y, w, h);
    s.addText(label, {
      x: x + 0.25, y: y + 0.2, w: w - 0.5, h: 0.3,
      fontFace: FONT_H, fontSize: 10, color: ACCENT, charSpacing: 4, bold: true,
    });
    s.addText(value, {
      x: x + 0.25, y: y + 0.55, w: w - 0.5, h: 0.5,
      fontFace: FONT_M, fontSize: 13, color: TEXT, bold: true,
    });
    s.addText(note, {
      x: x + 0.25, y: y + 1.1, w: w - 0.5, h: 0.45,
      fontFace: FONT_B, fontSize: 11, color: MUTED,
    });
  });
  addFootline(s);
}

// ── Slide 5 — ARCHITECTURE ───────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 5);
  s.addText("Architecture", {
    x: MARGIN, y: 1.1, w: 12, h: 0.8, fontFace: FONT_H, fontSize: 32,
    color: TEXT, bold: true,
  });
  s.addText("A two-step on-chain agent pipeline with a cost-gate in the middle, an autonomy loop above.", {
    x: MARGIN, y: 1.9, w: 12, h: 0.4, fontFace: FONT_B, fontSize: 13, color: MUTED,
  });
  // Big panel containing the flow
  panel(s, MARGIN, 2.5, W - 2 * MARGIN, 4.4);
  const boxY = 3.05, boxH = 0.85;
  const flowBoxes = [
    { label: "read(wallet)", sub: "1 STT self / 2 STT other", x: 1.0 },
    { label: "JSON API agent", sub: "tx_count from explorer", x: 3.6 },
    { label: "cost-gate", sub: "unchanged? skip", x: 6.2 },
    { label: "LLM agent", sub: "Qwen-3 30B, consensus", x: 8.5 },
    { label: "soulbound mint", sub: "ERC-5192 · dynamic URI", x: 11.0 },
  ];
  flowBoxes.forEach(({ label, sub, x }, i) => {
    panel(s, x, boxY, 1.95, boxH);
    s.addText(label, {
      x, y: boxY + 0.12, w: 1.95, h: 0.32, fontFace: FONT_H, fontSize: 12,
      color: TEXT, bold: true, align: "center",
    });
    s.addText(sub, {
      x, y: boxY + 0.46, w: 1.95, h: 0.32, fontFace: FONT_B, fontSize: 9,
      color: MUTED, align: "center",
    });
    // arrow
    if (i < flowBoxes.length - 1) {
      const ax = x + 1.95, ay = boxY + boxH / 2;
      s.addShape(pptx.ShapeType.line, {
        x: ax, y: ay, w: 0.65, h: 0, line: { color: ACCENT, width: 1.25, endArrowType: "triangle" },
      });
    }
  });
  // Bottom row: cron loop pointing into the flow
  panel(s, 1.0, 5.4, 11.3, 1.2);
  s.addText("SoulprintCron (Somnia Reactivity)", {
    x: 1.2, y: 5.55, w: 5.0, h: 0.35, fontFace: FONT_H, fontSize: 13,
    color: ACCENT, bold: true,
  });
  s.addText(
    "scheduleSubscriptionAtTimestamp → tick → evolveBatch(N) → self-reschedule  ·  zero human tx between ticks",
    { x: 1.2, y: 5.9, w: 11.0, h: 0.6, fontFace: FONT_B, fontSize: 12, color: TEXT2 }
  );
  addFootline(s);
}

// ── Slide 6 — SOUL EVOLUTION SYSTEM ──────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 6);
  s.addText("The Soul Evolution System", {
    x: MARGIN, y: 1.1, w: 12, h: 0.8, fontFace: FONT_H, fontSize: 32,
    color: TEXT, bold: true,
  });
  s.addText("On-chain visual evolution — derived from real activity, not from the LLM's mood.", {
    x: MARGIN, y: 1.95, w: 12, h: 0.4, fontFace: FONT_B, fontSize: 13, color: MUTED,
  });
  // Hero formula
  s.addText(
    [
      { text: "10", options: { color: ACCENT, bold: true } },
      { text: " stages   ×   ", options: { color: MUTED } },
      { text: "3", options: { color: ACCENT, bold: true } },
      { text: " archetype lines   =   ", options: { color: MUTED } },
      { text: "30", options: { color: GOLD, bold: true } },
      { text: " spirit forms", options: { color: TEXT } },
    ],
    { x: MARGIN, y: 2.7, w: 12, h: 0.9, fontFace: FONT_H, fontSize: 36, align: "center" }
  );
  // Three side-by-side facts
  const facts = [
    ["Stage 1 → 10",
     "Bucketed from on-chain tx_count. Stage 4 unlocks at 75 tx, Stage 7 at 2 000, Stage 10 at 200 000."],
    ["Form lookup",
     "(archetype × stage) maps to one of 30 distinct PNG spirit forms — Pathfinder Shade, Cartographer Spirit, DeFi Whale, Sybil Hydra, Onchain Legend…"],
    ["Composable",
     "stageOf / formIdOf / formSlugOf / evolutionOf are one-call reads. Stage + Form land in tokenURI traits — marketplaces and agents can index without parsing the dossier."],
  ];
  facts.forEach(([h, b], i) => {
    const x = MARGIN + i * 4.05, y = 4.0, w = 3.85;
    panel(s, x, y, w, 2.7);
    s.addText(h, {
      x: x + 0.25, y: y + 0.25, w: w - 0.5, h: 0.4,
      fontFace: FONT_H, fontSize: 16, color: TEXT, bold: true,
    });
    s.addText(b, {
      x: x + 0.25, y: y + 0.75, w: w - 0.5, h: 1.85,
      fontFace: FONT_B, fontSize: 12, color: TEXT2, valign: "top",
    });
  });
  addFootline(s);
}

// ── Slide 7 — PREPAID EVOLUTION FUEL ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 7);
  s.addText("Prepaid Evolution Fuel", {
    x: MARGIN, y: 1.1, w: 12, h: 0.8, fontFace: FONT_H, fontSize: 32,
    color: TEXT, bold: true,
  });
  s.addText("Solves the “autonomous tick eats the project's reserve forever” problem on-chain.", {
    x: MARGIN, y: 1.95, w: 12, h: 0.4, fontFace: FONT_B, fontSize: 13, color: MUTED,
  });
  // Two-column before/after
  const colW = 6.0, colH = 4.3, colY = 2.5;
  // BEFORE
  panel(s, MARGIN, colY, colW, colH);
  s.addText("BEFORE", {
    x: MARGIN + 0.3, y: colY + 0.25, w: colW - 0.6, h: 0.3,
    fontFace: FONT_H, fontSize: 10, color: MUTED, charSpacing: 4, bold: true,
  });
  s.addText("A shared reserve, drained forever", {
    x: MARGIN + 0.3, y: colY + 0.6, w: colW - 0.6, h: 0.5,
    fontFace: FONT_H, fontSize: 18, color: TEXT, bold: true,
  });
  s.addText(
    "•  One mint → autonomous evolution forever from the project's pocket.\n\n" +
    "•  100 active wallets ≈ 100 STT / day burn.\n\n" +
    "•  Owner can withdraw the reserve — no protection for funded evolutions.",
    {
      x: MARGIN + 0.3, y: colY + 1.4, w: colW - 0.6, h: 2.8,
      fontFace: FONT_B, fontSize: 13, color: TEXT2, paraSpaceAfter: 4,
    }
  );
  // AFTER
  const x2 = MARGIN + colW + 0.3;
  panel(s, x2, colY, colW, colH);
  s.addText("NOW (LIVE)", {
    x: x2 + 0.3, y: colY + 0.25, w: colW - 0.6, h: 0.3,
    fontFace: FONT_H, fontSize: 10, color: ACCENT, charSpacing: 4, bold: true,
  });
  s.addText("Per-soul fuel · anyone can keep a soul alive", {
    x: x2 + 0.3, y: colY + 0.6, w: colW - 0.6, h: 0.5,
    fontFace: FONT_H, fontSize: 18, color: TEXT, bold: true,
  });
  s.addText(
    "•  Mint earmarks INITIAL_FUEL_GRANT (0.4 STT ≈ 1 evolution) into the token's evoBalance.\n\n" +
    "•  Each successful re-evolution deducts EVOLUTION_COST. Out of fuel → soul freezes (EvolutionPaused).\n\n" +
    "•  ANYONE can call topUpEvolution(tokenId) — owner, fan, patron contract. STT locks per-token; owner cannot withdraw it (gated by availableForWithdraw, totalReserved is sacred).",
    {
      x: x2 + 0.3, y: colY + 1.4, w: colW - 0.6, h: 2.8,
      fontFace: FONT_B, fontSize: 12, color: TEXT2, paraSpaceAfter: 4,
    }
  );
  // Footer beat
  s.addText("Keeping a soul alive becomes a public good.  Boost a friend. Boost a stranger.", {
    x: MARGIN, y: 6.95, w: 12, h: 0.35, fontFace: FONT_H, fontSize: 13,
    color: ACCENT, italic: true, align: "center",
  });
  addFootline(s);
}

// ── Slide 8 — AUTONOMY (CRITERION #4) ────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 8);
  s.addText("Autonomy — proven live on-chain", {
    x: MARGIN, y: 1.1, w: 12, h: 0.8, fontFace: FONT_H, fontSize: 30,
    color: TEXT, bold: true,
  });
  s.addText("Encode criterion #4 · Autonomous Performance", {
    x: MARGIN, y: 1.95, w: 12, h: 0.4, fontFace: FONT_B, fontSize: 13, color: MUTED,
  });
  // Big stat panel
  panel(s, MARGIN, 2.5, 5.5, 4.4);
  s.addText("35", {
    x: MARGIN, y: 2.8, w: 5.5, h: 2.0, fontFace: FONT_H, fontSize: 160,
    color: ACCENT, bold: true, align: "center", valign: "middle",
  });
  s.addText("autonomous ticks", {
    x: MARGIN, y: 4.7, w: 5.5, h: 0.4, fontFace: FONT_H, fontSize: 16,
    color: TEXT, align: "center",
  });
  s.addText("on the previous live cron", {
    x: MARGIN, y: 5.1, w: 5.5, h: 0.35, fontFace: FONT_B, fontSize: 12,
    color: MUTED, align: "center",
  });
  s.addText(
    [
      { text: "2", options: { color: GOLD, bold: true } },
      { text: " real evolutions   ·   ", options: { color: TEXT2 } },
      { text: "33", options: { color: GOLD, bold: true } },
      { text: " cost-gated skips   ·   ", options: { color: TEXT2 } },
      { text: "0", options: { color: GOLD, bold: true } },
      { text: " human tx", options: { color: TEXT2 } },
    ],
    { x: MARGIN, y: 5.85, w: 5.5, h: 0.5, fontFace: FONT_B, fontSize: 13, align: "center" }
  );
  // Right column: how it works
  const x2 = MARGIN + 5.5 + 0.3;
  s.addText("HOW", {
    x: x2, y: 2.7, w: 6.4, h: 0.3, fontFace: FONT_H, fontSize: 10,
    color: MUTED, charSpacing: 4, bold: true,
  });
  s.addText("SoulprintCron is a Somnia Reactivity SomniaEventHandler.", {
    x: x2, y: 3.05, w: 6.4, h: 0.4, fontFace: FONT_H, fontSize: 14, color: TEXT, bold: true,
  });
  s.addText(
    "•  On each scheduled tick the handler calls Soulprint.evolveBatch() and " +
    "then schedules the next tick — inside the same handler. The chain ticks the contract " +
    "for us, on time, forever.\n\n" +
    "•  Sender of every tick is the Reactivity precompile (address 0x…0100). " +
    "The contract owner's address has zero outgoing tx to the cron — fully verifiable on the explorer.\n\n" +
    "•  Fresh cron at 0x0bf4… is armed now; same code as the proven one — criterion holds.",
    {
      x: x2, y: 3.55, w: 6.4, h: 3.4, fontFace: FONT_B, fontSize: 12,
      color: TEXT2, valign: "top", paraSpaceAfter: 4,
    }
  );
  addFootline(s);
}

// ── Slide 9 — AGENT-FIRST COMPOSABILITY (CRITERION #2) ───────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 9);
  s.addText("Agent-first composability", {
    x: MARGIN, y: 1.1, w: 12, h: 0.8, fontFace: FONT_H, fontSize: 30,
    color: TEXT, bold: true,
  });
  s.addText("Encode criterion #2 · the Soulprint is a primitive, not an end-product NFT.", {
    x: MARGIN, y: 1.95, w: 12, h: 0.4, fontFace: FONT_B, fontSize: 13, color: MUTED,
  });
  // Three cards in a row
  const cards = [
    [
      "ONE-CALL READS",
      "profileOf(addr)\ntraitsOf(addr)\nevolutionOf(addr)\nevolutionFuel(tokenId)",
      "Any contract or agent gets a wallet's Soulprint in one read — dossier, archetype, activity score, stage + form, fuel state.",
    ],
    [
      "MCP SERVER",
      "node mcp/dist/index.js\nget_soulprint(wallet)",
      "Model Context Protocol server exposes the Soulprint to any AI agent over a standard protocol. Read-only, no key.",
    ],
    [
      "EXAMPLEGATE",
      "ExampleGate.enter()\nrequire(activityScore >= N)",
      "Third contract gates access on Soulprint activity. Reputation that can't be bought, transferred, or faked.",
    ],
  ];
  cards.forEach(([head, code, desc], i) => {
    const x = MARGIN + i * 4.05, y = 2.6, w = 3.85, h = 4.3;
    panel(s, x, y, w, h);
    s.addText(head, {
      x: x + 0.25, y: y + 0.25, w: w - 0.5, h: 0.3,
      fontFace: FONT_H, fontSize: 10, color: ACCENT, charSpacing: 4, bold: true,
    });
    s.addText(code, {
      x: x + 0.25, y: y + 0.7, w: w - 0.5, h: 1.6,
      fontFace: FONT_M, fontSize: 12, color: TEXT, valign: "top", paraSpaceAfter: 2,
    });
    s.addText(desc, {
      x: x + 0.25, y: y + 2.4, w: w - 0.5, h: 1.75,
      fontFace: FONT_B, fontSize: 12, color: TEXT2, valign: "top",
    });
  });
  addFootline(s);
}

// ── Slide 10 — CRITERIA MAPPING ──────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 10);
  s.addText("How we map to the 4 judging criteria", {
    x: MARGIN, y: 1.1, w: 12, h: 0.8, fontFace: FONT_H, fontSize: 28,
    color: TEXT, bold: true,
  });
  // 2x2 grid of criteria
  const criteria = [
    ["1", "FUNCTIONALITY",
     "Live on Somnia testnet. read → AI → soulbound mint pipeline runs end-to-end in ~6 s. 47 Hardhat tests green."],
    ["2", "AGENT-FIRST DESIGN",
     "Orchestrates TWO Somnia base agents (JSON API + LLM) per pipeline. profileOf / traitsOf / evolutionOf / evolutionFuel for any contract to read. MCP server + ExampleGate as live consumers."],
    ["3", "INNOVATION & TECHNICAL CREATIVITY",
     "Native on-chain inference (not off-chain). Chained read→reason agent pipeline. Soulbound IDENTITY (not collectible). On-chain dynamic tokenURI. Cost-gated evolution. 30-form Soul Evolution. Prepaid Evolution Fuel."],
    ["4", "AUTONOMOUS PERFORMANCE",
     "SoulprintCron self-reschedules INSIDE the handler. ticks() rises, subscriptionId re-arms, zero human tx between ticks. Previous cron: 35 ticks → 2 real evolutions, all verifiable on explorer."],
  ];
  const cellW = 6.0, cellH = 2.4, gap = 0.3;
  criteria.forEach(([n, head, body], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = MARGIN + col * (cellW + gap), y = 2.1 + row * (cellH + gap);
    panel(s, x, y, cellW, cellH);
    // Number badge
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.25, y: y + 0.25, w: 0.55, h: 0.55,
      fill: { color: ACCENT }, line: { type: "none" },
    });
    s.addText(n, {
      x: x + 0.25, y: y + 0.25, w: 0.55, h: 0.55,
      fontFace: FONT_H, fontSize: 18, color: BG, bold: true, align: "center", valign: "middle",
    });
    s.addText(head, {
      x: x + 1.0, y: y + 0.3, w: cellW - 1.2, h: 0.4,
      fontFace: FONT_H, fontSize: 12, color: TEXT, bold: true, charSpacing: 3,
    });
    s.addText(body, {
      x: x + 1.0, y: y + 0.75, w: cellW - 1.2, h: cellH - 0.95,
      fontFace: FONT_B, fontSize: 11, color: TEXT2, valign: "top",
    });
  });
  addFootline(s);
}

// ── Slide 11 — TECH STACK & NUMBERS ──────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  addEyebrow(s, 11);
  s.addText("Tech stack & numbers", {
    x: MARGIN, y: 1.1, w: 12, h: 0.8, fontFace: FONT_H, fontSize: 32,
    color: TEXT, bold: true,
  });
  // Big-number row
  const stats = [
    ["47", "Hardhat tests"],
    ["30", "spirit PNG forms"],
    ["10", "evolution stages"],
    ["~6s", "end-to-end mint"],
    ["0", "human tx per evolution"],
  ];
  stats.forEach(([v, l], i) => {
    const x = MARGIN + i * 2.45, y = 2.3, w = 2.3, h = 1.6;
    panel(s, x, y, w, h);
    s.addText(v, {
      x, y: y + 0.15, w, h: 0.9, fontFace: FONT_H, fontSize: 42,
      color: ACCENT, bold: true, align: "center", valign: "middle",
    });
    s.addText(l, {
      x, y: y + 1.05, w, h: 0.45, fontFace: FONT_B, fontSize: 11,
      color: MUTED, align: "center",
    });
  });
  // Stack chips
  s.addText("THE STACK", {
    x: MARGIN, y: 4.4, w: 12, h: 0.3,
    fontFace: FONT_H, fontSize: 10, color: MUTED, charSpacing: 4, bold: true,
  });
  const chips = [
    "Solidity 0.8.30",
    "OpenZeppelin v5",
    "ERC-721 + ERC-5192",
    "viaIR · cancun EVM",
    "Hardhat + viem",
    "Somnia Agents",
    "Somnia Reactivity",
    "Qwen-3 30B (on-chain)",
    "Model Context Protocol",
    "Next.js 16 · Turbopack",
    "Vercel",
    "TypeScript 5.7",
  ];
  const chipsPerRow = 4;
  const chipW = (W - 2 * MARGIN) / chipsPerRow - 0.15;
  const chipH = 0.45;
  chips.forEach((label, i) => {
    const col = i % chipsPerRow, row = Math.floor(i / chipsPerRow);
    const x = MARGIN + col * (chipW + 0.15), y = 4.85 + row * (chipH + 0.15);
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: chipW, h: chipH,
      fill: { color: CARD }, line: { color: STROKE, width: 0.5 }, rectRadius: 0.06,
    });
    s.addText(label, {
      x, y, w: chipW, h: chipH, fontFace: FONT_B, fontSize: 12,
      color: TEXT2, align: "center", valign: "middle",
    });
  });
  addFootline(s);
}

// ── Slide 12 — CLOSE ─────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addBackground(s);
  // Mark on left
  for (let i = 0; i < 3; i++) {
    s.addShape(pptx.ShapeType.ellipse, {
      x: 1.5 - i * 0.1, y: 2.7 - i * 0.05, w: 2.2 + i * 0.2, h: 2.2 + i * 0.2,
      fill: { color: CARD }, line: { color: STROKE, width: 0.5 },
    });
  }
  s.addShape(pptx.ShapeType.ellipse, {
    x: 2.4, y: 3.6, w: 0.4, h: 0.4, fill: { color: ACCENT }, line: { type: "none" },
  });
  // Right side: stacked pitch lines
  s.addText("Soulprint", {
    x: 5.0, y: 2.0, w: 8, h: 1.0, fontFace: FONT_H, fontSize: 56, color: TEXT, bold: true,
  });
  s.addText("A composable identity primitive other agents read.", {
    x: 5.0, y: 3.1, w: 8, h: 0.5, fontFace: FONT_H, fontSize: 18, color: TEXT2,
  });
  s.addText("Cost-bounded by design.   Soulbound.   Self-evolving.   Live on Somnia.", {
    x: 5.0, y: 3.65, w: 8, h: 0.4, fontFace: FONT_B, fontSize: 14, color: MUTED,
  });
  s.addText("Mint once.  It evolves forever.", {
    x: 5.0, y: 5.0, w: 8, h: 0.8, fontFace: FONT_H, fontSize: 32, color: ACCENT,
    italic: true, bold: true,
  });
  s.addText("github.com/DontFoldBB/soulprint   ·   soulprint-psi.vercel.app", {
    x: 0, y: 6.8, w: W, h: 0.3, fontFace: FONT_M, fontSize: 12, color: MUTED, align: "center",
  });
  addFootline(s);
}

// ── Save ─────────────────────────────────────────────────────────────────────
const out = path.resolve(__dirname, "soulprint-deck.pptx");
pptx.writeFile({ fileName: out }).then(() => {
  console.log("Wrote", out);
});
