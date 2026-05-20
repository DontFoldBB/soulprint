# PERSONA MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployed Somnia-testnet dApp where a user pastes a wallet address, an on-chain agent pipeline (JSON API + LLM Inference) generates a witty "personality dossier", and the user mints it as a soulbound NFT whose `tokenURI` always reflects the latest dossier.

**Architecture:** A single Solidity contract (`Persona`) invokes Somnia Agents asynchronously: `read()` fires a JSON API request for wallet stats; its callback fires an LLM Inference request for the dossier; that callback stores the text and mints/updates a soulbound (ERC-5192) NFT. Contract logic is unit-tested in Foundry against a `MockAgentPlatform` that synchronously invokes callbacks, so the full async flow is testable offline. A Next.js + viem frontend drives the read→loader→card→mint flow.

**Tech Stack:** Hardhat (Solidity 0.8.24, `viaIR: true`) + `@nomicfoundation/hardhat-toolbox-viem`, OpenZeppelin (ERC-721), ERC-5192 soulbound, Somnia Agents platform `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`; Next.js (App Router) + viem; Somnia Shannon testnet (chain ID 50312).

> **Toolchain note (2026-05-20):** The spec/plan originally specified Foundry for tighter TDD, but Foundry is not installed and its `curl | bash` installer is blocked in this environment. Pivoted to **Hardhat**, which runs on the already-present Node/npm and matches our reference repo (Kali-Decoder). The Solidity contract code in every task below is unchanged; the test files become TypeScript (Hardhat + viem) and deployment uses a TS script instead of `forge script`. Test logic is identical: deploy `MockAgentPlatform` + `Persona`, call `read()`, then call `platform.deliver()` to simulate agent callbacks, and assert state.

**Scope:** This plan is the MVP foundation only. Cron-Reactivity evolution, the Data Streams gallery, and rarity rewards are deferred to a follow-up plan written after this foundation is deployed and working.

---

## File Structure

```
somnia_hackaton/
├── foundry.toml
├── .env                              # PRIVATE_KEY, RPC (gitignored)
├── .env.example
├── .gitignore
├── remappings.txt
├── lib/                              # forge deps (openzeppelin, forge-std)
├── src/
│   ├── interfaces/ISomniaAgents.sol  # platform + agent interfaces, structs, enums
│   └── Persona.sol                   # main contract
├── test/
│   ├── mocks/MockAgentPlatform.sol   # synchronous stand-in for the platform
│   └── Persona.t.sol                 # unit tests
├── script/
│   └── Deploy.s.sol                  # deploy to Somnia testnet
├── scripts/
│   └── checkExplorerApi.mjs          # day-1 spike (off-chain)
├── web/                              # Next.js frontend
│   ├── app/page.tsx                  # read + mint
│   ├── app/my-persona/page.tsx       # view minted persona
│   ├── lib/chain.ts                  # viem Somnia chain
│   ├── lib/persona.ts                # contract address + ABI + parse helper
│   └── components/DossierCard.tsx
└── docs/
```

Responsibilities:
- `ISomniaAgents.sol` — all shared types so both `Persona` and the mock import one source of truth.
- `Persona.sol` — read pipeline, NFT mechanics, soulbound, dedup, refund, dynamic tokenURI.
- `MockAgentPlatform.sol` — lets tests drive `createRequest`→callback synchronously.
- Frontend `lib/*` — isolate chain + contract wiring from UI components.

---

## Task 0: Initialize repo and Foundry project

**Files:**
- Create: `foundry.toml`, `.gitignore`, `.env.example`, `remappings.txt`

- [ ] **Step 1: Init git and Foundry**

Run:
```bash
cd F:/pet_projects/somnia_hackaton
git init
forge init --no-commit --force .
```
Expected: `lib/forge-std` appears, `src/`, `test/`, `script/` created. (`--force` because `docs/` already exists.)

- [ ] **Step 2: Install OpenZeppelin**

Run:
```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```
Expected: `lib/openzeppelin-contracts` appears.

- [ ] **Step 3: Write `foundry.toml`**

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
via_ir = true
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
somnia = "https://api.infra.testnet.somnia.network"
```

- [ ] **Step 4: Write `remappings.txt`**

```
@openzeppelin/=lib/openzeppelin-contracts/
forge-std/=lib/forge-std/src/
```

- [ ] **Step 5: Write `.gitignore`**

```
out/
cache/
.env
web/node_modules/
web/.next/
broadcast/
```

- [ ] **Step 6: Write `.env.example`**

```
PRIVATE_KEY=0xyour_test_key_here
SOMNIA_RPC=https://api.infra.testnet.somnia.network
```

- [ ] **Step 7: Remove Foundry sample files**

Run:
```bash
rm src/Counter.sol test/Counter.t.sol script/Counter.s.sol
```
Expected: no leftover Counter files.

- [ ] **Step 8: Verify build**

Run: `forge build`
Expected: compiles with no errors (no contracts yet besides libs).

- [ ] **Step 9: Commit**

```bash
git add foundry.toml remappings.txt .gitignore .env.example .gitmodules lib docs
git commit -m "chore: init foundry project with openzeppelin"
```

---

## Task 1: Day-1 spike — confirm the Shannon explorer REST API

**Goal:** Resolve Risk #1 from the spec. Determine the exact URL + JSON path the JSON API agent will call, and how many fields come back in one response. This is off-chain reconnaissance; no contract code.

**Files:**
- Create: `scripts/checkExplorerApi.mjs`

- [ ] **Step 1: Write the probe script**

```js
// scripts/checkExplorerApi.mjs
// Usage: node scripts/checkExplorerApi.mjs 0xSomeWalletAddress
const addr = process.argv[2];
if (!addr) { console.error("pass an address"); process.exit(1); }

const bases = [
  `https://shannon-explorer.somnia.network/api/v2/addresses/${addr}`,
  `https://shannon-explorer.somnia.network/api/v2/addresses/${addr}/counters`,
  `https://somnia-testnet.socialscan.io/api/v2/addresses/${addr}`,
];

for (const url of bases) {
  try {
    const res = await fetch(url);
    console.log("\n=== ", url, " -> ", res.status);
    const text = await res.text();
    console.log(text.slice(0, 1200));
  } catch (e) {
    console.log("\n=== ", url, " -> ERROR", e.message);
  }
}
```

- [ ] **Step 2: Run it against a known active wallet**

Run: `node scripts/checkExplorerApi.mjs 0x0000000000000000000000000000000000000000`
Then run it again with your own funded testnet wallet address.
Expected: at least one endpoint returns 200 with JSON containing fields like `coin_balance`, `transactions_count` (or `transactions_count` under `/counters`).

- [ ] **Step 3: Record findings in the plan**

Edit this task's notes below with: the working base URL, and the exact JSON selector paths for (a) native balance, (b) transaction count. If NO endpoint works, set `USE_PARSE_WEBSITE = true` and note it — later tasks branch on this.

```
FINDINGS (resolved 2026-05-20):
- working endpoint (balance): https://shannon-explorer.somnia.network/api/v2/addresses/{addr}
- balance selector: "coin_balance" (string, wei; use fetchUint with decimals=18)
- working endpoint (activity): https://shannon-explorer.somnia.network/api/v2/addresses/{addr}/counters
- tx count selector: "transactions_count" (string number; fetchUint decimals=0)
- also available: token_transfers_count, gas_usage_count, is_contract
- fallback to Parse Website? NO — JSON API works cleanly (Blockscout v2 API)
- MVP decision: start with ONE JSON API call to /counters for transactions_count
  (richest single personality signal). Enrich with coin_balance as a fast-follow.
```

- [ ] **Step 4: Commit the spike script**

```bash
git add scripts/checkExplorerApi.mjs
git commit -m "chore: explorer API spike script + findings"
```

---

## Task 2: Somnia Agents interface

**Files:**
- Create: `src/interfaces/ISomniaAgents.sol`

This is the canonical interface (verified against deployed Somnia example contracts). Both `Persona` and the test mock import it.

- [ ] **Step 1: Write the interface file**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

enum ConsensusType { Majority, Threshold }

enum ResponseStatus { None, Pending, Success, Failed, TimedOut }

struct Response {
    address validator;
    bytes result;
    ResponseStatus status;
    uint256 receipt;
    uint256 timestamp;
    uint256 executionCost;
}

struct Request {
    uint256 id;
    address requester;
    address callbackAddress;
    bytes4 callbackSelector;
    address[] subcommittee;
    Response[] responses;
    uint256 responseCount;
    uint256 failureCount;
    uint256 threshold;
    uint256 createdAt;
    uint256 deadline;
    ResponseStatus status;
    ConsensusType consensusType;
    uint256 remainingBudget;
}

interface IAgentRequester {
    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId);

    function getRequestDeposit() external view returns (uint256);
}

// Payload-encoding interfaces (used only with abi.encodeWithSelector).
interface IJsonApiAgent {
    function fetchString(string calldata url, string calldata selector) external returns (string memory);
    function fetchUint(string calldata url, string calldata selector, uint8 decimals) external returns (uint256);
}

interface ILLMAgent {
    function inferString(
        string calldata prompt,
        string calldata system,
        bool chainOfThought,
        string[] calldata allowedValues
    ) external returns (string memory);
}
```

- [ ] **Step 2: Build**

Run: `forge build`
Expected: compiles, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/interfaces/ISomniaAgents.sol
git commit -m "feat: add Somnia Agents platform interface"
```

---

## Task 3: MockAgentPlatform for tests

**Files:**
- Create: `test/mocks/MockAgentPlatform.sol`

The mock records the requested payload + callback, and exposes a helper that lets a test deliver a `Success` (or `Failed`) response by calling the requester's callback selector exactly as the real platform would.

- [ ] **Step 1: Write the mock**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAgentRequester, Response, Request, ResponseStatus} from "../../src/interfaces/ISomniaAgents.sol";

contract MockAgentPlatform is IAgentRequester {
    uint256 public nextId = 1;

    struct Pending {
        address callbackAddress;
        bytes4 callbackSelector;
        uint256 agentId;
        bytes payload;
        bool exists;
    }

    mapping(uint256 => Pending) public pending;

    function getRequestDeposit() external pure returns (uint256) {
        return 0.03 ether;
    }

    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId) {
        requestId = nextId++;
        pending[requestId] = Pending(callbackAddress, callbackSelector, agentId, payload, true);
    }

    // Test helper: deliver a successful string/uint result encoded as `result`.
    function deliver(uint256 requestId, bytes memory result, ResponseStatus status) external {
        Pending memory p = pending[requestId];
        require(p.exists, "no request");

        Response[] memory responses = new Response[](1);
        responses[0] = Response(address(this), result, status, 0, block.timestamp, 0);

        Request memory req;
        req.id = requestId;
        req.status = status;

        (bool ok, ) = p.callbackAddress.call(
            abi.encodeWithSelector(p.callbackSelector, requestId, responses, status, req)
        );
        require(ok, "callback reverted");
    }
}
```

- [ ] **Step 2: Build**

Run: `forge build`
Expected: compiles.

- [ ] **Step 3: Commit**

```bash
git add test/mocks/MockAgentPlatform.sol
git commit -m "test: add mock agent platform"
```

---

## Task 4: Persona skeleton — `read()` dispatches a stats request

**Files:**
- Create: `src/Persona.sol`
- Create: `test/Persona.t.sol`

- [ ] **Step 1: Write the failing test**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Persona} from "../src/Persona.sol";
import {MockAgentPlatform} from "./mocks/MockAgentPlatform.sol";

contract PersonaTest is Test {
    Persona persona;
    MockAgentPlatform platform;
    address user = address(0xBEEF);

    function setUp() public {
        platform = new MockAgentPlatform();
        persona = new Persona(address(platform));
        vm.deal(user, 100 ether);
        vm.deal(address(persona), 100 ether); // seed reserve
    }

    function test_read_createsStatsRequest() public {
        vm.prank(user);
        persona.read{value: 1 ether}(user);
        // a request must now be pending in the platform
        (, , uint256 agentId, , bool exists) = platform.pending(1);
        assertTrue(exists);
        assertEq(agentId, persona.JSON_API_AGENT_ID());
    }

    function test_read_rejectsUnderpayment() public {
        vm.prank(user);
        vm.expectRevert();
        persona.read{value: 0.1 ether}(user);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --match-contract PersonaTest -vv`
Expected: FAIL — `Persona` does not compile/exist yet.

- [ ] **Step 3: Write minimal `Persona.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    IAgentRequester, IJsonApiAgent, ILLMAgent,
    Response, Request, ResponseStatus
} from "./interfaces/ISomniaAgents.sol";

contract Persona is ERC721 {
    IAgentRequester public immutable platform;

    uint256 public constant JSON_API_AGENT_ID = 13174292974160097713;
    uint256 public constant LLM_AGENT_ID = 12847293847561029384;
    uint256 public constant SUBCOMMITTEE = 3;
    uint256 public constant JSON_PRICE_PER_AGENT = 0.03 ether;
    uint256 public constant LLM_PRICE_PER_AGENT = 0.07 ether;
    uint256 public constant MINT_PRICE = 1 ether;

    enum Stage { None, Stats, Dossier }

    struct Ctx {
        address wallet;
        Stage stage;
        bool active;
    }

    mapping(uint256 => Ctx) internal requests; // agent requestId -> ctx

    constructor(address platform_) ERC721("Persona", "PERSONA") {
        platform = IAgentRequester(platform_);
    }

    function read(address wallet) external payable {
        require(msg.value >= MINT_PRICE, "underpaid");
        _requestStats(wallet);
    }

    function _requestStats(address wallet) internal {
        string memory url = _explorerUrl(wallet);
        bytes memory payload = abi.encodeWithSelector(
            IJsonApiAgent.fetchString.selector, url, "coin_balance"
        );
        uint256 deposit = platform.getRequestDeposit() + JSON_PRICE_PER_AGENT * SUBCOMMITTEE;
        uint256 id = platform.createRequest{value: deposit}(
            JSON_API_AGENT_ID, address(this), this.handleStats.selector, payload
        );
        requests[id] = Ctx(wallet, Stage.Stats, true);
    }

    function handleStats(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "only platform");
        require(requests[requestId].active, "unknown request");
        // implemented in Task 5
    }

    function _explorerUrl(address wallet) internal pure returns (string memory) {
        return string.concat(
            "https://shannon-explorer.somnia.network/api/v2/addresses/",
            _toHexString(wallet)
        );
    }

    function _toHexString(address a) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes20 b = bytes20(a);
        bytes memory out = new bytes(42);
        out[0] = "0"; out[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            out[2 + i * 2] = alphabet[uint8(b[i] >> 4)];
            out[3 + i * 2] = alphabet[uint8(b[i] & 0x0f)];
        }
        return string(out);
    }

    receive() external payable {}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `forge test --match-contract PersonaTest -vv`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Persona.sol test/Persona.t.sol
git commit -m "feat: persona read() dispatches stats request"
```

---

## Task 5: `handleStats` dispatches the LLM dossier request

**Files:**
- Modify: `src/Persona.sol`
- Modify: `test/Persona.t.sol`

- [ ] **Step 1: Write the failing test**

Add to `PersonaTest`:
```solidity
function test_handleStats_createsLlmRequest() public {
    vm.prank(user);
    persona.read{value: 1 ether}(user);

    // deliver stats result (a balance string)
    platform.deliver(1, abi.encode("12.4"), ResponseStatus.Success);

    // a second (LLM) request must now be pending
    (, , uint256 agentId, , bool exists) = platform.pending(2);
    assertTrue(exists);
    assertEq(agentId, persona.LLM_AGENT_ID());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --match-test test_handleStats_createsLlmRequest -vv`
Expected: FAIL — no second request created.

- [ ] **Step 3: Implement `handleStats` body + `_requestDossier`**

Replace the `handleStats` body and add `_requestDossier`:
```solidity
    function handleStats(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "only platform");
        Ctx memory ctx = requests[requestId];
        require(ctx.active, "unknown request");
        delete requests[requestId];

        if (status != ResponseStatus.Success || responses.length == 0) {
            emit ReadFailed(ctx.wallet, "stats");
            return;
        }
        string memory stats = abi.decode(responses[0].result, (string));
        _requestDossier(ctx.wallet, stats);
    }

    function _requestDossier(address wallet, string memory stats) internal {
        string memory sys =
            "You are PERSONA, a witty on-chain analyst. Be clever and a little roasty, "
            "but never hateful: no slurs, never target real-world identity, religion, or "
            "ethnicity. Roast on-chain behavior only. Output EXACTLY the template. One line per field.";
        string memory prompt = string.concat(
            "Wallet: ", _toHexString(wallet),
            "\nOn-chain stats (Somnia Shannon testnet): ", stats,
            "\n\nWrite the dossier in EXACTLY this format:\n"
            "TYPE: <archetype>, Type <I-V>\n"
            "STRENGTH: <one line>\n"
            "WEAKNESS: <one line>\n"
            "STYLE: \"<short quote>\"\n"
            "KARMA: <signed number>\n"
            "NOTES: <1-2 witty sentences>\n"
            "RARITY: <1-5>"
        );
        string[] memory none = new string[](0);
        bytes memory payload = abi.encodeWithSelector(
            ILLMAgent.inferString.selector, prompt, sys, false, none
        );
        uint256 deposit = platform.getRequestDeposit() + LLM_PRICE_PER_AGENT * SUBCOMMITTEE;
        uint256 id = platform.createRequest{value: deposit}(
            LLM_AGENT_ID, address(this), this.handleDossier.selector, payload
        );
        requests[id] = Ctx(wallet, Stage.Dossier, true);
    }

    function handleDossier(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "only platform");
        require(requests[requestId].active, "unknown request");
        // implemented in Task 6
    }
```

Add events near the top of the contract body:
```solidity
    event ReadFailed(address indexed wallet, string stage);
    event PersonaMinted(address indexed wallet, uint256 indexed tokenId);
    event DossierUpdated(uint256 indexed tokenId, uint256 generation);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `forge test --match-contract PersonaTest -vv`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Persona.sol test/Persona.t.sol
git commit -m "feat: handleStats triggers LLM dossier request"
```

---

## Task 6: `handleDossier` stores text and mints the NFT

**Files:**
- Modify: `src/Persona.sol`
- Modify: `test/Persona.t.sol`

- [ ] **Step 1: Write the failing test**

Add to `PersonaTest`:
```solidity
string constant SAMPLE_DOSSIER =
    "TYPE: Testnet Drifter, Type II\nSTRENGTH: Relentless\nWEAKNESS: Spreads thin\n"
    "STYLE: \"one more dApp\"\nKARMA: +7\nNOTES: early explorer energy\nRARITY: 3";

function test_handleDossier_mintsAndStores() public {
    vm.prank(user);
    persona.read{value: 1 ether}(user);
    platform.deliver(1, abi.encode("12.4"), ResponseStatus.Success);   // stats
    platform.deliver(2, abi.encode(SAMPLE_DOSSIER), ResponseStatus.Success); // dossier

    uint256 tokenId = persona.personaOf(user);
    assertGt(tokenId, 0);
    assertEq(persona.ownerOf(tokenId), user);
    assertEq(persona.dossier(tokenId), SAMPLE_DOSSIER);
    assertEq(persona.generation(tokenId), 1);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --match-test test_handleDossier_mintsAndStores -vv`
Expected: FAIL — `personaOf`/`dossier`/`generation` don't exist.

- [ ] **Step 3: Add state and implement `handleDossier`**

Add state near other mappings:
```solidity
    mapping(address => uint256) public personaOf;
    mapping(uint256 => string)  public dossier;
    mapping(uint256 => uint256) public generation;
    mapping(uint256 => uint256) public lastUpdated;
    uint256 public totalPersonas;
    address[] public registeredWallets;
```

Implement the callback:
```solidity
    function handleDossier(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "only platform");
        Ctx memory ctx = requests[requestId];
        require(ctx.active, "unknown request");
        delete requests[requestId];

        if (status != ResponseStatus.Success || responses.length == 0) {
            emit ReadFailed(ctx.wallet, "dossier");
            return;
        }
        string memory text = abi.decode(responses[0].result, (string));

        uint256 tokenId = personaOf[ctx.wallet];
        if (tokenId == 0) {
            tokenId = ++totalPersonas;
            personaOf[ctx.wallet] = tokenId;
            registeredWallets.push(ctx.wallet);
            _safeMint(ctx.wallet, tokenId);
            emit PersonaMinted(ctx.wallet, tokenId);
        }
        dossier[tokenId] = text;
        generation[tokenId] += 1;
        lastUpdated[tokenId] = block.timestamp;
        emit DossierUpdated(tokenId, generation[tokenId]);
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `forge test --match-contract PersonaTest -vv`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Persona.sol test/Persona.t.sol
git commit -m "feat: handleDossier mints soulbound NFT and stores dossier"
```

---

## Task 7: Soulbound (ERC-5192) — transfers revert

**Files:**
- Modify: `src/Persona.sol`
- Modify: `test/Persona.t.sol`

- [ ] **Step 1: Write the failing test**

Add to `PersonaTest`:
```solidity
function test_soulbound_transferReverts() public {
    vm.prank(user);
    persona.read{value: 1 ether}(user);
    platform.deliver(1, abi.encode("12.4"), ResponseStatus.Success);
    platform.deliver(2, abi.encode(SAMPLE_DOSSIER), ResponseStatus.Success);
    uint256 tokenId = persona.personaOf(user);

    vm.prank(user);
    vm.expectRevert(bytes("soulbound"));
    persona.transferFrom(user, address(0xCAFE), tokenId);
}

function test_locked_returnsTrue() public {
    vm.prank(user);
    persona.read{value: 1 ether}(user);
    platform.deliver(1, abi.encode("12.4"), ResponseStatus.Success);
    platform.deliver(2, abi.encode(SAMPLE_DOSSIER), ResponseStatus.Success);
    assertTrue(persona.locked(persona.personaOf(user)));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --match-test test_soulbound_transferReverts -vv`
Expected: FAIL — transfer succeeds / `locked` missing.

- [ ] **Step 3: Override transfer hook and add `locked`**

Add inside the contract (OpenZeppelin v5 uses `_update`):
```solidity
    // ERC-5192 minimal soulbound
    event Locked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // allow mint (from == 0) and burn (to == 0); block wallet-to-wallet transfer
        if (from != address(0) && to != address(0)) revert("soulbound");
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0xb45a3c0e /* ERC-5192 */ || super.supportsInterface(interfaceId);
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `forge test --match-contract PersonaTest -vv`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Persona.sol test/Persona.t.sol
git commit -m "feat: make persona NFT soulbound (ERC-5192)"
```

---

## Task 8: One-per-wallet dedup

**Files:**
- Modify: `src/Persona.sol`
- Modify: `test/Persona.t.sol`

- [ ] **Step 1: Write the failing test**

```solidity
function test_read_secondTimeReverts() public {
    vm.startPrank(user);
    persona.read{value: 1 ether}(user);
    platform.deliver(1, abi.encode("12.4"), ResponseStatus.Success);
    platform.deliver(2, abi.encode(SAMPLE_DOSSIER), ResponseStatus.Success);

    vm.expectRevert(bytes("already read"));
    persona.read{value: 1 ether}(user);
    vm.stopPrank();
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --match-test test_read_secondTimeReverts -vv`
Expected: FAIL — second read allowed.

- [ ] **Step 3: Add the guard to `read`**

```solidity
    function read(address wallet) external payable {
        require(msg.value >= MINT_PRICE, "underpaid");
        require(personaOf[wallet] == 0, "already read");
        _requestStats(wallet);
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `forge test --match-contract PersonaTest -vv`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Persona.sol test/Persona.t.sol
git commit -m "feat: one persona per wallet"
```

---

## Task 9: Dynamic `tokenURI`

**Files:**
- Modify: `src/Persona.sol`
- Modify: `test/Persona.t.sol`

- [ ] **Step 1: Write the failing test**

```solidity
function test_tokenURI_isDataJsonWithDossier() public {
    vm.prank(user);
    persona.read{value: 1 ether}(user);
    platform.deliver(1, abi.encode("12.4"), ResponseStatus.Success);
    platform.deliver(2, abi.encode(SAMPLE_DOSSIER), ResponseStatus.Success);

    string memory uri = persona.tokenURI(persona.personaOf(user));
    // must be a data URI
    assertEq(_startsWith(uri, "data:application/json;base64,"), true);
}

function _startsWith(string memory s, string memory prefix) internal pure returns (bool) {
    bytes memory sb = bytes(s);
    bytes memory pb = bytes(prefix);
    if (sb.length < pb.length) return false;
    for (uint256 i = 0; i < pb.length; i++) if (sb[i] != pb[i]) return false;
    return true;
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --match-test test_tokenURI_isDataJsonWithDossier -vv`
Expected: FAIL — default ERC721 tokenURI is empty.

- [ ] **Step 3: Implement `tokenURI` using OZ Base64/Strings**

Add imports at top:
```solidity
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
```
Add the override:
```solidity
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory json = string.concat(
            '{"name":"Persona #', Strings.toString(tokenId),
            '","description":"On-chain personality dossier, generation ',
            Strings.toString(generation[tokenId]),
            '","attributes":[{"trait_type":"Generation","value":',
            Strings.toString(generation[tokenId]),
            '}],"dossier":', _jsonString(dossier[tokenId]), '}'
        );
        return string.concat(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        );
    }

    // minimal JSON string escaper (quotes + backslashes + newlines)
    function _jsonString(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory out = abi.encodePacked('"');
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == '"') out = abi.encodePacked(out, '\\"');
            else if (c == "\\") out = abi.encodePacked(out, "\\\\");
            else if (c == "\n") out = abi.encodePacked(out, "\\n");
            else out = abi.encodePacked(out, c);
        }
        return string(abi.encodePacked(out, '"'));
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `forge test --match-contract PersonaTest -vv`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Persona.sol test/Persona.t.sol
git commit -m "feat: dynamic on-chain tokenURI reflecting latest dossier"
```

---

## Task 10: First-100 refund

**Files:**
- Modify: `src/Persona.sol`
- Modify: `test/Persona.t.sol`

- [ ] **Step 1: Write the failing test**

```solidity
function test_first100_refunded() public {
    uint256 balBefore = user.balance;
    vm.prank(user);
    persona.read{value: 1 ether}(user);
    platform.deliver(1, abi.encode("12.4"), ResponseStatus.Success);
    platform.deliver(2, abi.encode(SAMPLE_DOSSIER), ResponseStatus.Success);
    // user paid 1 ether but should have been refunded it on mint
    // net cost ~ only the agent deposits which came from contract reserve
    assertEq(user.balance, balBefore); // fully refunded the 1 ether mint
}
```

Note: agent deposits are paid from the contract's seeded reserve (set in `setUp` via `vm.deal(address(persona), 100 ether)`), so the user's only outflow is the 1 ether mint, which is refunded.

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --match-test test_first100_refunded -vv`
Expected: FAIL — no refund logic.

- [ ] **Step 3: Add refund counter + refund on first mint**

Add state:
```solidity
    uint256 public freeMintsRemaining = 100;
    mapping(address => uint256) public paidByWallet; // wallet -> mint amount escrowed
```
In `read`, record the escrow:
```solidity
    function read(address wallet) external payable {
        require(msg.value >= MINT_PRICE, "underpaid");
        require(personaOf[wallet] == 0, "already read");
        paidByWallet[wallet] = msg.value;
        _requestStats(wallet);
    }
```
In `handleDossier`, after a successful first mint, refund if eligible:
```solidity
        // inside the `if (tokenId == 0)` block, after emit PersonaMinted:
        uint256 paid = paidByWallet[ctx.wallet];
        delete paidByWallet[ctx.wallet];
        if (freeMintsRemaining > 0 && paid > 0) {
            freeMintsRemaining -= 1;
            (bool ok, ) = payable(ctx.wallet).call{value: paid}("");
            require(ok, "refund failed");
        }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `forge test --match-contract PersonaTest -vv`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Persona.sol test/Persona.t.sol
git commit -m "feat: refund first 100 minters"
```

---

## Task 11: `reread()` updates an existing dossier

**Files:**
- Modify: `src/Persona.sol`
- Modify: `test/Persona.t.sol`

- [ ] **Step 1: Write the failing test**

```solidity
function test_reread_updatesDossierAndGeneration() public {
    vm.prank(user);
    persona.read{value: 1 ether}(user);
    platform.deliver(1, abi.encode("12.4"), ResponseStatus.Success);
    platform.deliver(2, abi.encode(SAMPLE_DOSSIER), ResponseStatus.Success);
    uint256 tokenId = persona.personaOf(user);

    vm.prank(user);
    persona.reread(tokenId);
    // reread fires a new stats request (id 3)
    platform.deliver(3, abi.encode("50.0"), ResponseStatus.Success);
    platform.deliver(4, abi.encode("TYPE: Satori Holder, Type II\nRARITY: 4"), ResponseStatus.Success);

    assertEq(persona.generation(tokenId), 2);
    assertEq(persona.dossier(tokenId), "TYPE: Satori Holder, Type II\nRARITY: 4");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `forge test --match-test test_reread_updatesDossierAndGeneration -vv`
Expected: FAIL — `reread` missing.

- [ ] **Step 3: Implement `reread`**

```solidity
    function reread(uint256 tokenId) external {
        address owner = _requireOwned(tokenId);
        require(msg.sender == owner, "not owner");
        // reuse the same stats->dossier pipeline; deposits paid from reserve
        _requestStats(owner);
    }
```
Note: `_requestStats` already sets `Ctx(wallet, Stage.Stats, true)`; `handleDossier` already branches on `personaOf[wallet] != 0` to update rather than mint. No further change needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `forge test --match-contract PersonaTest -vv`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Persona.sol test/Persona.t.sol
git commit -m "feat: reread() refreshes an existing dossier"
```

---

## Task 12: Failure-path coverage

**Files:**
- Modify: `test/Persona.t.sol`

- [ ] **Step 1: Write failing tests for failure statuses**

```solidity
function test_statsFailure_emitsAndNoMint() public {
    vm.recordLogs();
    vm.prank(user);
    persona.read{value: 1 ether}(user);
    platform.deliver(1, abi.encode(""), ResponseStatus.Failed);
    assertEq(persona.personaOf(user), 0); // nothing minted
}

function test_dossierTimeout_noMint() public {
    vm.prank(user);
    persona.read{value: 1 ether}(user);
    platform.deliver(1, abi.encode("12.4"), ResponseStatus.Success);
    platform.deliver(2, abi.encode(""), ResponseStatus.TimedOut);
    assertEq(persona.personaOf(user), 0);
}
```

- [ ] **Step 2: Run tests**

Run: `forge test --match-contract PersonaTest -vv`
Expected: PASS (the status guards from Tasks 5 & 6 already handle this; these tests lock the behavior in).

- [ ] **Step 3: Commit**

```bash
git add test/Persona.t.sol
git commit -m "test: cover agent failure and timeout paths"
```

---

## Task 13: Deploy script + deploy to Somnia testnet

**Files:**
- Create: `script/Deploy.s.sol`

- [ ] **Step 1: Write the deploy script**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Persona} from "../src/Persona.sol";

contract Deploy is Script {
    address constant PLATFORM = 0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        Persona persona = new Persona(PLATFORM);
        // seed reserve so first reads (incl. agent deposits + refunds) are funded
        (bool ok, ) = address(persona).call{value: 5 ether}("");
        require(ok, "seed failed");
        console.log("Persona deployed at:", address(persona));
        vm.stopBroadcast();
    }
}
```

- [ ] **Step 2: Dry-run compile**

Run: `forge build`
Expected: compiles.

- [ ] **Step 3: Deploy to testnet**

Run:
```bash
forge script script/Deploy.s.sol:Deploy --rpc-url somnia --broadcast --gas-estimate-multiplier 2000
```
Expected: prints `Persona deployed at: 0x...`. Save that address.
Note: `--gas-estimate-multiplier 2000` accounts for Somnia's higher deploy gas (3,125 gas/byte).

- [ ] **Step 4: Smoke-test a real read on testnet**

Run (replace `<PERSONA>` and `<WALLET>`):
```bash
cast send <PERSONA> "read(address)" <WALLET> --value 1ether --rpc-url somnia --private-key $PRIVATE_KEY
```
Then wait ~30s and check:
```bash
cast call <PERSONA> "personaOf(address)(uint256)" <WALLET> --rpc-url somnia
```
Expected: returns a non-zero tokenId once both agent callbacks have fired. If it stays 0, inspect events with `cast logs` and revisit the explorer URL/selector from Task 1.

- [ ] **Step 5: Commit**

```bash
git add script/Deploy.s.sol
git commit -m "feat: deploy script for somnia testnet"
```

---

## Task 14: Frontend scaffold + chain/contract wiring

**Files:**
- Create: `web/` (Next.js app), `web/lib/chain.ts`, `web/lib/persona.ts`

- [ ] **Step 1: Scaffold Next.js**

Run:
```bash
cd web || (npx create-next-app@latest web --ts --app --tailwind --eslint --no-src-dir --use-npm --yes && cd web)
npm install viem
```
Expected: Next.js app in `web/`, viem installed.

- [ ] **Step 2: Write `web/lib/chain.ts`**

```ts
import { defineChain } from "viem";

export const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Shannon Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: ["https://api.infra.testnet.somnia.network"] } },
  blockExplorers: {
    default: { name: "Shannon", url: "https://shannon-explorer.somnia.network" },
  },
});
```

- [ ] **Step 3: Write `web/lib/persona.ts`**

```ts
export const PERSONA_ADDRESS = "0xPASTE_DEPLOYED_ADDRESS" as const;

// minimal ABI used by the frontend
export const PERSONA_ABI = [
  { type: "function", name: "read", stateMutability: "payable",
    inputs: [{ name: "wallet", type: "address" }], outputs: [] },
  { type: "function", name: "personaOf", stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "dossier", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }] },
  { type: "function", name: "generation", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "uint256" }] },
] as const;

export type Dossier = {
  type?: string; strength?: string; weakness?: string;
  style?: string; karma?: string; notes?: string; rarity?: string;
};

export function parseDossier(raw: string): Dossier {
  const out: Dossier = {};
  for (const line of raw.split("\n")) {
    const [k, ...rest] = line.split(":");
    const v = rest.join(":").trim();
    switch (k.trim().toUpperCase()) {
      case "TYPE": out.type = v; break;
      case "STRENGTH": out.strength = v; break;
      case "WEAKNESS": out.weakness = v; break;
      case "STYLE": out.style = v.replace(/^"|"$/g, ""); break;
      case "KARMA": out.karma = v; break;
      case "NOTES": out.notes = v; break;
      case "RARITY": out.rarity = v; break;
    }
  }
  return out;
}
```

- [ ] **Step 4: Update the deployed address**

Paste the address from Task 13 Step 3 into `PERSONA_ADDRESS`.

- [ ] **Step 5: Build**

Run: `cd web && npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add web
git commit -m "feat: frontend scaffold + somnia chain & contract wiring"
```

---

## Task 15: DossierCard component

**Files:**
- Create: `web/components/DossierCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Dossier } from "@/lib/persona";

export function DossierCard({ d, generation }: { d: Dossier; generation?: number }) {
  const stars = Number(d.rarity ?? 0);
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 font-mono text-zinc-100 shadow-xl">
      <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
        <span>PERSONA{generation ? ` · gen ${generation}` : ""}</span>
        <span>{"★".repeat(stars)}{"☆".repeat(Math.max(0, 5 - stars))}</span>
      </div>
      <div className="text-lg font-bold text-emerald-400">{d.type ?? "Unknown"}</div>
      <dl className="mt-3 space-y-1 text-sm">
        {d.strength && <div><span className="text-zinc-500">Strength: </span>{d.strength}</div>}
        {d.weakness && <div><span className="text-zinc-500">Weakness: </span>{d.weakness}</div>}
        {d.style && <div className="italic text-zinc-300">"{d.style}"</div>}
        {d.karma && <div><span className="text-zinc-500">Karma: </span>{d.karma}</div>}
        {d.notes && <p className="mt-2 text-zinc-300">{d.notes}</p>}
      </dl>
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `cd web && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add web/components/DossierCard.tsx
git commit -m "feat: dossier card component"
```

---

## Task 16: Read + mint page

**Files:**
- Modify: `web/app/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
"use client";
import { useState } from "react";
import { createPublicClient, createWalletClient, custom, http, parseEther } from "viem";
import { somniaTestnet } from "@/lib/chain";
import { PERSONA_ADDRESS, PERSONA_ABI, parseDossier, Dossier } from "@/lib/persona";
import { DossierCard } from "@/components/DossierCard";

const pub = createPublicClient({ chain: somniaTestnet, transport: http() });

export default function Home() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [gen, setGen] = useState<number | undefined>();

  async function pollDossier(wallet: `0x${string}`) {
    for (let i = 0; i < 40; i++) {
      const tokenId = (await pub.readContract({
        address: PERSONA_ADDRESS, abi: PERSONA_ABI,
        functionName: "personaOf", args: [wallet],
      })) as bigint;
      if (tokenId > 0n) {
        const raw = (await pub.readContract({
          address: PERSONA_ADDRESS, abi: PERSONA_ABI,
          functionName: "dossier", args: [tokenId],
        })) as string;
        const g = (await pub.readContract({
          address: PERSONA_ADDRESS, abi: PERSONA_ABI,
          functionName: "generation", args: [tokenId],
        })) as bigint;
        if (raw && raw.length > 0) { setDossier(parseDossier(raw)); setGen(Number(g)); return; }
      }
      setStatus(`Reading the chain… asking the validators… (${i * 3}s)`);
      await new Promise((r) => setTimeout(r, 3000));
    }
    setStatus("Timed out — try again.");
  }

  async function onRead() {
    setDossier(null); setStatus("Submitting…");
    const wallet = address as `0x${string}`;
    const eth = (window as any).ethereum;
    const walletClient = createWalletClient({ chain: somniaTestnet, transport: custom(eth) });
    const [from] = await walletClient.requestAddresses();
    await walletClient.writeContract({
      account: from, address: PERSONA_ADDRESS, abi: PERSONA_ABI,
      functionName: "read", args: [wallet], value: parseEther("1"),
    });
    setStatus("Reading the chain… asking the validators…");
    await pollDossier(wallet);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center gap-6 p-10">
      <h1 className="text-3xl font-bold">PERSONA</h1>
      <p className="text-center text-zinc-400">
        Paste a wallet. The on-chain AI reads its history and writes your dossier.
      </p>
      <input
        value={address} onChange={(e) => setAddress(e.target.value)}
        placeholder="0x…"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono"
      />
      <button onClick={onRead} className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-black">
        Read me
      </button>
      {status && <p className="text-sm text-zinc-400">{status}</p>}
      {dossier && <DossierCard d={dossier} generation={gen} />}
    </main>
  );
}
```

- [ ] **Step 2: Run the dev server and test manually against testnet**

Run: `cd web && npm run dev`
Open `http://localhost:3000`, connect MetaMask (Somnia Shannon network added), paste a funded testnet wallet, click **Read me**. 
Expected: tx prompt appears; after ~30s the dossier card renders. If it times out, check the deployed address in `lib/persona.ts` and the explorer URL/selector from Task 1.

- [ ] **Step 3: Commit**

```bash
git add web/app/page.tsx
git commit -m "feat: read + mint page with live dossier polling"
```

---

## Task 17: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README (English)**

```markdown
# PERSONA

A self-updating dynamic NFT on Somnia. Paste a wallet; an on-chain agent
pipeline (JSON API + LLM Inference, executed and consensus-verified by Somnia
validators) writes a witty personality dossier and mints it as a soulbound NFT.
The dossier evolves over time as the wallet's on-chain behavior changes.

## Why Somnia
- The dossier is generated by Somnia's validator-run LLM (Qwen3-30B, deterministic) — no central server can fake or alter a reading.
- Evolution runs via Cron-Reactivity with no off-chain keeper.

## Stack
Foundry (Solidity 0.8.24) · OpenZeppelin · ERC-5192 soulbound · Next.js + viem · Somnia Shannon testnet (50312)

## Run
- Contracts: `forge test`, deploy via `forge script script/Deploy.s.sol:Deploy --rpc-url somnia --broadcast --gas-estimate-multiplier 2000`
- Frontend: `cd web && npm install && npm run dev`

## Status
MVP: read → dossier → soulbound mint, deployed on testnet. Next: Cron evolution, Data Streams gallery.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: project README"
```

---

## Self-Review

- **Spec coverage:** read flow (Tasks 4–6), soulbound (7), one-per-wallet (8), dynamic tokenURI (9), first-100 refund (10), manual re-read = dynamic-NFT proof (11), failure handling + receive() (5, 6, 12, Task 4 receive), deploy (13), frontend read/loader/card/mint (14–16). Cron evolution, gallery, rarity rewards are intentionally deferred to the Phase-2 plan per spec §9.
- **Day-1 risk:** Task 1 resolves the explorer-API uncertainty before contract logic depends on it; the `_explorerUrl`/selector in Task 4–5 must be reconciled with Task 1 findings (if Parse Website fallback is needed, swap the JSON API call in `_requestStats` for a Parse Website call — same callback shape).
- **Type consistency:** `Ctx`, `requests`, `personaOf`, `dossier`, `generation`, `lastUpdated`, `JSON_API_AGENT_ID`, `LLM_AGENT_ID`, `handleStats`, `handleDossier`, `_requestStats`, `_requestDossier`, `reread` are used consistently across tasks. Frontend `PERSONA_ABI`/`parseDossier`/`DossierCard` names match across Tasks 14–16.
- **Placeholders:** none except the intentional Task-1 findings blanks and `0xPASTE_DEPLOYED_ADDRESS` (filled in Task 14 Step 4).

---

## Notes for the executor
- After Task 1, if the explorer needs the Parse Website agent instead of JSON API, adjust `_requestStats` (Task 4/5): use `IParseWebsiteAgent.ExtractString` with `LLM_PARSE_WEBSITE_AGENT_ID = 12875401142070969085` and price `0.10 ether * SUBCOMMITTEE`. The two-callback structure stays identical.
- Agent callbacks on real testnet can take seconds to ~a minute; the frontend poller (Task 16) tolerates this.
- Keep the contract reserve funded (Deploy seeds 5 STT). If reads start failing on testnet, top up the contract.
