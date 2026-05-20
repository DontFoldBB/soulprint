# Somnia Agents & Reactivity — Full Reference

> Durable reference for the Soulprint project. Captures the official Somnia Agents developer
> guide (verbatim content shared during planning), plus spike findings (explorer API,
> Reactivity API) and key research facts. Do not lose this — it is the source material the
> contract integration is built on.

---

## A. Official guide: "Building on the Agentic L1 — A Developer's Guide to Somnia Agents"

### Why smart contracts need agents
A smart contract can do math, move tokens, branch on chain state. Natively it CANNOT: fetch a
price from an API, read a webpage, ask an LLM to classify text, or make any decision requiring
external info or AI reasoning. The decade-old workaround = oracles (a trusted middleman bolted
onto a trustless contract). Somnia Agents give contracts native access to external data, web
extraction, and on-chain LLM inference — executed by Somnia's validator network and verified by
consensus, like any other on-chain state.

### What a Somnia Agent is
A decentralized, sandboxed compute container addressable by `agentId`. Your contract invokes it
like any contract (ABI-encoded payload), but execution happens off the EVM on a subcommittee of
validators; the result returns asynchronously via a callback. Three properties:
- **EVM-native interface:** agent calls are just ABI calldata.
- **Deterministic AI:** LLM agents run with fixed seeds and temperature = 0, so every validator
  independently produces byte-identical output → consensus on AI results.
- **Asynchronous:** `createRequest` returns a `requestId` immediately; the result lands later in
  a callback you implement.

### The three base agents (live on Testnet + Mainnet; same agentId, only platform address differs)

**JSON API Request — 0.03 per validator.** Fetches & parses any public HTTP endpoint (price
feed, sports API, weather) with no off-chain relayer.
```solidity
fetchUint(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    "bitcoin.usd",
    uint8(8)
);
```
Selector syntax is JSON-path-like (`bitcoin.usd`, `items.0.name`). Typed variants for strings,
addresses, arrays. Use for: price oracles, sports/event resolution, weather, public data.

**LLM Inference — 0.07 per validator.** Deterministic inference against an on-chain
**Qwen3-30B** model. Four functions, increasing power:
- `inferString` — single-turn classification, constrainable to allowed values.
- `inferNumber` — single-turn integer output, clamped to a range.
- `inferChat` — multi-turn chat with message history.
- `inferToolsChat` — multi-turn chat with MCP tool calling + on-chain tool calling (model yields
  calldata back to your contract).
Use for: content moderation, sentiment scoring, intent classification, agentic DeFi bots,
autonomous routing logic.

**LLM Parse Website — 0.10 per validator.** Scrapes a URL and extracts structured data via LLM.
Direct mode (scrape this URL, extract these fields) or Search mode (search this domain for
matching content, then extract). Use for: prediction-market resolution, news-driven triggers,
structured extraction from sites without an API.

### First agent call — canonical BTC price oracle (every agent call follows this shape)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
    IAgentRequester, IAgentRequesterHandler,
    Response, Request, ResponseStatus
} from "./interfaces/IAgentRequester.sol";

interface IJsonApiAgent {
    function fetchUint(string calldata url, string calldata selector, uint8 decimals)
        external returns (uint256);
}

contract BtcPriceOracle is IAgentRequesterHandler {
    IAgentRequester public immutable platform;
    uint256 public constant JSON_API_AGENT_ID = 13174292974160097713;
    uint256 public constant SUBCOMMITTEE_SIZE = 3;
    uint256 public constant PRICE_PER_AGENT = 0.03 ether;

    uint256 public latestPrice;
    mapping(uint256 => bool) public pendingRequests;

    event PriceReceived(uint256 indexed requestId, uint256 price);

    constructor(address platform_) { platform = IAgentRequester(platform_); }

    function requestBitcoinPrice() external payable returns (uint256 requestId) {
        bytes memory payload = abi.encodeWithSelector(
            IJsonApiAgent.fetchUint.selector,
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
            "bitcoin.usd",
            uint8(8)
        );
        uint256 deposit = platform.getRequestDeposit() + PRICE_PER_AGENT * SUBCOMMITTEE_SIZE;
        require(msg.value >= deposit, "Underfunded");
        requestId = platform.createRequest{value: deposit}(
            JSON_API_AGENT_ID, address(this), this.handleResponse.selector, payload
        );
        pendingRequests[requestId] = true;
    }

    function handleResponse(
        uint256 requestId, Response[] memory responses,
        ResponseStatus status, Request memory /* details */
    ) external override {
        require(msg.sender == address(platform), "Only platform");
        require(pendingRequests[requestId], "Unknown request");
        delete pendingRequests[requestId];
        if (status == ResponseStatus.Success && responses.length > 0) {
            latestPrice = abi.decode(responses[0].result, (uint256));
            emit PriceReceived(requestId, latestPrice);
        }
    }

    receive() external payable {}
}
```
Deploy pointing at the testnet platform address `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`,
fund with STT, call `requestBitcoinPrice()` with at least 0.12 STT attached. Callback fires
within seconds.

### Four tips that save hours
1. **Send the right deposit.** `getRequestDeposit()` returns the operations-reserve FLOOR, not
   the practical deposit. Sending only the floor sets per-agent budget to zero → runners skip
   the request → timeout. Always add `pricePerAgent × subcommitteeSize`:
   `msg.value ≥ getRequestDeposit() + pricePerAgent × subcommitteeSize`.
   JSON API with default subcommittee 3: `0.03 + 0.03 × 3 = 0.12 STT`.
2. **Implement `receive() external payable`.** Rebates are pushed on finalisation; without it the
   transfer fails silently and funds stick in the platform.
3. **Gate your callback.** `handleResponse` is external — anyone can call it. Always:
   `require(msg.sender == address(platform))` and `require(pendingRequests[requestId])`.
4. **Handle every status.** A request ends in Success, Failed, or TimedOut. Decoding
   `responses[0].result` on a non-Success callback panics. Check status, then decode.

### Five use cases that only work on an Agentic L1 (each needs data + reasoning + on-chain action)
1. **AI-resolved prediction markets** — LLM Parse Website reads a news/results page and resolves
   a market in one tx. No human resolvers/multisig oracle. Receipts give an auditable trail.
2. **Autonomous content moderation** — LLM Inference (`inferString` with
   `allowedValues = ["safe","unsafe"]`) classifies every post on submission; unsafe posts revert.
3. **Self-updating dynamic NFTs** — metadata responds to real-world data; JSON API fetches,
   LLM Inference interprets into a trait/rarity update; every change on-chain and verifiable.
   **(← Soulprint is exactly this canonical use case.)**
4. **Agentic DeFi bots** — `inferToolsChat` given a budget + goal ("rebalance above 1.5x, swap to
   USDC if ETH < $X"); model decides which DEX to call and yields calldata back; contract executes.
5. **Cross-site data aggregators** — pull reviews from multiple sources via Parse Website, score
   sentiment via LLM Inference, publish an aggregate. Everything verifiable, on-chain.

### Getting started links
- Somnia Agents docs: https://docs.somnia.network/agents
- Testnet Agent Explorer (browse agents + generate Solidity/TS snippets):
  https://agents.testnet.somnia.network/
- Tip: show up with a tiny end-to-end demo working (one request, one callback, one state update),
  then iterate on product logic instead of debugging setup.

### A2. Addendum from the live docs overview page (checked 2026-05-20, https://docs.somnia.network/agents)
The high-level overview confirms our numbers (platform testnet `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`,
mainnet `0x5E5205CF39E766118C01636bED000A54D93163E6`; JSON API 0.03 / LLM 0.07 / Parse Website 0.10
per validator) and adds these previously-uncaptured facts:

- **Roadmap — Phase 1 (current)** lists FIVE curated core agents, not three. Beyond the three we
  use (JSON API, LLM Inference, LLM Parse Website) there are also **Idempotent Request** and
  **Find URL for Topic**. (Docs don't yet publish numeric agentIds/prices for those two; the page
  also uses string aliases `json-fetch` / `llm-inference` / `llm-parse-website` for the three.)
- **Roadmap — Phase 2 (2026):** **Custom User-Defined Agents**, a **Full Agent SDK**, and
  **Advanced Tooling**. (i.e. only the curated set exists today; you can't define your own agent yet.)
- **Use-case categories (official framing):** Oracles · AI Services (explicitly names "Dynamic NFT
  descriptions" — Soulprint's lane) · **Outbound Communication** (webhook triggers from contracts,
  notifications to external systems, off-chain workflow initiation, DB sync — a NEW outbound
  direction vs. the inbound data/inference we use) · Data Processing.
- **Receipts:** a signed manifest of intermediate computation steps (like a CI build log).
  Validators reach consensus on the FINAL result only; receipt steps are subjective (what one node
  did), so don't treat intermediate steps as consensus-verified.
- **Payment split (confirms our deposit model):** the deposit is split into an **operations
  reserve** (runner gas refunds + callback gas + keeper payments) and an **agent reward pot**
  (split equally among subcommittee members; remainder rebated to the requester → hence the
  required `receive()`).

---

## B. Verified interface (in repo at contracts/interfaces/ISomniaAgents.sol)

Structs/enums: `ConsensusType {Majority, Threshold}`,
`ResponseStatus {None, Pending, Success, Failed, TimedOut}`, `Response`, `Request`.
`IAgentRequester`: `createRequest(agentId, callbackAddress, callbackSelector, payload) payable
returns (requestId)`, `getRequestDeposit() view`. (Also `createAdvancedRequest(... subcommitteeSize,
threshold, consensusType, timeout)` exists on the real platform.)
Agent payload interfaces: `IJsonApiAgent.{fetchString, fetchUint, fetchInt, fetchBool,
fetchStringArray, fetchUintArray}`; `ILLMAgent.{inferString, inferNumber, inferChat}` (+
`inferToolsChat` on platform); `IParseWebsiteAgent.{ExtractString, ExtractANumber}`.
Handler callback shape: `handleX(uint256 requestId, Response[] responses, ResponseStatus status,
Request details)`.

---

## C. Spike findings

### Explorer API (resolved 2026-05-20) — Blockscout v2, used by the JSON API agent
- Balance: `GET https://shannon-explorer.somnia.network/api/v2/addresses/{addr}` → `coin_balance`
  (wei string; use `fetchUint` with decimals=18). Also returns `is_contract`,
  `has_token_transfers`, `has_tokens`, `creation_transaction_hash`.
- Activity: `GET https://shannon-explorer.somnia.network/api/v2/addresses/{addr}/counters` →
  `transactions_count`, `token_transfers_count`, `gas_usage_count` (string numbers; `fetchUint`
  decimals=0).
- Fresh addresses can lag indexing (a brand-new wallet may show 0 txs briefly).
- socialscan.io alt explorer was unreachable from the build env; use shannon-explorer.

### Reactivity API (resolved 2026-05-20) — for the Cron self-evolution
- Package: `@somnia-chain/reactivity-contracts`.
- Base: `SomniaEventHandler`; override `_onEvent(address emitter, bytes32[] eventTopics, bytes data)`.
- Imports: `SomniaEventHandler.sol`, `interfaces/ISomniaReactivityPrecompile.sol`,
  `interfaces/SomniaExtensions.sol`.
- Precompile: `0x0100` (`SomniaExtensions.SOMNIA_REACTIVITY_PRECOMPILE_ADDRESS`).
- **Min balance 32 SOMI/STT** to CREATE a subscription (checked at creation; not escrowed/consumed).
- Scheduled (one-shot; self-reschedule inside the handler for recurrence — SomMemo pattern):
  `scheduleSubscriptionAtTimestamp(handler, timestampMillis, options)`,
  `scheduleSubscriptionAtBlock(handler, blockNumber, options)`,
  `scheduleSubscriptionAtEpoch(handler, epochNumber, options)`, `unsubscribe(subscriptionId)`,
  `getSubscriptionInfo(subscriptionId)`, `subscribe(handler, filter, options)`.
- `SubscriptionFilter { bytes32[4] eventTopics; address origin; address emitter; }`
  `SubscriptionOptions { uint64 priorityFeePerGas; uint64 maxFeePerGas; uint64 gasLimit; }`
- Callback: `onEvent(address emitter, bytes32[] eventTopics, bytes data)`; inside it
  `msg.sender == 0x0100` and `tx.origin == subscription owner`.

---

## D. Somnia gas differences from Ethereum (research)

Somnia raises costs for un-optimized ops (budget rechecks needed for crypto-/deploy-heavy code):
- `ecRecover` ~150,000 gas (vs 3,000 — 50x). `KECCAK256` 1,250 + 300×words (vs 30 + 6×words).
- Contract deployment **3,125 gas/byte** (vs 200 — ~15x). LOG opcodes 8–13x higher.
- Storage is cache-tiered (hot slots cheap, cold reads/writes 1M+ gas); non-existent account
  creation ~400K gas. Use Foundry/Hardhat with a high gas multiplier for deploys
  (`--gas-estimate-multiplier 2000` in Foundry).
- Source: https://docs.somnia.network/developer/deployment-and-production/somnia-gas-differences-to-ethereum

---

## E. Network info & key contracts

- Testnet (Shannon): chainId **50312** (hex 0xc488), RPC
  `https://api.infra.testnet.somnia.network` (WS `.../ws`), explorer
  `https://shannon-explorer.somnia.network/`, token **STT**.
- Mainnet: chainId **5031**, RPC `https://api.infra.mainnet.somnia.network`, explorer
  `https://explorer.somnia.network`, token **SOMI**.
- Agents platform (testnet): `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`
  (mainnet `0x5E5205CF39E766118C01636bED000A54D93163E6`).
- MultiCallV3 (testnet): `0x841b8199E6d3Db3C6f264f6C2bd8848b3cA64223`.
- AA: ERC-4337 supported; testnet EntryPoint v0.7 `0x0000000071727De22E5E9d8BAf0edAc6f37da032`,
  Factory `0x4be0ddfebca9a5a4a617dee4dece99e7c862dceb`. Session keys via
  `somnia_getSessionAddress`/`somnia_sendSessionTransaction`. EIP-7702 supported (Ingot fork,
  Apr 15 2026). Blob tx (EIP-4844) NOT supported. `eth_getLogs` block range max 1000.
- Faucets: https://testnet.somnia.network/ ,
  https://cloud.google.com/application/web3/faucet/somnia/shannon , stakely, thirdweb. Larger
  amounts: Somnia Discord `#dev-chat` (ping @emreyeth) / developers@somnia.foundation.

---

## F. Reference repos / sources

- `Kali-Decoder/Somnia-Agentic-examples` (GitHub) — 5 working agent contract templates
  (PriceOracle, SentimentAnalyzer, WebDataExtractor, IdeaReview, DaoProposalReview); our
  ISomniaAgents + callback pattern came from here.
- `emrestay/somnia-agents-skills` — Claude Code skill plugin with canonical IAgentRequester
  interface + invoke scripts.
- `0xpochita/SomMemo` — cron one-shot self-rescheduling pattern (dead-man's switch).
- `local-optimum/reactive-stt-faucet` — best teaching example for Reactivity + gas tuning.
- LLM-friendly docs corpus: https://docs.somnia.network/llms-full.txt (NOTE: this file only has
  RPC/network docs — Agents/Reactivity/Data Streams details are on their own doc subpages, not in
  llms-full.txt).
- Existing ecosystem an agent could compose with: DreamDEX (CLOB), Standard (perps), DIA &
  Protofire oracles (Protofire VRF), SOM0 NFT marketplace, Data Streams publishers.

---

## G. Idea-collision notes (avoid duplicating prior hackathon winners)

- "Smart will / dead-man's switch" already shipped & won (SomMemo). "Goal-stakes" parallel build
  (Stakeword on Arc). "AI vs AI battle arena" already shipped (Pantheon Arena) — expect copies.
- Most "AI on Somnia" projects call Gemini/Groq OFF-CHAIN and only settle on-chain. Using NATIVE
  on-chain inference (`inferString`/`inferToolsChat`) with consensus is the rare differentiator —
  Soulprint does this.
