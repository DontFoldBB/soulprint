# Soulprint — Economics & Sustainability (thinking, not locked)

> Captured 2026-05-20/21 from a design discussion. NOT a hackathon blocker — testnet STT is free
> and demo NFT counts are tiny. This matters for a real/mainnet product, and a credible model is a
> **plus for judges** (shows a real product, not a tech demo). A short version belongs in the README.

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

## Fix part 1 — bound the cost (so evolution is never bottomless)
- **Gated evolution:** cheap on-chain check gates the expensive LLM. A JSON read (~0.1) fetches the
  current tx_count; compare to stored `txCountOf` (free, on-chain); only fire the LLM (~0.2) if it
  changed. Idle wallets (the common case) → ~⅔ cheaper per tick. (`wallet.balance` is readable
  on-chain for free as a coarse pre-filter, but it's an incomplete signal.)
- **Prepaid / bounded evolutions:** a mint buys e.g. N evolutions; after that the NFT "freezes"
  until the owner tops up. Evolution can then never run at a loss — it's capped by what was paid in.
- **Rare cadence:** auto-evolve monthly, not constantly.

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
evolution is never a bottomless cost (prepaid), and revenue comes from those consuming the
reputation data. Removes the owner's "pay forever" pain and aligns with how the project is pitched.

## Pitch line (for README / submission)
> Cost-aware by design: a cheap on-chain check gates the expensive LLM so idle wallets don't burn
> resources, and the profile is a composable primitive others pay to read — not a bottomless subsidy.
