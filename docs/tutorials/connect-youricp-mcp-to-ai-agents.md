---
title: "Connect YourICP Contact Enrichment to Claude, Cursor & ChatGPT with MCP"
published: false
canonical_url: https://youricp.com/mcp
description: A step-by-step guide to giving your AI agent a direct line to clean and enrich B2B contact data using the open-source YourICP MCP server.
tags: mcp, ai, devtools, b2b
---

# Connect YourICP contact enrichment to your AI agent with MCP

If you work in RevOps or growth, your CRM is only as good as the data in it. This guide shows how to give an AI agent — Claude Desktop, Cursor, or ChatGPT — the ability to clean, verify, and enrich B2B contact data in real time, using the open-source [YourICP MCP server](https://github.com/YourICP/mcp-server).

It takes about five minutes and no build step.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is an open standard that lets AI assistants call external tools. The YourICP MCP server exposes the YourICP enrichment API as three MCP tools:

| Tool | What it does |
|------|--------------|
| `set_token` | Sets your YourICP API token for the session |
| `submit_lookup` | Enriches contacts by email or LinkedIn URL |
| `check_lookup` | Returns the enriched, cleaned result |

## Prerequisites

- **Node.js 18+** installed ([nodejs.org](https://nodejs.org))
- A **YourICP API token** — grab one at [app.youricp.com](https://app.youricp.com)

That's it. The server runs via `npx`, so there's nothing to clone or compile.

## Quick check: run it standalone

Confirm everything works with a single command:

```bash
YOURICP_API_TOKEN=your_token_here npx @youricp/mcp
```

You should see `YourICP MCP server running on stdio`. Press `Ctrl+C` to stop — now let's wire it into an agent.

## Option 1 — Claude Desktop

Open your `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the YourICP server:

```json
{
  "mcpServers": {
    "youricp": {
      "command": "npx",
      "args": ["-y", "@youricp/mcp"],
      "env": { "YOURICP_API_TOKEN": "your_token_here" }
    }
  }
}
```

Restart Claude Desktop. You'll see the YourICP tools appear in the tools menu. Try:

> Enrich these contacts and clean the results: jane@acme.com, john@globex.com

## Option 2 — Cursor

Cursor supports MCP servers through its settings. Add the same block to Cursor's MCP config (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "youricp": {
      "command": "npx",
      "args": ["-y", "@youricp/mcp"],
      "env": { "YOURICP_API_TOKEN": "your_token_here" }
    }
  }
}
```

Reload Cursor and the tools are available in the agent panel.

## Option 3 — ChatGPT desktop

In the ChatGPT desktop app, open **Settings → Connectors / MCP**, add a new stdio server, and use:

- **Command:** `npx`
- **Arguments:** `-y @youricp/mcp`
- **Environment:** `YOURICP_API_TOKEN=your_token_here`

## A real workflow

Once connected, the agent can chain the tools on its own. A typical RevOps prompt:

> I have a list of 20 event leads with just emails. Enrich them, drop anyone without a verified company domain, and give me a table with name, title, and company.

The agent calls `submit_lookup`, polls `check_lookup`, filters the results, and hands you a clean table — no CSV round-trips, no manual verification.

## Why run enrichment through MCP?

- **The data stays in the workflow.** Enrich where you're already working instead of exporting and re-importing.
- **The agent does the cleaning.** Filtering, deduping, and formatting happen in the same turn.
- **It's open source.** The server is MIT-licensed on [GitHub](https://github.com/YourICP/mcp-server) — read it, fork it, self-host it.

## Next steps

- ⭐ Star the repo: [github.com/YourICP/mcp-server](https://github.com/YourICP/mcp-server)
- 📦 npm package: [@youricp/mcp](https://www.npmjs.com/package/@youricp/mcp)
- 📖 Docs: [youricp.com/mcp](https://youricp.com/mcp)

*Verified at the source. Enriched continuously. Always-On.*
