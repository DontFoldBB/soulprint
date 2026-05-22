import hre from "hardhat";
import { parseEther, formatEther } from "viem";

// The freshly deployed Soulprint this cron will evolve.
const SOULPRINT = "0x92c5f242fd75fb85d036db8598a515bc9eb463ab";
const INTERVAL = 1800n; // 30 minutes between autonomous ticks
const BATCH = 5n; // wallets re-evolved per tick (round-robin)
const FUND = parseEther("40"); // > 32 STT floor so the in-handler reschedule survives tick gas

async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  const pub = await hre.viem.getPublicClient();

  console.log("Deployer:", wallet.account.address);
  console.log("Deploying SoulprintCron → Soulprint", SOULPRINT);
  const cron = await hre.viem.deployContract("SoulprintCron", [SOULPRINT, INTERVAL, BATCH]);
  console.log("SoulprintCron at:", cron.address);

  console.log(`Funding cron with ${formatEther(FUND)} STT (subscription minimum)...`);
  const h = await wallet.sendTransaction({ to: cron.address, value: FUND });
  await pub.waitForTransactionReceipt({ hash: h });
  console.log("Cron balance:", formatEther(await pub.getBalance({ address: cron.address })), "STT");

  console.log("Calling start() — creating the scheduled subscription...");
  const sh = await cron.write.start();
  await pub.waitForTransactionReceipt({ hash: sh });

  console.log("subscriptionId:", await cron.read.subscriptionId());
  console.log("ticks so far  :", await cron.read.ticks());
  console.log("\nDONE. Cron:", cron.address);
  console.log("Watch `ticks` and the Soulprint `generation` rise with NO human tx.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
