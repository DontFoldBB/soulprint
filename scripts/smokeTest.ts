import hre from "hardhat";
import { parseEther } from "viem";

const SOULPRINT = "0x92c5f242fd75fb85d036db8598a515bc9eb463ab";

async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  const pub = await hre.viem.getPublicClient();
  const soulprint = await hre.viem.getContractAt("Soulprint", SOULPRINT);

  const target = wallet.account.address; // burner EOA (now has some history)
  console.log("Reading wallet:", target);

  const hash = await soulprint.write.read([target], { value: parseEther("1") });
  console.log("read() tx:", hash);
  await pub.waitForTransactionReceipt({ hash });
  console.log("Confirmed. Waiting for agent callbacks (JSON API + LLM)...");

  for (let i = 0; i < 60; i++) {
    const tokenId = await soulprint.read.soulprintOf([target]);
    if (tokenId > 0n) {
      const dossier = await soulprint.read.dossier([tokenId]);
      if (dossier && dossier.length > 0) {
        console.log(`\n=== DOSSIER (tokenId ${tokenId}, ${i * 3}s) ===\n`);
        console.log(dossier);
        console.log("\n=== tokenURI ===");
        console.log((await soulprint.read.tokenURI([tokenId])).slice(0, 120) + "...");
        return;
      }
    }
    process.stdout.write(`.${i * 3}s `);
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log("\nTimed out. Check events on the explorer for ReadFailed.");
}

main().catch((e) => { console.error(e); process.exit(1); });
