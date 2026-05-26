# Soulprint — Economics & Sustainability

> Captured 2026-05-20/21 from a design discussion; **part 1 (bound the cost) is now LIVE on-chain**
> as of 2026-05-26 (the Prepaid Evolution Fuel system, deployed in the `0x6876…56e5` Soulprint).
> Part 2 (consumers pay to read) stays as the post-hackathon roadmap. A short version belongs in
> the README.

## STATUS: prepaid evolution is live (2026-05-26)

The "forever cost from autonomous ticks" problem described below is now structurally bounded:
- Every Soulprint has a per-token `evoBalance` (in STT). `INITIAL_FUEL_GRANT = 0.4 STT` is
  earmarked at mint (~1 autonomous evolution included).
- `EVOLUTION_COST = 0.4 STT` is deducted from `evoBalance` on every successful re-evolution.
- When `evoBalance < EVOLUTION_COST` the cron emits `EvolutionPaused(tokenId, balance)` and
  skips that wallet — no JSON poll, no LLM call. The soul freezes at its last form on-chain.
- **Anyone** can revive a paused soul via `topUpEvolution(tokenId) payable` — the STT goes
  into that token's `evoBalance` and only its future evolutions can consume it.
- `withdraw(amount)` is gated by `availableForWithdraw()` (= `address(this).balance - totalReserved`)
  — owner can NEVER dip into the prepaid fuel. `totalReserved` is the on-chain invariant that
  protects every Soulprint's earmarked balance.

This turns "keep my soul alive" into a public good (and a viral mechanic: boost a friend's soul,
boost the founder's soul, pool-fund the most active wallet's evolution, etc.).

## The flaw in the current model
"First 100 mints free + autonomous evolution forever" is a **launch growth hack, not a business
model** — it's an *unbounded liability*. If 100 wallets mint (all free) and growth stalls, there's
zero revenue while evolution keeps draining the contract's STT reserve forever.

## Cost facts (from the contract)
- Mint price: 1 STT; first 100 mints refunded (`freeMintsRemaining = 100`).
- Per full read/evolution = 2 agent calls: JSON API (~0.12 STT deposit, the *cheap* data fetch) +
  LLM (~0.24 STT deposit, the *expensive* AI). Total ~0.36 STT deposit, ~0.3 real after rebates.
- These deposits are paid from the **contract's reserve**, not by the client.
- Client cost: ~0 for first 100 (refunded), 1 STT after (kept by contract).

## Fix part 1 — bound the cost (so evolution is never bottomless) — **IMPLEMENTED**
- ✅ **Gated evolution:** cheap on-chain check gates the expensive LLM (`txCountOf` delta in
  `handleStats` — `EvolutionSkipped` emitted when unchanged). Idle wallets (the common case) →
  no LLM call, only the JSON poll. Confirmed live: 33 of 35 ticks on the previous deploy were
  cost-gated, only 2 produced real evolutions.
- ✅ **Prepaid / bounded evolutions (Prepaid Evolution Fuel):** mint allocates `INITIAL_FUEL_GRANT`
  (0.4 STT, ~1 evolution) into the token's `evoBalance`; each successful re-evolution deducts
  `EVOLUTION_COST` (0.4 STT). When fuel runs out the cron emits `EvolutionPaused` and skips —
  the soul freezes at its last form. Anyone (owner, fan, patron contract) can revive it via
  `topUpEvolution(tokenId) payable`. Owner `withdraw` can never dip into `totalReserved`.
- **Rare cadence:** still tunable (`SoulprintCron.setParams`), currently 30-min — already plenty
  rare for the demo. The fuel system makes the cadence almost orthogonal to cost.

## Fix part 2 — add revenue (ranked by fit to our positioning)
1. **🥇 Consumers pay to read (B2B) — best fit.** Soulprint is a *reputation/identity primitive*:
   other dApps/agents call `profileOf`/`traitsOf` to learn "who is this wallet" (gating, scoring,
   matchmaking). Charge a micro-fee per query or a subscription/API key. The payer is the builder
   on top of us, not the end user. Most defensible + scalable; matches the locked positioning.
2. **🥈 Mint fee with margin.** On mainnet, drop or shrink "100 free" (keep as a small launch bonus);
   mint = agent cost (~0.3) + markup. Post-100 mint already nets ~0.7 STT today.
3. **🥉 Freemium / subscription.** Free = static dossier; paid = auto-evolution, higher refresh
   rate, richer stats, premium archetypes. Manual `reread` as a paid action.

## Recommended target model
**"Consumers pay to read" + "evolution is prepaid / bounded."** End users mint cheap/free (growth),
evolution is never a bottomless cost (prepaid — **shipped**), and revenue comes from those consuming
the reputation data (post-hackathon). Removes the owner's "pay forever" pain and aligns with how
the project is pitched.

## Pitch line (for README / submission)
> Cost-aware by design: a cheap on-chain check skips the LLM when nothing changed, **and each
> Soulprint carries its own prepaid evolution fuel — so no soul evolves at the project's expense**.
> Anyone can `topUpEvolution(tokenId)` to keep a soul alive, turning longevity into a public good.
