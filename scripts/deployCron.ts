import hre from "hardhat";
import { parseEther, formatEther } from "viem";

// The freshly deployed Soulprint this cron will evolve.
const SOULPRINT = "0x30e553c13eab2c125a466e2ccde228f692d36149";
const INTERVAL = 30n; // seconds between autonomous ticks (>= ~12s)
const BATCH = 1n; // wallets re-evolved per tick
const FUND = parseEther("32"); // min balance required to create a subscription

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
