#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getSoulprint, SOULPRINT_ADDRESS } from "./soulprint.js";

const server = new McpServer({ name: "soulprint", version: "0.1.0" });

server.tool(
  "get_soulprint",
  "Look up a wallet's Soulprint — its on-chain, AI-generated identity dossier (archetype, traits, " +
    "karma, rarity, generation) minted as a soulbound NFT on Somnia. Use when asked 'who is this " +
    "wallet', or to profile / score / characterize a Somnia wallet address.",
  { wallet: z.string().describe("EVM wallet address, e.g. 0x3F86…") },
  async ({ wallet }) => {
    try {
      const sp = await getSoulprint(wallet);
      if (!sp.exists) {
        return {
          content: [
            { type: "text", text: `No Soulprint has been minted for ${sp.wallet} yet.` },
          ],
        };
      }
      const lines = [
        `Soulprint #${sp.tokenId} for ${sp.wallet} (generation ${sp.generation}):`,
      ];
      // On-chain activity score (0–100) from traitsOf — not present in the dossier text.
      if (sp.activity !== undefined) lines.push(`- ACTIVITY: ${sp.activity}/100`);
      lines.push(...Object.entries(sp.fields).map(([k, v]) => `- ${k}: ${v}`));
      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error reading Soulprint: ${(e as Error).message}` }],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
// MCP uses stdout for protocol; logs must go to stderr.
console.error(`soulprint MCP server running (contract ${SOULPRINT_ADDRESS})`);
