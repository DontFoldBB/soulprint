# Soulprint — your wallet's living on-chain identity

> *Not an AI caption for your wallet — an identity primitive other agents can build on.*

**A soulbound, self-evolving identity primitive.** Somnia's on-chain AI agents read a wallet's
history into an archetype, mint it as a living NFT, and re-evaluate it over time — composable by
any contract via `profileOf`, with no server and no human in the loop.

**Mint once. It evolves forever.**

Built for the **Encode Club × Somnia Agentathon** (May–June 2026).

<!-- TODO before submission: replace with a 3–6s GIF of the mint flow (paste wallet → dossier card) -->
> 📹 **Demo video:** _<link — 2–5 min walkthrough>_ · 🔴 **Live on Somnia Shannon testnet**

---

## 60-second pitch

Every wallet already has a personality written in its on-chain history — but it's locked in raw
counters no human reads. **Soulprint computes that identity entirely on-chain:**

1. You point Soulprint at a wallet (yours or anyone's).
2. A **Somnia JSON API agent** reads the wallet's real activity from the chain explorer.
3. A **Somnia on-chain LLM (Qwen3-30B)** distills it into a witty, structured **dossier** — an
   invented archetype + strength/weakness/style/karma/rarity.
4. It's minted as a **soulbound NFT (ERC-5192)** — bound to the wallet, can't be sold or moved.
5. The profile **keeps re-evaluating itself** as the wallet's behaviour changes — every update is
   a new on-chain `generation`.

The whole read → reason → mint pipeline runs **end-to-end in ~6 seconds**, with the AI executed by
Somnia's validator network and verified by consensus — **not a single off-chain server in the loop.**

---

## Why this is different (the part most "AI on-chain" projects skip)

Most "AI on Somnia" projects call Gemini/Groq **off-chain** and only settle the result on-chain.
Soulprint uses Somnia's **native on-chain inference** — the AI runs deterministically across
validators (fixed seed, temp 0) and the output is consensus-verified state, like any other
on-chain value.

It's also not an end-product NFT — it's a **primitive**: a single `profileOf(wallet)` call lets any
other contract or agent ask *"who is this wallet?"* and build on the answer (gating, scoring,
reputation, matchmaking).

---

## How we map to the judging criteria

| Criterion | What Soulprint does | Status |
|---|---|---|
| **1. Functionality** | Full read → AI → soulbound mint pipeline **deployed and working live** on Shannon testnet, ~6s end to end. 13 Hardhat tests green. | ✅ Live |
| **2. Agent-First Design** | `read(wallet)` + `ProfileRequested` event let any agent trigger a profiling run; `profileOf(wallet)` view lets any contract consume the result. The contract itself **orchestrates two base agents** (JSON API → LLM) in one pipeline. | ✅ Live |
| **3. Innovation & Technical Creativity** | Native on-chain inference (not off-chain), a **chained read→reason agent pipeline**, soulbound **identity** (not a tradeable collectible), and a fully **on-chain dynamic `tokenURI`** that rewrites itself each generation. | ✅ Live |
| **4. Autonomous Performance** | The dossier **self-evolves**: each re-evaluation bumps an on-chain `generation` and emits `DossierUpdated`. Capstone: **Cron self-evolution** via Somnia Reactivity (`SomniaEventHandler` scheduled subscription) so it re-runs with **no human transaction**. | 🚧 Cron in progress · fallback: permissionless `evolveAll()` |

---

## Live deployment

| | |
|---|---|
| Network | Somnia **Shannon testnet** (chainId `50312`) |
| Contract | [`0x0b8912155847fc7c1570e0dd5cd37fe0837966a1`](https://shannon-explorer.somnia.network/address/0x0b8912155847fc7c1570e0dd5cd37fe0837966a1) |
| Somnia Agents platform | `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` |
| Agents used | JSON API Request (`13174…`) + LLM Inference / Qwen3-30B (`12847…`) |

> The contract is named `Persona` in code; **Soulprint** is the product brand.

---

## How it works (architecture)

```
                  read(wallet) ─┐ (or ProfileRequested from another agent)
                                ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  Soulprint contract (ERC-721 + ERC-5192 soulbound)            │
   │                                                               │
   │  1. JSON API agent  ──► reads wallet stats from chain         │
   │     (shannon-explorer /addresses/{wallet}/counters)           │
   │                          │ tx_count, …                        │
   │  2. LLM agent       ◄────┘ ──► writes the dossier             │
   │     (Qwen3-30B, deterministic, consensus-verified)            │
   │                          │                                    │
   │  3. mint soulbound NFT ──┘  dynamic tokenURI (on-chain JSON)  │
   │     generation++, emit DossierUpdated                         │
   └─────────────────────────────────────────────────────────────┘
                                ▲
        profileOf(wallet) ──────┘  any contract/agent can read the profile
```

**Async agent pattern:** `read()` fires a JSON API request; the platform calls back `handleStats`,
which fires the LLM request; the platform calls back `handleDossier`, which mints/updates. Every
callback is gated (`msg.sender == platform` + pending-request check) and every response status is
handled.

**Dossier format** (what the on-chain LLM is prompted to produce):
`TYPE` (invented archetype + tier) · `STRENGTH` · `WEAKNESS` · `STYLE` · `KARMA` · `NOTES` · `RARITY`.

---

## Contract surface

| Function / event | Purpose |
|---|---|
| `read(address wallet) payable` | Start the pipeline for a wallet; mints on completion. First 100 mints are refunded. |
| `reread(uint256 tokenId)` | Owner refreshes an existing profile (new generation). |
| `profileOf(address wallet) → (tokenId, dossier, generation)` | **Agent-composable** one-call read. |
| `tokenURI(uint256)` | Fully on-chain, regenerated metadata + dossier per generation. |
| `locked(uint256) → true` / `_update` revert | ERC-5192 soulbound: profiles can't be transferred. |
| `ProfileRequested`, `PersonaMinted`, `DossierUpdated`, `Locked` | Events for indexers / agents / timeline. |

---

## Run it locally

```bash
# Contracts (repo root)
npm install
npx hardhat test                                        # 13 tests, must stay green
npx hardhat run scripts/deploy.ts --network somnia      # deploy (reads PRIVATE_KEY from .env)
npx hardhat run scripts/smokeTest.ts --network somnia   # live read of a wallet on testnet

# Frontend
cd web && npm install && npm run dev                    # local dev server
```

A funded Somnia testnet wallet is required to deploy/mint. Get STT from
[testnet.somnia.network](https://testnet.somnia.network/). Never use a real-money wallet.

---

## Tech stack

Solidity 0.8.24 (Hardhat, `viaIR`, `evmVersion: cancun`) · OpenZeppelin v5 ERC-721 + ERC-5192
soulbound · Somnia Agents (JSON API + on-chain LLM) · Somnia Reactivity (Cron self-evolution) ·
Next.js 16 frontend.

## License

MIT — see [`LICENSE`](./LICENSE).
