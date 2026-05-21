import hre from "hardhat";
import { parseEther, formatEther } from "viem";

// Existing (correct) cron — top it up above the 32 STT floor so the in-handler
// reschedule (which re-checks >= 32 STT) doesn't revert after paying tick gas.
const CRON = "0xb7cc93f4b5ae156abf1f73ea1d6593a0564d03cc";
const TOPUP = parseEther("8"); // 32 + 8 = 40 STT runway

async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  const pub = await hre.viem.getPublicClient();
  const cron = await hre.viem.getContractAt("SoulprintCron", CRON);

  const h = await wallet.sendTransaction({ to: CRON, value: TOPUP });
  await pub.waitForTransactionReceipt({ hash: h });
  console.log("Cron balance:", formatEther(await pub.getBalance({ address: CRON })), "STT");

  const sh = await cron.write.start();
  await pub.waitForTransactionReceipt({ hash: sh });
  console.log("re-started. subscriptionId:", await cron.read.subscriptionId());
  console.log("ticks:", await cron.read.ticks());
}

main().catch((e) => { console.error(e); process.exit(1); });
