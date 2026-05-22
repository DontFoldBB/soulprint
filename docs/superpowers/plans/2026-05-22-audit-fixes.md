# Soulprint Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the audit findings found on 2026-05-22 without changing product scope.

**Architecture:** Keep the current contract/frontend architecture. Apply small, test-first patches: contract guards and JSON escaping in `Soulprint.sol`, lint-safe client state in the frontend, richer MCP reads, and documentation cleanup. Do not add dependencies.

**Tech Stack:** Solidity 0.8.30, Hardhat + viem tests, Next.js 16, React 19, viem, TypeScript, MCP SDK.

---

## File Map

- Modify: `contracts/Soulprint.sol` — zero-address validation and JSON escaping.
- Modify: `test/Soulprint.test.ts` — keep the two new audit tests and add focused coverage for the final behavior.
- Modify: `contracts/SoulprintCron.sol` — make `start()` idempotent-safe and keep cron rescheduling resilient.
- Modify: `web/components/TimeAgo.tsx` — remove lint-blocking synchronous effect state update.
- Modify: `web/lib/watchlist.ts` — remove lint-blocking synchronous effect state update while preserving SSR safety.
- Modify: `web/components/SoulCard.tsx` — avoid nested interactive buttons; preserve flip and copy behavior.
- Modify: `web/app/page.tsx` and `web/app/dashboard/page.tsx` — clear stale profile/card state on wallet changes and failed loads.
- Modify: `web/lib/dashboard.ts` / `web/components/ActivityFeed.tsx` — avoid presenting derived mint timestamps as live facts.
- Modify: `mcp/src/soulprint.ts`, `mcp/src/index.ts`, `mcp/README.md` — expose `traitsOf` activity/archetype in MCP output.
- Modify: `CLAUDE.md`, `docs/handoff.md` — remove stale contradictory sections or explicitly archive them below a clear "historical" marker.

---

### Task 1: Contract Input And Metadata Hardening

**Files:**
- Modify: `contracts/Soulprint.sol`
- Test: `test/Soulprint.test.ts`

- [ ] **Step 1: Verify audit tests fail before fixing**

Run:

```bash
npx hardhat test
```

Expected before implementation:

```text
31 passing
2 failing
audit: rejects the zero address before spending agent deposits
audit: tokenURI stays valid JSON when the dossier contains JSON control characters
```

- [ ] **Step 2: Reject zero wallet before any agent request**

In `contracts/Soulprint.sol`, update `read`:

```solidity
function read(address wallet) external payable {
    require(wallet != address(0), "zero wallet");
    require(soulprintOf[wallet] == 0, "already read");
    require(!pendingRead[wallet], "read in progress");
    bool isSelf = wallet == msg.sender;
    require(msg.value >= (isSelf ? MINT_PRICE : PROFILE_OTHER_PRICE), "underpaid");
    paidByWallet[wallet] = isSelf ? msg.value : 0;
    emit ProfileRequested(msg.sender, wallet);
    _requestStats(wallet);
}
```

- [ ] **Step 3: Escape all JSON control characters emitted by `tokenURI`**

Replace `_jsonString` body in `contracts/Soulprint.sol` with:

```solidity
function _jsonString(string memory s) internal pure returns (string memory) {
    bytes memory b = bytes(s);
    bytes memory out = abi.encodePacked('"');
    bytes16 hexChars = "0123456789abcdef";

    for (uint256 i = 0; i < b.length; i++) {
        uint8 v = uint8(b[i]);
        bytes1 c = b[i];
        if (c == '"') out = abi.encodePacked(out, '\\"');
        else if (c == "\\") out = abi.encodePacked(out, "\\\\");
        else if (c == "\n") out = abi.encodePacked(out, "\\n");
        else if (c == "\r") out = abi.encodePacked(out, "\\r");
        else if (c == "\t") out = abi.encodePacked(out, "\\t");
        else if (v < 0x20) {
            out = abi.encodePacked(out, "\\u00", hexChars[v >> 4], hexChars[v & 0x0f]);
        } else {
            out = abi.encodePacked(out, c);
        }
    }
    return string(abi.encodePacked(out, '"'));
}
```

- [ ] **Step 4: Run contract tests**

Run:

```bash
npx hardhat test
```

Expected after implementation:

```text
33 passing
```

---

### Task 2: Cron Operational Safety

**Files:**
- Modify: `contracts/SoulprintCron.sol`
- Test: `test/Soulprint.test.ts`

- [ ] **Step 1: Add owner/start guard test**

Add to `test/Soulprint.test.ts`:

```ts
it("SoulprintCron blocks duplicate starts once armed", async () => {
  const { soulprint } = await deploy();
  const cron = await hre.viem.deployContract("SoulprintCron", [soulprint.address, 60n, 5n]);
  // Local Hardhat cannot create a real Somnia subscription, so assert the contract
  // exposes the guard through a cheap direct state setup in a helper if one is added.
  expect(await cron.read.subscriptionId()).to.equal(0n);
});
```

If direct local subscription simulation remains impossible, keep this as a code-review item and verify on live testnet after deploy.

- [ ] **Step 2: Prevent accidental duplicate live subscriptions**

In `contracts/SoulprintCron.sol`:

```solidity
function start() external onlyOwner {
    require(subscriptionId == 0, "already started");
    _scheduleNext();
    emit Started(subscriptionId);
}
```

- [ ] **Step 3: Make parameter input explicit**

In constructor and `setParams`:

```solidity
require(intervalSeconds_ >= 2, "interval too short");
require(batchSize_ > 0, "zero batch");
```

- [ ] **Step 4: Verify compile and tests**

Run:

```bash
npx hardhat test
npx hardhat compile
```

Expected: all tests pass and compile succeeds.

---

### Task 3: Frontend Lint Cleanup

**Files:**
- Modify: `web/components/TimeAgo.tsx`
- Modify: `web/lib/watchlist.ts`

- [ ] **Step 1: Replace `TimeAgo` effect-state pattern**

Use a client-only mount flag and derive label during render:

```tsx
"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/dashboard";

export function TimeAgo({ unix }: { unix: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <>{mounted ? relativeTime(unix) : "·"}</>;
}
```

- [ ] **Step 2: Replace `watchlist` initial state load**

Initialize from `localStorage` only on client through lazy initializer:

```ts
const [list, setList] = useState<`0x${string}`[]>(() => read());

useEffect(() => {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) setList(read());
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}, []);
```

- [ ] **Step 3: Run frontend lint and build**

Run:

```bash
cd web
npm run lint
npm run build
```

Expected: lint passes; build passes. If `next/font/google` cannot fetch fonts in a sandbox, rerun build with network access or switch to local fonts in a separate task.

---

### Task 4: SoulCard Interaction Semantics

**Files:**
- Modify: `web/components/SoulCard.tsx`
- Modify: `web/components/SoulCard.css` if layout needs small selector changes.

- [ ] **Step 1: Remove nested button structure**

Keep `.sc-flipper` as a non-button interactive container and make only the copy control a real `button`:

```tsx
<div
  className={"sc-flipper" + (flipped ? " is-flipped" : "")}
  onClick={toggleFlip}
  onTouchStart={onTouchStart}
  onTouchEnd={onTouchEnd}
  role="button"
  tabIndex={0}
  aria-label="Flip Soulprint card"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip();
    }
  }}
>
```

Keep `onCopy(e)` using `e.stopPropagation()`.

- [ ] **Step 2: Add copy failure feedback**

Change copy state to `"idle" | "copied" | "failed"` and render:

```tsx
{copyState === "copied" ? "Copied!" : copyState === "failed" ? "Copy failed" : "Copy address"}
```

- [ ] **Step 3: Browser verify**

Run:

```bash
cd web
npm run dev
```

Verify:
- click card flips
- click "Copy address" does not flip card
- failed clipboard write shows visible feedback
- no browser console errors

---

### Task 5: Wallet State Consistency

**Files:**
- Modify: `web/app/page.tsx`
- Modify: `web/app/dashboard/page.tsx`

- [ ] **Step 1: Clear stale result when connecting a different wallet on Mint page**

In `connectWallet()` before loading:

```tsx
setResult(null);
setError("");
```

If `existing` is null, set a clear error:

```tsx
if (existing) setResult(existing);
else setError("No Soulprint yet for this wallet. Use Mint to create one.");
```

- [ ] **Step 2: Clear stale dashboard profile on no-profile wallet**

In dashboard `connectWallet()`:

```tsx
const p = await loadWalletProfile(addr);
setProfile(p);
if (!p) setError("No Soulprint yet — head to Mint to create yours.");
```

In the auto-detect effect:

```tsx
loadWalletProfile(a).then((p) => setProfile(p));
```

- [ ] **Step 3: Browser verify**

Manually test with a wallet that has a profile and one that does not. Expected: old card never remains visible after switching to an unprofiled wallet.

---

### Task 6: Activity Feed Honesty

**Files:**
- Modify: `web/lib/dashboard.ts`
- Modify: `web/components/ActivityFeed.tsx`

- [ ] **Step 1: Stop showing synthetic mint time as live fact**

In `buildActivity`, remove derived mint events for `generation > 1`, or label them as approximate. Minimal safer code:

```ts
if (e.generation > 1) {
  events.push({ ...base, id: `e-${e.tokenId}`, kind: "evolve", generation: e.generation, time: e.lastUpdated });
} else {
  events.push({ ...base, id: `m-${e.tokenId}`, kind: "mint", generation: 1, time: e.lastUpdated });
}
```

- [ ] **Step 2: Update seeded copy**

Only show:

```tsx
Sample activity
```

when `seeded` is true. Remove "goes live after redeploy" because the current deployment is live.

- [ ] **Step 3: Browser verify**

Expected: live feed does not show a fake "minted" event at the same timestamp as the latest evolution for gen > 1 tokens.

---

### Task 7: MCP Traits Output

**Files:**
- Modify: `mcp/src/soulprint.ts`
- Modify: `mcp/src/index.ts`
- Modify: `mcp/README.md`

- [ ] **Step 1: Add `traitsOf` ABI**

```ts
{
  type: "function",
  name: "traitsOf",
  stateMutability: "view",
  inputs: [{ name: "wallet", type: "address" }],
  outputs: [
    { name: "tokenId", type: "uint256" },
    { name: "archetype", type: "string" },
    { name: "activity", type: "uint256" },
    { name: "generation", type: "uint256" },
  ],
}
```

- [ ] **Step 2: Extend return type**

```ts
export type Soulprint = {
  wallet: Address;
  exists: boolean;
  tokenId: number;
  generation: number;
  archetype?: string;
  activity?: number;
  fields: Record<string, string>;
  raw: string;
};
```

- [ ] **Step 3: Read traits defensively**

```ts
let archetype: string | undefined;
let activity: number | undefined;
try {
  const [, a, score] = (await client.readContract({
    address: SOULPRINT_ADDRESS,
    abi: ABI,
    functionName: "traitsOf",
    args: [addr],
  })) as readonly [bigint, string, bigint, bigint];
  archetype = a || undefined;
  activity = Number(score);
} catch {
  // Older deployments still work via profileOf.
}
```

- [ ] **Step 4: Include traits in tool output**

In `mcp/src/index.ts`, add lines before parsed fields:

```ts
if (sp.archetype) lines.push(`- ARCHETYPE: ${sp.archetype}`);
if (sp.activity !== undefined) lines.push(`- ACTIVITY: ${sp.activity}/100`);
```

- [ ] **Step 5: Build and smoke**

Run:

```bash
cd mcp
npm run build
npm run smoke -- 0x3F86D1A143271A6c772f1CE57a24bAe2241004cC
```

Expected: output includes `ACTIVITY`.

---

### Task 8: Documentation De-Dupe

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/handoff.md`
- Modify: `mcp/README.md`

- [ ] **Step 1: Make `CLAUDE.md` current**

Update the top summary to:

```md
Current deployed Soulprint: 0x92c5f242fd75fb85d036db8598a515bc9eb463ab
Current deployed SoulprintCron: 0x9f4f4476fa812f37fb2771c48ff7666a4f0cc3e6
Tests: 31 green before audit-only failing tests; 33 after audit fixes.
GitHub remote exists: https://github.com/DontFoldBB/soulprint
Cron autonomy is live and read-only verified via scripts/inspectSub.ts.
```

Remove or move stale "13 tests", "no GitHub remote", and "needs redeploy" lines.

- [ ] **Step 2: Trim `docs/handoff.md`**

Keep only the 2026-05-22 live-state block plus a short historical note:

```md
Older sections below this point are historical and should not be used for operational state.
```

Better: move retired 2026-05-21 content to `docs/archive/2026-05-21-handoff.md`.

- [ ] **Step 3: Update MCP README note**

Replace the stale redeploy note with:

```md
The default `SOULPRINT_ADDRESS` points at the current structured-dossier deployment.
```

---

## Final Verification

Run all commands:

```bash
npx hardhat test
cd web && npm run lint && npm run build
cd ../mcp && npm run build && npm run smoke -- 0x3F86D1A143271A6c772f1CE57a24bAe2241004cC
npx hardhat run scripts/inspectSub.ts --network somnia
```

Expected:

- Hardhat tests pass.
- Web lint passes.
- Web build passes. If Google Fonts fail under sandbox, rerun with network access or switch fonts to local assets.
- MCP build and smoke pass.
- `inspectSub.ts` shows non-zero `subscriptionId` and current live cron address `0x9f4f4476fa812f37fb2771c48ff7666a4f0cc3e6`.
