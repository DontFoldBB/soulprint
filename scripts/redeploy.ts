import hre from "hardhat";
import { parseEther, formatEther } from "viem";

// Full redeploy: new Soulprint (with the latest hardening) + a new SoulprintCron pointing at
// it (the cron's `soulprint` is immutable, so a new core always needs a new cron). Funds both
// and starts the autonomous schedule. Run scripts/retireOld.ts first to recycle old STT.
const PLATFORM = "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";
const SEED = parseEther("12");        // Soulprint reserve: agent calls (~0.3/evolution) + refunds
const CRON_INTERVAL = 1800n;          // 30 min between autonomous ticks
const CRON_BATCH = 5n;                // wallets re-evolved per tick
const CRON_FUND = parseEther("40");   // > 32 STT floor so the in-handler reschedule survives gas

async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  const pub = await hre.viem.getPublicClient();
  console.log("Deployer:", wallet.account.address, "|",
    formatEther(await pub.getBalance({ address: wallet.account.address })), "STT");

  // 1) New Soulprint + seed reserve
  console.log("\nDeploying Soulprint...");
  const soulprint = await hre.viem.deployContract("Soulprint", [PLATFORM]);
  console.log("Soulprint:", soulprint.address);
  let h = await wallet.sendTransaction({ to: soulprint.address, value: SEED });
  await pub.waitForTransactionReceipt({ hash: h });
  console.log("  seeded reserve:", formatEther(await pub.getBalance({ address: soulprint.address })), "STT");

  // 2) New Cron → new Soulprint, fund, start the schedule
  console.log("\nDeploying SoulprintCron → Soulprint...");
  const cron = await hre.viem.deployContract("SoulprintCron", [soulprint.address, CRON_INTERVAL, CRON_BATCH]);
  console.log("SoulprintCron:", cron.address);
  h = await wallet.sendTransaction({ to: cron.address, value: CRON_FUND });
  await pub.waitForTransactionReceipt({ hash: h });
  console.log("  funded:", formatEther(await pub.getBalance({ address: cron.address })), "STT");
  const sh = await cron.write.start();
  await pub.waitForTransactionReceipt({ hash: sh });
  console.log("  subscriptionId:", (await cron.read.subscriptionId()).toString(),
    "| ticks:", (await cron.read.ticks()).toString());

  console.log("\n=== NEW ADDRESSES — update web/mcp/scripts/docs ===");
  console.log("SOULPRINT:", soulprint.address);
  console.log("CRON     :", cron.address);
}

main().catch((e) => { console.error(e); process.exit(1); });
