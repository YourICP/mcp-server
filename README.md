# YourICP MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-compatible-brightgreen.svg)](https://modelcontextprotocol.io)

The official, open-source [Model Context Protocol](https://modelcontextprotocol.io)
(MCP) server for the [YourICP](https://app.youricp.com) contact-enrichment and
audience-targeting API. It lets AI assistants such as Claude enrich contacts and
build audiences directly from a conversation.

> This is a **reference implementation** using the `stdio` transport, designed to
> run locally with clients like Claude Desktop. It authenticates with a plain API
> token — no payment, OAuth, or hosting infrastructure required. For the fully
> hosted remote connector (Streamable HTTP, OAuth 2.0 + PKCE, pay-per-use), see
> [app.youricp.com](https://app.youricp.com).

---

## Tools

| Tool | Description |
|------|-------------|
| `set_token` | Set a YourICP API token for this session |
| `submit_lookup` | Enrich contacts by email or LinkedIn URL (returns a `jobId`) |
| `check_lookup` | Poll the enrichment result for a `jobId` |

---

## Requirements

- **Node.js 18+**
- A **YourICP API token** — get one at [app.youricp.com](https://app.youricp.com)

## Quick start (no install)

Run it directly with `npx` — no clone, no global install:

```bash
YOURICP_API_TOKEN=your_token_here npx @youricp/mcp
```

## Use with Claude Desktop

Add this to your `claude_desktop_config.json` — `npx` fetches and runs the
server automatically:

```json
{
  "mcpServers": {
    "youricp": {
      "command": "npx",
      "args": ["-y", "@youricp/mcp"],
      "env": {
        "YOURICP_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

Restart Claude Desktop and the YourICP tools will appear.

## Install globally (optional)

```bash
npm install -g @youricp/mcp
YOURICP_API_TOKEN=your_token_here youricp-mcp
```

## From source

```bash
git clone https://github.com/youricp/mcp-server.git
cd mcp-server
npm install
YOURICP_API_TOKEN=your_token_here npm start
```

Or copy `.env.example` to `.env` and fill it in, then `npm start`.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `YOURICP_API_URL` | `https://app.youricp.com` | Base URL of the YourICP API |
| `YOURICP_API_TOKEN` | _(none)_ | Your YourICP API token |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md). To report a security issue, see
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © YourICP
