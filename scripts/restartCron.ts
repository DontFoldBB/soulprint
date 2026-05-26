import hre from "hardhat";
import { parseEther, formatEther } from "viem";

// LIVE cron — top it up above the 32 STT floor so the in-handler reschedule
// (which re-checks >= 32 STT) doesn't revert after paying tick gas. Use this if the
// live subscription ever stalls (subscriptionId resets to 0) and needs a re-start().
const CRON = "0x0bf4e395ad3746632f86b5254fa18f0db3479d95";
const TOPUP = parseEther("8"); // keeps it comfortably above the 32 STT floor

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
