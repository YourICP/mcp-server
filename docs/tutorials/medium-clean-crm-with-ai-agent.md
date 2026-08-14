<!--
  Medium draft. Distinct angle from the Dev.to how-to (setup guide).
  This one is a RevOps narrative/opinion piece.

  Publishing notes:
  - Do NOT set the Medium canonical to youricp.com/mcp — this is original content,
    not a republish. Leave canonical as the Medium URL itself.
  - Suggested tags: RevOps, Data Quality, AI Agents, Model Context Protocol, B2B Sales
  - Publish under a real person's byline and add the AI-assistance disclosure at the end.
-->

# Your CRM is rotting. I wired an AI agent to clean it in real time.

Every RevOps leader knows the number and hates it: B2B contact data decays at roughly 30% a year. Titles change, people move, domains die. You buy an enrichment tool, run a big batch, feel good for a quarter — and then the rot creeps back in because cleaning is a project, not a habit.

I wanted to stop treating it as a project. So I connected our enrichment API directly to the AI agent I already use every day, and now cleaning happens the moment I notice a problem — inside the same chat where I'm already working.

Here's how, and what changed.

## The problem with batch cleaning

The traditional loop looks like this: export a segment to CSV, upload it to an enrichment vendor, wait, download the result, reconcile it against the CRM, re-import. It works, but it has two failure modes.

First, **it's high-friction, so it happens rarely.** Anything that involves a CSV round-trip gets done once a quarter at best. Between runs, the data drifts.

Second, **it separates cleaning from the decision.** By the time you've enriched a list, you've lost the context of *why* you needed it clean. The enrichment is divorced from the work.

What I wanted was to enrich and clean *in the flow of the actual task* — while I'm building a list, prepping an event follow-up, or triaging inbound.

## Enter the Model Context Protocol

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is an open standard — now supported across Claude, Cursor, and other assistants — that lets an AI agent call external tools. Instead of me copying data between systems, the agent does it.

We published our enrichment API as an open-source MCP server: [`@youricp/mcp`](https://github.com/YourICP/mcp-server). It exposes a few simple tools the agent can call on its own:

- `submit_lookup` — enrich contacts by email or LinkedIn URL
- `check_lookup` — return the verified, cleaned result

The whole thing is MIT-licensed and runs with one command. No build step.

## Setting it up (about five minutes)

You need Node.js 18+ and a YourICP API token from [app.youricp.com](https://app.youricp.com). Then, in your MCP client's config — this is the Claude Desktop version:

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

Restart the app, and the tools show up. Cursor and the ChatGPT desktop app follow the same pattern — point them at `npx -y @youricp/mcp` with the same environment variable.

## What the workflow actually feels like

Here's a real one. After a webinar, I get a list of registrants — usually just names and personal-looking emails, half of them junk. Before, that list sat in a spreadsheet until someone found time to clean it.

Now I paste it into the chat and say:

> Enrich these 40 registrants, drop anyone without a verified business email, and give me a table with name, title, company, and company domain.

The agent calls `submit_lookup`, polls `check_lookup`, filters out the unverified rows, and hands back a clean table — in one turn. No export, no re-import, no context switch. When I spot a title that looks stale, I just ask it to re-verify that one row.

The shift is subtle but real: cleaning stopped being a scheduled chore and became something that happens **whenever I notice the data is wrong**. That's the difference between data hygiene as a project and data hygiene as a habit.

## Why open source matters here

You're about to route contact data through a tool. You should be able to read exactly what it does. Our server is public on [GitHub](https://github.com/YourICP/mcp-server) — you can audit the code, fork it, or self-host it against your own credentials. There's nothing hidden between your agent and the API.

## The honest limitations

This isn't magic. The agent is only as good as the enrichment behind it, and it still needs a human to decide *what* clean means for your CRM — which fields are authoritative, what to do with conflicts. What it removes is the mechanical friction: the exports, the re-imports, the waiting. That friction is exactly what kept cleaning from happening often enough to matter.

## Try it

If your CRM is drifting between quarterly clean-ups, the fix isn't a bigger batch job — it's making cleaning cheap enough to do constantly. Wiring enrichment into the agent you already use is one way to get there.

- Repo: [github.com/YourICP/mcp-server](https://github.com/YourICP/mcp-server)
- npm: [@youricp/mcp](https://www.npmjs.com/package/@youricp/mcp)
- Docs: [youricp.com/mcp](https://youricp.com/mcp)

---

*Disclosure: this article was drafted with AI assistance and edited by a human before publishing.*
