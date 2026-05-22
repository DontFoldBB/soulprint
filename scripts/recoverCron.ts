import hre from "hardhat";
import { formatEther } from "viem";

// The first (broken) cron — stop its subscription and pull the 32 STT back.
// NOTE: already fully retired (0 STT, subscriptionId 0, points at an old Soulprint).
// Kept only as the historical recovery tool for 0xb7cc…; to retire the CURRENT live deploy, use retireOld.ts.
const OLD_CRON = "0xb7cc93f4b5ae156abf1f73ea1d6593a0564d03cc";

async function main() {
  const pub = await hre.viem.getPublicClient();
  const cron = await hre.viem.getContractAt("SoulprintCron", OLD_CRON);

  const bal = await pub.getBalance({ address: OLD_CRON });
  console.log("Old cron balance:", formatEther(bal), "STT");

  try {
    const sh = await cron.write.stop();
    await pub.waitForTransactionReceipt({ hash: sh });
    console.log("stop() ok");
  } catch (e) {
    console.log("stop() skipped:", (e as Error).message.split("\n")[0]);
  }

  if (bal > 0n) {
    const wh = await cron.write.withdraw([bal]);
    await pub.waitForTransactionReceipt({ hash: wh });
    console.log("withdrew", formatEther(bal), "STT");
  }
  console.log("Old cron balance now:", formatEther(await pub.getBalance({ address: OLD_CRON })), "STT");
}

main().catch((e) => { console.error(e); process.exit(1); });
