import hre from "hardhat";

// Owner-only cron tuner. Use to speed up the cron for a video demo (60s tick is
// the sweet spot — fast enough to show on camera, slow enough that one tick still
// lands in a single shot), then reset back to the 1800s prod cadence afterwards.
//
//   DEMO=1 npx hardhat run scripts/setCronParams.ts --network somnia   # 60s, batch 5
//   DEMO=0 npx hardhat run scripts/setCronParams.ts --network somnia   # 1800s, batch 5 (prod)
//
// Override individually with INTERVAL=<sec> BATCH=<n>.
const CRON = "0x3cadf41dcc651366b23cce43086dd646043c4a6b";

async function main() {
  const demo = process.env.DEMO === "1";
  const interval = BigInt(process.env.INTERVAL ?? (demo ? "60" : "1800"));
  const batch = BigInt(process.env.BATCH ?? "5");

  const pub = await hre.viem.getPublicClient();
  const cron = await hre.viem.getContractAt("SoulprintCron", CRON);

  const oldInt = await cron.read.intervalSeconds();
  const oldBatch = await cron.read.batchSize();
  console.log(`before: interval=${oldInt}s, batch=${oldBatch}`);

  const h = await cron.write.setParams([Number(interval), batch]);
  await pub.waitForTransactionReceipt({ hash: h });

  console.log(`after : interval=${await cron.read.intervalSeconds()}s, batch=${await cron.read.batchSize()}`);
  console.log(`NOTE: the next scheduled tick still fires at the OLD time. The new cadence
takes effect from THAT tick onwards (because _scheduleNext runs inside the handler).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
