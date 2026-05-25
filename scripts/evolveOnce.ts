import hre from "hardhat";

const SOULPRINT = "0xbc55dc48cdafb62cc054e1b9424b0429c1750af9";

async function main() {
  const soulprint = await hre.viem.getContractAt("Soulprint", SOULPRINT);
  const pub = await hre.viem.getPublicClient();

  const before = await soulprint.read.generation([1n]);
  console.log("generation before:", before, "| txCountOf:", await soulprint.read.txCountOf([1n]));

  const h = await soulprint.write.evolveBatch([1n]);
  await pub.waitForTransactionReceipt({ hash: h });
  console.log("evolveBatch(1) sent, waiting for agent callbacks...");

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const gen = await soulprint.read.generation([1n]);
    if (gen > before) {
      console.log(`✅ evolved: generation ${before} → ${gen} (gate let it through; tx_count changed)`);
      return;
    }
    process.stdout.write(`.${i * 3}s `);
  }
  console.log(`\ngeneration still ${before} — gate skipped it (tx_count unchanged since mint).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
