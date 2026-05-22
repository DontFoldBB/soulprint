import hre from "hardhat";

const PRECOMPILE = "0x0000000000000000000000000000000000000100";
const CRON = "0x9f4f4476fa812f37fb2771c48ff7666a4f0cc3e6"; // LIVE cron (criterion #4)

async function main() {
  const pub = await hre.viem.getPublicClient();
  const pre = await hre.viem.getContractAt("ISomniaReactivityPrecompile", PRECOMPILE);
  const cron = await hre.viem.getContractAt("SoulprintCron", CRON as `0x${string}`);

  // The cron self-reschedules each tick, so its current subscriptionId changes over
  // time — read it live rather than hardcoding a value that goes stale immediately.
  const subId = await cron.read.subscriptionId();
  console.log(
    "cron:", CRON,
    "| live subscriptionId:", subId.toString(),
    "| ticks:", (await cron.read.ticks()).toString()
  );
  if (subId === 0n) {
    console.log("subscriptionId is 0 → the cron is stopped. Run restartCron.ts to re-arm it.");
    return;
  }

  const block = await pub.getBlock();
  console.log("now (block.timestamp):", block.timestamp, "→ ms:", block.timestamp * 1000n);

  try {
    const [data, owner] = (await pre.read.getSubscriptionInfo([subId])) as any;
    console.log("owner:", owner);
    console.log("handler:", data.handlerContractAddress);
    console.log("selector:", data.handlerFunctionSelector);
    console.log("emitter:", data.emitter);
    console.log("origin:", data.origin);
    console.log("eventTopics:", data.eventTopics);
    const scheduledMs = BigInt(data.eventTopics[1]);
    console.log("scheduled timestampMillis (topic[1]):", scheduledMs);
    console.log("  → that is", Number(scheduledMs - block.timestamp * 1000n) / 1000, "s from now");
    console.log("priorityFeePerGas:", data.priorityFeePerGas);
    console.log("maxFeePerGas:", data.maxFeePerGas);
    console.log("gasLimit:", data.gasLimit);
    console.log("isGuaranteed:", data.isGuaranteed, "| isCoalesced:", data.isCoalesced);
  } catch (e) {
    console.log("getSubscriptionInfo reverted/failed:", (e as Error).message.split("\n")[0]);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
