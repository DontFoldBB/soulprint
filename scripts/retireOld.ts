import hre from "hardhat";
import { formatEther } from "viem";

// Retire the current live deployment by pulling all STT back to the owner (burner), so a
// fresh redeploy can be funded from it. Owner-only withdraws; the old contracts/tokens are
// simply abandoned (their event history — including the autonomy proof — stays on-chain).
const OLD_CRON = "0x9f4f4476fa812f37fb2771c48ff7666a4f0cc3e6";
const OLD_SOULPRINT = "0x92c5f242fd75fb85d036db8598a515bc9eb463ab";

async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  const pub = await hre.viem.getPublicClient();
  console.log("Owner:", wallet.account.address);

  // 1) Old cron: cancel the subscription, then pull its STT back.
  const cron = await hre.viem.getContractAt("SoulprintCron", OLD_CRON as `0x${string}`);
  try {
    const sh = await cron.write.stop();
    await pub.waitForTransactionReceipt({ hash: sh });
    console.log("cron stop() ok");
  } catch (e) {
    console.log("cron stop() skipped:", (e as Error).message.split("\n")[0]);
  }
  const cronBal = await pub.getBalance({ address: OLD_CRON as `0x${string}` });
  console.log("Old cron balance:", formatEther(cronBal), "STT");
  if (cronBal > 0n) {
    const wh = await cron.write.withdraw([cronBal]);
    await pub.waitForTransactionReceipt({ hash: wh });
    console.log("withdrew", formatEther(cronBal), "STT from old cron");
  }

  // 2) Old Soulprint: pull the reserve back.
  const sp = await hre.viem.getContractAt("Soulprint", OLD_SOULPRINT as `0x${string}`);
  const spBal = await pub.getBalance({ address: OLD_SOULPRINT as `0x${string}` });
  console.log("Old soulprint balance:", formatEther(spBal), "STT");
  if (spBal > 0n) {
    const wh = await sp.write.withdraw([spBal]);
    await pub.waitForTransactionReceipt({ hash: wh });
    console.log("withdrew", formatEther(spBal), "STT from old soulprint");
  }

  console.log("Owner balance now:", formatEther(await pub.getBalance({ address: wallet.account.address })), "STT");
}

main().catch((e) => { console.error(e); process.exit(1); });
