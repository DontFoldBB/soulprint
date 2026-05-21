// Standalone read smoke test (no MCP): proves the on-chain read path works.
// Usage: npm run build && node dist/smoke.js [wallet]
import { getSoulprint, SOULPRINT_ADDRESS } from "./soulprint.js";

const wallet = process.argv[2] ?? "0x3F86D1A143271A6c772f1CE57a24bAe2241004cC";

getSoulprint(wallet)
  .then((sp) => {
    console.log(`contract: ${SOULPRINT_ADDRESS}`);
    console.log(JSON.stringify(sp, null, 2));
  })
  .catch((e) => {
    console.error("read failed:", e);
    process.exit(1);
  });
