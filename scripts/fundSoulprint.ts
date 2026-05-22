import hre from "hardhat";
import { parseEther, formatEther } from "viem";

// Tops up the Soulprint contract's STT reserve. That reserve funds the agent calls
// (JSON API + LLM) behind every read/evolution; when it runs low, evolveBatch() can no
// longer afford a pipeline and silently emits EvolutionSkipped instead of evolving.
// Re-run this when the reserve gets low. Unused STT is recoverable via Soulprint.withdraw().
//
// Amount defaults to 10 STT; override with FUND_STT (e.g. FUND_STT=5).
const SOULPRINT = "0x92c5f242fd75fb85d036db8598a515bc9eb463ab";
const AMOUNT = parseEther(process.env.FUND_STT ?? "10");

async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  const pub = await hre.viem.getPublicClient();

  const before = await pub.getBalance({ address: SOULPRINT as `0x${string}` });
  console.log("From            :", wallet.account.address);
  console.log("Soulprint before:", formatEther(before), "STT");
  console.log(`Sending         : ${formatEther(AMOUNT)} STT → ${SOULPRINT}`);

  const h = await wallet.sendTransaction({ to: SOULPRINT as `0x${string}`, value: AMOUNT });
  await pub.waitForTransactionReceipt({ hash: h });

  console.log("tx              :", h);
  console.log("Soulprint after :", formatEther(await pub.getBalance({ address: SOULPRINT as `0x${string}` })), "STT");
}

main().catch((e) => { console.error(e); process.exit(1); });
