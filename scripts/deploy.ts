import hre from "hardhat";
import { parseEther, formatEther } from "viem";

const PLATFORM = "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";
const SEED = parseEther("12"); // reserve to fund agent deposits + first-100 refunds (~40 evolutions)

async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  const pub = await hre.viem.getPublicClient();

  const bal = await pub.getBalance({ address: wallet.account.address });
  console.log("Deployer:", wallet.account.address);
  console.log("Balance :", formatEther(bal), "STT");

  console.log("Deploying Soulprint...");
  const soulprint = await hre.viem.deployContract("Soulprint", [PLATFORM]);
  console.log("Soulprint deployed at:", soulprint.address);

  console.log(`Seeding reserve with ${formatEther(SEED)} STT...`);
  const hash = await wallet.sendTransaction({ to: soulprint.address, value: SEED });
  await pub.waitForTransactionReceipt({ hash });

  const contractBal = await pub.getBalance({ address: soulprint.address });
  console.log("Contract reserve:", formatEther(contractBal), "STT");
  console.log("\nDONE. Set SOULPRINT_ADDRESS in web/lib/soulprint.ts to:", soulprint.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
