import hre from "hardhat";
import { parseEther, formatEther } from "viem";

const PLATFORM = "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";
const SEED = parseEther("3"); // reserve to fund agent deposits + first-100 refunds

async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  const pub = await hre.viem.getPublicClient();

  const bal = await pub.getBalance({ address: wallet.account.address });
  console.log("Deployer:", wallet.account.address);
  console.log("Balance :", formatEther(bal), "STT");

  console.log("Deploying Persona...");
  const persona = await hre.viem.deployContract("Persona", [PLATFORM]);
  console.log("Persona deployed at:", persona.address);

  console.log(`Seeding reserve with ${formatEther(SEED)} STT...`);
  const hash = await wallet.sendTransaction({ to: persona.address, value: SEED });
  await pub.waitForTransactionReceipt({ hash });

  const contractBal = await pub.getBalance({ address: persona.address });
  console.log("Contract reserve:", formatEther(contractBal), "STT");
  console.log("\nDONE. Set PERSONA_ADDRESS in web/lib/persona.ts to:", persona.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
