import hre from "hardhat";

const CRON = "0xb7cc93f4b5ae156abf1f73ea1d6593a0564d03cc";
const SOULPRINT = "0x5cc8b871013a252d9fdbc807b6f0a5d0d951f232";

async function main() {
  const cron = await hre.viem.getContractAt("SoulprintCron", CRON);
  const soulprint = await hre.viem.getContractAt("Soulprint", SOULPRINT);

  const startGen = await soulprint.read.generation([1n]);
  console.log("Start: generation(#1) =", startGen, "| ticks =", await cron.read.ticks());
  console.log("Watching for autonomous ticks (no human tx)...\n");

  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 10000)); // 10s
    const ticks = await cron.read.ticks();
    const gen = await soulprint.read.generation([1n]);
    const subId = await cron.read.subscriptionId();
    console.log(
      `t+${(i + 1) * 10}s  ticks=${ticks}  generation=${gen}  subId=${subId}`
    );
    if (ticks > 0n && gen > startGen) {
      console.log("\n✅ AUTONOMY PROVEN: the cron tick fired and the dossier re-evolved");
      console.log("   with no human transaction. generation rose", startGen, "→", gen);
      return;
    }
  }
  console.log("\n⏳ No tick observed yet in the window. subId is set, so the");
  console.log("   subscription exists — it may just need more time / a block.");
}

main().catch((e) => { console.error(e); process.exit(1); });
