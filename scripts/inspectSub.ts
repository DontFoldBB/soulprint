import hre from "hardhat";

const PRECOMPILE = "0x0000000000000000000000000000000000000100";
const SUB_ID = 1063140n;

async function main() {
  const pub = await hre.viem.getPublicClient();
  const pre = await hre.viem.getContractAt("ISomniaReactivityPrecompile", PRECOMPILE);

  const block = await pub.getBlock();
  console.log("now (block.timestamp):", block.timestamp, "→ ms:", block.timestamp * 1000n);

  try {
    const [data, owner] = (await pre.read.getSubscriptionInfo([SUB_ID])) as any;
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
