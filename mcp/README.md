# Soulprint MCP server

A tiny [Model Context Protocol](https://modelcontextprotocol.io) server that exposes **Soulprint**
wallet-identity profiles to AI agents (Claude, Cursor, …). It's **read-only** — it reads the
on-chain `profileOf` view from the deployed contract on Somnia testnet. No private key, no STT.

This is the agent-facing edge of Soulprint: any AI agent can now ask *"who is this wallet?"* and get
the on-chain, AI-generated identity dossier back through a standard protocol — demonstrating that
Soulprint is a **composable reputation primitive** agents consume, not just a human dApp.

## Tool

- **`get_soulprint(wallet)`** — returns the wallet's archetype/traits/generation, or a note that no
  Soulprint has been minted yet.

## Build

```bash
cd mcp
npm install
npm run build
npm run smoke        # optional: prove the on-chain read works (reads profileOf for a sample wallet)
```

## Register in Claude Code / Cursor

Add to your MCP config (e.g. `~/.claude.json` or the editor's MCP settings):

```json
{
  "mcpServers": {
    "soulprint": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/somnia_hackaton/mcp/dist/index.js"]
    }
  }
}
```

Then ask your assistant: *"Use soulprint to tell me who 0x… is."*

## Config (optional env)

- `SOULPRINT_ADDRESS` — contract address (defaults to the current testnet deployment).
- `SOULPRINT_RPC` — Somnia RPC URL (defaults to the public Shannon testnet RPC).

> Note: once the contract is redeployed with the structured-dossier upgrade, point `SOULPRINT_ADDRESS`
> at the new address; the server will then surface the canonical `ARCHETYPE` + activity fields too.
