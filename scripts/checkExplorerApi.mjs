// scripts/checkExplorerApi.mjs
// Usage: node scripts/checkExplorerApi.mjs 0xSomeWalletAddress
const addr = process.argv[2] || "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";

const urls = [
  `https://shannon-explorer.somnia.network/api/v2/addresses/${addr}`,
  `https://shannon-explorer.somnia.network/api/v2/addresses/${addr}/counters`,
  `https://somnia-testnet.socialscan.io/api/v2/addresses/${addr}`,
];

for (const url of urls) {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    console.log("\n=== ", url, " -> ", res.status);
    const text = await res.text();
    console.log(text.slice(0, 1500));
  } catch (e) {
    console.log("\n=== ", url, " -> ERROR", e.message);
  }
}
