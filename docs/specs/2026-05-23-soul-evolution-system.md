# Soulprint — Soul Evolution System (10 stages · 30 forms · rarity)

> Design spec for the evolved Soulprint NFT: a wallet's on-chain "soul" manifests as one of
> **30 spirit forms**, sitting at one of **10 evolution stages**, with a **rarity** overlay.
> Art = curated monochrome/duotone **spirit-entity** images (one per form), AI-generated via
> ChatGPT/DALL·E from the prompts in §6. Stage/form/rarity are derived **on-chain** from real
> wallet stats (verifiable + composable); the LLM still writes the witty dossier text on top.

---

## 1. The three axes

A soul is described by three independent things:

| Axis | Range | Source | Meaning |
|---|---|---|---|
| **Archetype** | 7 families | LLM reads stats → `ARCHETYPE:` (parsed on-chain today) | *What kind* of soul (behaviour family) |
| **Stage** | 1–10 | **on-chain** `evoScore` from rich stats | *How evolved* (level / magnitude) |
| **Rarity** | Common→Legendary (1–5) | on-chain rarity score | *How special* (visual treatment overlay) |

**Form (species) = lookup(archetype, stage).** Each archetype is an **evolution line** of a few
named spirit forms gated by stage. 7 lines → **30 forms** total (§4).

A wallet's card therefore reads e.g.:
> **"The Midnight Liquidity Goblin"** (witty TYPE) · Species **Flux Specter** · DeFi line ·
> **Stage 6/10 — Ascending** · **Epic**.

---

## 2. The 10 evolution stages (universal "level")

Stage is a pure magnitude ladder — same meaning for every archetype.

| Stage | Name | Vibe |
|---|---|---|
| 1 | Dormant | barely a flicker |
| 2 | Stirring | first motion |
| 3 | Awakening | takes shape |
| 4 | Forming | a defined entity |
| 5 | Tempered | solid, capable |
| 6 | Ascending | gaining power |
| 7 | Radiant | luminous, strong |
| 8 | Transcendent | beyond ordinary |
| 9 | Mythic | rare power |
| 10 | Eternal | apex soul |

### evoScore → stage (on-chain, deterministic)

Points accrue from rich stats (each capped), summed, then bucketed:

```
pts  = tier(tx_count,        [5,20,75,200,600])        // 0..5
     + tier(token_transfers, [10,100,500])             // 0..3
     + tier(tokens_held,     [1,10])                   // 0..2  (NFTs + tokens)
     + tier(contracts_made,  [1,5])  * 1.5             // 0..3  (deployers weigh more)
     + tier(gas_used,        [1e6,1e8])                // 0..2
     + tier(age_days,        [7,30,180])               // 0..3
     + tier(balance_stt,     [1,10])                   // 0..2
// tier(x, thresholds) = count of thresholds x meets
maxPts = 20
stage  = clamp(1 + floor(pts * 9 / maxPts), 1, 10)
```

Cron evolution re-reads stats → `stage` rises as the wallet grows, with **no human tx**
(this is the autonomy story made visible: souls level up on their own).

---

## 3. Archetype assignment (which of 7 lines)

Kept as today: the LLM reads the stats and emits one canonical `ARCHETYPE:` value, parsed
on-chain into `archetypeOf`. The 7 families (with their spirit motif):

| Archetype | Spirit motif |
|---|---|
| Newborn Wallet | a faint nascent mote / spark |
| Testnet Explorer | a wandering seeker / cartographer spirit |
| DeFi User | a flowing liquid / current spirit |
| NFT Collector | an ornate, crystalline, ornamented spirit |
| Contract Deployer | an architect / forge / constructor spirit |
| Sybil-Like Farmer | a fractured, mirrored, swarming husk |
| Power User | an ascended, radiant apex spirit |

*(Future option: move archetype to on-chain rules for full verifiability — see §7.)*

---

## 4. The 30 forms (7 evolution lines)

`stage` column = the global stage (§2) at which that form starts showing (highest reached form
wins). `slug` = the image filename + on-chain form id.

### Newborn Wallet — *nascent motes* (3)
| # | Stage | Form | slug |
|---|---|---|---|
| 1 | 1 | Spark Mote | `newborn-1-spark-mote` |
| 2 | 2 | Drifting Wisp | `newborn-2-drifting-wisp` |
| 3 | 3 | Ember Shade | `newborn-3-ember-shade` |

### Testnet Explorer — *seeker spirits* (4)  ← **TEST LINE (matches the burner demo wallet)**
| # | Stage | Form | slug |
|---|---|---|---|
| 4 | 2 | Seeker Wisp | `explorer-1-seeker-wisp` |
| 5 | 3 | Pathfinder Shade | `explorer-2-pathfinder-shade` |
| 6 | 5 | Cartographer Spirit | `explorer-3-cartographer-spirit` |
| 7 | 6 | Voidwalker | `explorer-4-voidwalker` |

### DeFi User — *liquid spirits* (5)
| # | Stage | Form | slug |
|---|---|---|---|
| 8 | 3 | Liquidity Sprite | `defi-1-liquidity-sprite` |
| 9 | 4 | Yield Wraith | `defi-2-yield-wraith` |
| 10 | 6 | Flux Specter | `defi-3-flux-specter` |
| 11 | 8 | Market Phantom | `defi-4-market-phantom` |
| 12 | 9 | Leviathan of Liquidity | `defi-5-leviathan` |

### NFT Collector — *ornate spirits* (4)
| # | Stage | Form | slug |
|---|---|---|---|
| 13 | 3 | Curio Imp | `nft-1-curio-imp` |
| 14 | 4 | Gallery Shade | `nft-2-gallery-shade` |
| 15 | 6 | Aesthete Spirit | `nft-3-aesthete-spirit` |
| 16 | 8 | Curator Sovereign | `nft-4-curator-sovereign` |

### Contract Deployer — *architect spirits* (5)
| # | Stage | Form | slug |
|---|---|---|---|
| 17 | 4 | Glyph Sprite | `deployer-1-glyph-sprite` |
| 18 | 5 | Architect Shade | `deployer-2-architect-shade` |
| 19 | 7 | Forge Specter | `deployer-3-forge-specter` |
| 20 | 9 | Protocol Wright | `deployer-4-protocol-wright` |
| 21 | 10 | Genesis Demiurge | `deployer-5-genesis-demiurge` |

### Sybil-Like Farmer — *fractured husks* (4)
| # | Stage | Form | slug |
|---|---|---|---|
| 22 | 2 | Husk Mote | `sybil-1-husk-mote` |
| 23 | 4 | Mirror Shade | `sybil-2-mirror-shade` |
| 24 | 6 | Swarm Wraith | `sybil-3-swarm-wraith` |
| 25 | 7 | Hydra of Husks | `sybil-4-hydra-of-husks` |

### Power User — *ascended spirits* (5)
| # | Stage | Form | slug |
|---|---|---|---|
| 26 | 5 | Adept Spirit | `power-1-adept-spirit` |
| 27 | 7 | Ascendant Shade | `power-2-ascendant-shade` |
| 28 | 8 | Sovereign Specter | `power-3-sovereign-specter` |
| 29 | 9 | Ætherlord | `power-4-aetherlord` |
| 30 | 10 | Soul Singularity | `power-5-soul-singularity` |

---

## 5. Rarity overlay (Common → Legendary)

Rarity is the existing 1–5 score (from the dossier `RARITY:` + on-chain factors). It does **not**
change the form — it changes the **treatment** in the card UI:

| Rarity | Tier | UI treatment (added by the card, not the image) |
|---|---|---|
| 1 | Common | steel rim, faint glow |
| 2 | Uncommon | green-grey aura |
| 3 | Rare | blue rim-light + sharper glow |
| 4 | Epic | violet halo + animated shimmer |
| 5 | Legendary | gold halo + particles + holographic foil sweep |

→ The 30 images stay **monochrome/duotone with a single icy-cyan signature accent** that varies
per form (eyes / lantern / compass / crown / coins / glyphs / lattice / lightning / etc. — see
§6). The rarity color is added by the UI in two places: (a) the **card frame/aura** per the table
above, and (b) **the entity's signature accent is dynamically retinted to the rarity tier color**
via a CSS `mix-blend-mode: hue` overlay (tier-coloured div over the image — only the chromatic
accent pixels take the new hue, the grayscale body is unaffected). Result: ONE image per form
(30 total), rarity dynamically shows in both frame and signature accent for each wallet.

---

## 6. Image prompts (monochrome/duotone spirit entities)

**Pipeline:** paste each prompt into ChatGPT (GPT-4o image / DALL·E 3) → download → send back to
me named by the form `slug` (e.g. `explorer-3-cartographer-spirit.png`). I'll wire them in.

**Generate the TEST LINE first** (the 4 Testnet Explorer forms, #4–#7) to validate the whole
pipeline before doing all 30.

### 6.1 Master style preamble (PREPEND to every prompt)

> Monochrome duotone digital illustration, **1:1 square**, a single ethereal **spirit entity**
> centered on a plain near-black void background (#08080A). **Strictly grayscale/duotone** —
> charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. **The
> single exception is ONE designated signature feature unique to this form** — named explicitly
> in the per-form prompt (e.g. eyes, a lantern, a compass-rune, a crown, a held glyph, a chest
> core, an orbiting beacon, coins, lightning, etc., DIFFERENT per form so the 30-piece collection
> reads as varied) — **which glows with a small, concentrated, vivid yet soft luminous icy
> cyan-white light (#9ce6ff)**, saturated enough to read clearly against the grayscale body.
> **Everything else (smoke, mist, embers, sparks, flames, background, rim-light, all other
> details and props) must remain pure grayscale — no other color anywhere.** The being is made of drifting smoke, mist, embers and flowing energy,
> with fine particulate sparks and elegant negative space. Soft volumetric glow, high contrast,
> premium and mysterious, collectible NFT key-art. **No text, no logo, no border, no frame**,
> centered, full entity visible with breathing room. Consistent style across a collection.

### 6.2 Per-form descriptors (append after the preamble)

Intensity escalates with stage. Each form has a **unique cyan signature accent** so the
collection reads as varied — name only that element in the prompt with the cyan glow; everything
else stays strictly grayscale.

**Newborn (nascent motes)**
- `newborn-1-spark-mote` — *Stage 1:* a tiny single spark, almost nothing — one faint glowing ember mote with a thin wisp of grey smoke, mostly empty black space. **Accent (cyan):** the mote itself (the soul-core).
- `newborn-2-drifting-wisp` — *Stage 2:* a small drifting wisp of pale grey smoke beginning to coil into a teardrop shape. **Accent (cyan):** the small inner glow at its center.
- `newborn-3-ember-shade` — *Stage 3:* a small hooded shade of soot and grey embers, faint trailing ash. **Accent (cyan):** the vague face-of-light glimpsed under its hood.

**Testnet Explorer (seeker spirits) — TEST LINE**
- `explorer-1-seeker-wisp` — *Stage 2:* a slender wandering wisp shaped like a hooded scout, faint dotted trail of white light behind it like footprints. **Accent (cyan):** a single bright eye-spark under the hood.
- `explorer-2-pathfinder-shade` — *Stage 3:* a lean cloaked shade with hidden face, thin white map-line filaments unspooling from its form. **Accent (cyan):** the small glowing compass-rune held in its hand.
- `explorer-3-cartographer-spirit` — *Stage 5:* a graceful spirit wrapped in glowing white contour-map lines and silver constellation threads, hooded face in shadow. **Accent (cyan):** the lantern of light it carries.
- `explorer-4-voidwalker` — *Stage 6:* a tall striding traveler-spirit of smoke and starlight, cloak dissolving into drifting white map-fragments, commanding silver aura, eyes in shadow. **Accent (cyan):** the cluster of small orbiting beacon node-lights around its head.

**DeFi User (liquid spirits)**
- `defi-1-liquidity-sprite` — *Stage 3:* a small sprite made of looping pale liquid ribbons, playful. **Accent (cyan):** the central droplet-heart at its core.
- `defi-2-yield-wraith` — *Stage 4:* a wraith of braided flowing grey currents, faceless. **Accent (cyan):** the small coins of light woven through its streams.
- `defi-3-flux-specter` — *Stage 6:* a specter of intertwining grey liquid channels and flowing curve-graphs. **Accent (cyan):** the pulsing nodes along its currents.
- `defi-4-market-phantom` — *Stage 8:* an imposing phantom whose body is a churning sea of grey liquidity streams. **Accent (cyan):** the candlestick-shard glyphs floating around its torso.
- `defi-5-leviathan` — *Stage 9:* a vast serpentine leviathan of pure flowing grey liquid-light, immense coiling currents, awe-inspiring scale. **Accent (cyan):** its single piercing eye.

**NFT Collector (ornate spirits)**
- `nft-1-curio-imp` — *Stage 3:* a small ornate imp with decorative silver filigree, mischievous. **Accent (cyan):** the single framed shard it clutches.
- `nft-2-gallery-shade` — *Stage 4:* a shade with ornamented silver edges, faceless. **Accent (cyan):** the floating empty frames orbiting around it.
- `nft-3-aesthete-spirit` — *Stage 6:* an elegant crystalline spirit adorned with intricate carved white patterns, calm. **Accent (cyan):** the orbiting gem-shards around it.
- `nft-4-curator-sovereign` — *Stage 8:* a regal sovereign-spirit with ornate baroque silver detailing, commanding presence, face in shadow. **Accent (cyan):** its crown of framed relics.

**Contract Deployer (architect spirits)**
- `deployer-1-glyph-sprite` — *Stage 4:* a small sprite reaching upward with one hand. **Accent (cyan):** the single glyph/blueprint line it draws in the air.
- `deployer-2-architect-shade` — *Stage 5:* a shade with arms outstretched, faceless. **Accent (cyan):** the floating wireframe blueprints and geometric scaffolding around it.
- `deployer-3-forge-specter` — *Stage 7:* a specter at a spectral grey forge with hammer raised, white forge-sparks. **Accent (cyan):** the code-glyph being hammered on the anvil.
- `deployer-4-protocol-wright` — *Stage 9:* a towering wright-spirit, hands weaving outward. **Accent (cyan):** the vast interlocking geometric lattice it weaves.
- `deployer-5-genesis-demiurge` — *Stage 10:* a god-like demiurge of pure architecture, monumental, hands cupped. **Accent (cyan):** the small luminous cosmos of geometric constructs cradled in its hands.

**Sybil-Like Farmer (fractured husks)**
- `sybil-1-husk-mote` — *Stage 2:* a small hollow husk-mote with slightly duplicated/ghosted grey edges, faintly uneasy. **Accent (cyan):** the hollow void-eye at its center.
- `sybil-2-mirror-shade` — *Stage 4:* a shade splitting into 3-4 identical mirrored copies of itself in grey, overlapping ghosts. **Accent (cyan):** the synchronized eyes across all copies.
- `sybil-3-swarm-wraith` — *Stage 6:* a wraith with a single hollow grey core, unsettling. **Accent (cyan):** the dense swarm of tiny identical motes orbiting its core.
- `sybil-4-hydra-of-husks` — *Stage 7:* a many-headed hydra-spirit of repeating identical hollow grey faces, smoke and static, unsettling multiplicity. **Accent (cyan):** the multiple identical glowing eyes across all faces.

**Power User (ascended spirits)**
- `power-1-adept-spirit` — *Stage 5:* a poised adept-spirit with balanced flowing grey robes of light, serene. **Accent (cyan):** its calm radiant chest-core.
- `power-2-ascendant-shade` — *Stage 7:* a rising shade with arms spread, gaining power, body of grey smoke. **Accent (cyan):** the brilliant energy ribbons trailing upward from it.
- `power-3-sovereign-specter` — *Stage 8:* a commanding sovereign-specter with a strong silver aura, face in shadow. **Accent (cyan):** its crown of light.
- `power-4-aetherlord` — *Stage 9:* an Ætherlord of grey storm-energy, immense presence. **Accent (cyan):** the lightning-storms wreathing it.
- `power-5-soul-singularity` — *Stage 10:* a transcendent singularity, reality bending inward around it, ultimate apex form, awe and silence. **Accent (cyan):** its blinding core singularity at the center.

### 6.3 Ready-to-paste prompts (all 30 forms, pre-assembled)

Each block below is a complete, self-contained prompt. Copy one into a **fresh ChatGPT chat per form** so accents don't bleed across siblings. If ChatGPT keeps paraphrasing and breaking the grayscale rule, prepend: *"Generate one image, 1:1 square. Pass the prompt below to the image generator VERBATIM — do not rewrite, summarize, paraphrase, or improve it. Follow every constraint literally."* and then the prompt. **Save each output as `<slug>.png`** (slugs in §4) into `web/public/souls/`.

#### Newborn line (3 forms)

**1 · `newborn-1-spark-mote`** (Stage 1)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the mote itself (the soul-core). Everything else (smoke, mist, embers, sparks, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of drifting grey smoke and mist, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a tiny single spark, almost nothing — one faint glowing mote with a thin wisp of grey smoke, mostly empty black space. The mote glows softly cyan.
```

**2 · `newborn-2-drifting-wisp`** (Stage 2)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the small inner glow at its center. Everything else (smoke, mist, embers, sparks, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of drifting grey smoke and mist, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a small drifting wisp of pale grey smoke beginning to coil into a teardrop shape; deep within its body, a small cyan inner-glow.
```

**3 · `newborn-3-ember-shade`** (Stage 3)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the vague face-of-light glimpsed under its hood. Everything else (smoke, mist, embers, sparks, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of drifting grey smoke and mist, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a small hooded shade of soot and grey embers, faint trailing ash; beneath the hood, a vague cyan face-of-light.
```

#### Testnet Explorer line — TEST LINE (4 forms, already validated)

**4 · `explorer-1-seeker-wisp`** (Stage 2)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the single eye-spark under its hood. Everything else (smoke, mist, embers, sparks, trails, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of drifting grey smoke and mist, fine particulate sparks of white light, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a slender wandering wisp shaped like a hooded scout, a faint dotted trail of small white lights behind it like footprints. The single bright cyan eye-spark glints from under the hood.
```

**5 · `explorer-2-pathfinder-shade`** (Stage 3)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the small compass-rune held in its hand. Everything else (smoke, mist, embers, sparks, the entity's face/eyes, background, rim-light, all other details) must remain pure grayscale — no other color anywhere, NOT even the eyes. Made of drifting grey smoke, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a lean cloaked shade with its face in deep shadow, thin white map-line filaments unspooling from the folds of its cloak. In its outstretched hand, a small intricate compass-rune glows softly in cyan.
```

**6 · `explorer-3-cartographer-spirit`** (Stage 5)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the lantern carried in its hand. Everything else (smoke, mist, embers, contour-map lines, constellation threads, the entity's face/eyes, background, rim-light, all other details) must remain pure grayscale — no other color anywhere, NOT even the eyes. Made of drifting grey smoke, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a graceful spirit wrapped in glowing white contour-map lines and silver constellation threads, hooded face in shadow. In its raised hand, an ornate small lantern emitting a soft cyan glow.
```

**7 · `explorer-4-voidwalker`** (Stage 6)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the cluster of small orbiting beacon node-lights around its head. Everything else (smoke, mist, embers, map-fragments, the entity's face/eyes, background, rim-light, all other details) must remain pure grayscale — no other color anywhere, NOT even the eyes. Made of drifting grey smoke and starlight, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a tall striding traveler-spirit of smoke and starlight, cloak dissolving into drifting white map-fragments, commanding silver aura, face in deep shadow. A constellation of 5-7 small bright cyan beacon node-lights orbit slowly around its head like a halo.
```

#### DeFi User line (5 forms)

**8 · `defi-1-liquidity-sprite`** (Stage 3)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the central droplet-heart at its core. Everything else (looping liquid ribbons, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of looping pale grey liquid ribbons, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a small playful sprite made of looping pale grey liquid ribbons; at the very center of its body, a small cyan droplet-heart glows steadily.
```

**9 · `defi-2-yield-wraith`** (Stage 4)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the small coins of light woven through its streams. Everything else (braided grey currents, body, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of braided flowing grey currents, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a faceless wraith of braided flowing grey currents; small cyan coin-glyphs dissolve and reform through its streams.
```

**10 · `defi-3-flux-specter`** (Stage 6)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the pulsing nodes along its currents. Everything else (channels, graphs, body, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of intertwining grey liquid channels and flowing curve-graphs, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a specter of intertwining grey liquid channels and flowing curve-graphs; bright cyan pulsing nodes mark the intersection points along its currents.
```

**11 · `defi-4-market-phantom`** (Stage 8)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the candlestick-shard glyphs floating around its torso. Everything else (the churning grey body, streams, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of churning grey liquidity streams, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: an imposing phantom whose body is a churning sea of grey liquidity streams; small cyan candlestick-shard glyphs hover and slowly orbit around its torso.
```

**12 · `defi-5-leviathan`** (Stage 9)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is its single piercing eye. Everything else (the leviathan's vast coiling body, currents, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of pure flowing grey liquid-light in immense coiling currents, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a vast serpentine leviathan of pure flowing grey liquid-light, immense coiling currents, awe-inspiring scale; a single piercing cyan eye in its head locks the viewer's gaze.
```

#### NFT Collector line (4 forms)

**13 · `nft-1-curio-imp`** (Stage 3)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the single framed shard it clutches. Everything else (the imp's body, filigree, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made with decorative silver filigree on a soft grey ghost-body, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a small ornate imp with decorative silver filigree, mischievous; in its claws, a single small cyan framed shard glows softly.
```

**14 · `nft-2-gallery-shade`** (Stage 4)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the floating empty frames orbiting around it. Everything else (the shade's body, ornaments, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of soft grey smoke with ornamented silver edges, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a faceless shade with ornamented silver edges; small empty rectangular cyan frames orbit slowly around it like a halo.
```

**15 · `nft-3-aesthete-spirit`** (Stage 6)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the orbiting gem-shards around it. Everything else (the crystalline body, carved patterns, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Crystalline form with intricate carved white patterns, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: an elegant crystalline spirit adorned with intricate carved white patterns, calm and composed; faceted cyan gem-shards orbit around it like a slow constellation.
```

**16 · `nft-4-curator-sovereign`** (Stage 8)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is its crown of framed relics. Everything else (the sovereign's body, ornate silver baroque details, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Ornate baroque silver detailing, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a regal sovereign-spirit with ornate baroque silver detailing, commanding presence, face in shadow; an arched crown of small framed relics glows softly cyan above its head.
```

#### Contract Deployer line (5 forms)

**17 · `deployer-1-glyph-sprite`** (Stage 4)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the single glyph/blueprint line it draws in the air. Everything else (the sprite's body, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of pale grey smoke and mist, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a small sprite reaching one hand upward; a single luminous cyan glyph-line/blueprint stroke is being drawn in the air above its fingertip.
```

**18 · `deployer-2-architect-shade`** (Stage 5)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the floating wireframe blueprints and geometric scaffolding around it. Everything else (the shade's body, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of pale grey smoke, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a faceless shade with arms outstretched; floating cyan wireframe blueprints and small geometric scaffolding constructs hover around its hands.
```

**19 · `deployer-3-forge-specter`** (Stage 7)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the code-glyph being hammered on the anvil. Everything else (the specter's body, the spectral forge, hammer, white sparks, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere; sparks are pure white, NOT cyan. Made of pale grey smoke, fine white forge-sparks, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a specter at a spectral grey forge with hammer raised, fine white forge-sparks flying; on the anvil, a glowing cyan code-glyph mid-formation.
```

**20 · `deployer-4-protocol-wright`** (Stage 9)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the vast interlocking geometric lattice it weaves. Everything else (the wright's body, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of pale grey smoke, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a towering wright-spirit, hands weaving outward; a vast luminous cyan geometric lattice of interlocking structures expands outward from its hands.
```

**21 · `deployer-5-genesis-demiurge`** (Stage 10)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the small luminous cosmos of geometric constructs cradled in its hands. Everything else (the demiurge's monumental body, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Monumental form of pure architectural light in grayscale, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a god-like demiurge of pure architecture, monumental scale, hands cupped together at the chest; a small luminous cyan cosmos of geometric constructs is cradled between its palms.
```

#### Sybil-Like Farmer line (4 forms)

**22 · `sybil-1-husk-mote`** (Stage 2)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the hollow void-eye at its center. Everything else (the husk body, ghosted duplicated edges, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Slightly unsettling, made of pale grey smoke with slightly duplicated/ghosted edges, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a small hollow husk-mote with slightly duplicated/ghosted grey edges, faintly uneasy; at its center, a single small cyan hollow void-eye stares forward.
```

**23 · `sybil-2-mirror-shade`** (Stage 4)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the synchronized eyes across all of its mirrored copies. Everything else (the shade bodies, overlapping ghost-figures, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of pale grey smoke, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a shade splitting into 3-4 identical mirrored copies of itself in grey, overlapping ghost-figures; every copy has the same synchronized cyan eyes, staring straight forward in unison.
```

**24 · `sybil-3-swarm-wraith`** (Stage 6)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the dense swarm of tiny identical motes orbiting its core. Everything else (the wraith's hollow core, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Unsettling form of pale grey smoke, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a wraith with a single hollow grey core, unsettling; a dense swarm of dozens of tiny identical cyan motes orbits the hollow center.
```

**25 · `sybil-4-hydra-of-husks`** (Stage 7)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the multiple identical glowing eyes across all of its faces. Everything else (the hydra's repeating heads, hollow grey faces, smoke, static, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Unsettling multiplicity, made of pale grey smoke and faint static, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a many-headed hydra-spirit of 5-6 repeating identical hollow grey faces emerging from a single torso; multiple identical glowing cyan eyes stare forward from every face in eerie synchrony.
```

#### Power User line (5 forms)

**26 · `power-1-adept-spirit`** (Stage 5)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is its calm radiant chest-core. Everything else (the adept's robes, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of balanced flowing grey robes of light, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a poised adept-spirit with balanced flowing grey robes of light, serene posture; a calm radiant cyan chest-core glows steadily through its robes.
```

**27 · `power-2-ascendant-shade`** (Stage 7)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the brilliant energy ribbons trailing upward from it. Everything else (the shade's body of grey smoke, robes, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of grey smoke and mist, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a rising shade with arms spread wide, body of grey smoke; brilliant cyan energy ribbons trail dramatically upward from its shoulders and outstretched hands.
```

**28 · `power-3-sovereign-specter`** (Stage 8)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is its crown of light. Everything else (the specter's body, silver aura, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Strong silver aura on a grey smoke body, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a commanding sovereign-specter with a strong silver aura, face in deep shadow; an imposing cyan crown of light hovers just above its head.
```

**29 · `power-4-aetherlord`** (Stage 9)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is the lightning-storms wreathing it. Everything else (the Ætherlord's body of grey storm-energy, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Made of grey storm-energy, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: an Ætherlord of grey storm-energy, immense and imposing presence; cyan lightning-storms wreathe its entire body, crackling outward in all directions.
```

**30 · `power-5-soul-singularity`** (Stage 10)
```
Monochrome duotone digital illustration, 1:1 square, a single ethereal spirit entity centered on a plain near-black void background (#08080A). Strictly grayscale/duotone — charcoal blacks, graphite greys, luminous bone-white highlights, soft silver rim-light. The SINGLE exception is ONE designated signature feature glowing with a small, concentrated, vivid yet soft luminous icy cyan-white light (#9ce6ff), saturated enough to read clearly against the grayscale body — for THIS form the signature accent is its blinding core singularity at the center. Everything else (the transcendent form, bent reality, smoke, background, rim-light, all other details) must remain pure grayscale — no other color anywhere. Reality bending inward around a transcendent grayscale form, soft volumetric glow, high contrast, premium mysterious collectible NFT key-art. No text, no logo, no border, no frame, centered, full entity visible with breathing room. — The entity: a transcendent singularity, reality bending inward around it, ultimate apex form, awe and silence; a blinding cyan core singularity at the exact center collapses light inward into itself.
```

---

## 7. Implementation plan (after test images look right)

1. **Contract** (`Soulprint.sol`): fetch richer stats (counters + balance + tokens via the JSON
   API agent, ~2–3 calls); compute `stage` (§2) and `formId` = `FORM_TABLE[archetype][stage]`
   on-chain; store `stageOf`, `formOf`. Add `traitsOf`/`profileOf` fields for them (composable).
2. **Metadata/art**: host the 30 images (start in `web/public/souls/`, later IPFS); `tokenURI`
   `image` → the form's URL; add Stage/Form/Rarity to on-chain `attributes`.
3. **Frontend**: card shows the **form image** (framed by rarity treatment §5), a **rich stat
   panel** (Activity, Txns, Token transfers, Gas, Age, Balance, Stage X/10, Gen, Rarity), and the
   evolution ladder (Stage 1→10 with current highlighted).
4. **Test-first**: ship the Testnet Explorer line end-to-end (4 images) against the burner demo
   wallet, confirm it's fire, then generate + wire the remaining 26.

## 8. Open decisions
- Host images on `web/public` (simple, fast) vs IPFS (decentralised, but slower to set up). Default
  `web/public` for the demo; IPFS as a stretch.
- Keep archetype from the LLM (current) vs move to on-chain rules (more verifiable, more contract
  code). Default keep LLM for now.
- Fetching more stats = more STT per read/evolution. Bound it (cache stats; only re-fetch on cron).
