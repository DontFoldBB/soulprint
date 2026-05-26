import hre from "hardhat";
import { parseEther, formatEther } from "viem";

// Sends N tiny self-transactions from the burner so its on-chain `tx_count` rises.
// Used on-camera during the demo to deliberately trigger a real evolution on the
// next cron tick (the cost-gate inside _handleStats skips evolution unless tx_count
// changed). Defaults: 50 self-transfers of 0 STT each — enough to push the burner
// from Stage 3 (≥20 tx_count) into Stage 4 (≥75 tx_count) and force a form change.
//
//   N=50 npx hardhat run scripts/bumpTxCount.ts --network somnia

async function main() {
  const n = Number(process.env.N ?? "50");
  const [wallet] = await hre.viem.getWalletClients();
  const pub = await hre.viem.getPublicClient();
  const me = wallet.account.address;

  console.log(`Burner ${me} -> sending ${n} self-tx (0 STT)…`);
  console.log(`balance before: ${formatEther(await pub.getBalance({ address: me }))} STT`);

  let lastHash: `0x${string}` | undefined;
  for (let i = 0; i < n; i++) {
    const h = await wallet.sendTransaction({ to: me, value: 0n });
    lastHash = h;
    if ((i + 1) % 10 === 0) process.stdout.write(`${i + 1} `);
  }
  if (lastHash) await pub.waitForTransactionReceipt({ hash: lastHash });

  console.log(`\nbalance after : ${formatEther(await pub.getBalance({ address: me }))} STT`);
  console.log(`done. next cron tick (or evolveBatch call) will see the new tx_count and
should run the pipeline → bump generation → maybe re-stage / re-form on the card.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
