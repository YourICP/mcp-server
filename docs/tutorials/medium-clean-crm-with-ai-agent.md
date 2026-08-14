<!--
  Medium draft. Distinct angle from the Dev.to how-to (setup guide).
  This one is a RevOps narrative/opinion piece.

  Publishing notes:
  - Do NOT set the Medium canonical to youricp.com/mcp — this is original content,
    not a republish. Leave canonical as the Medium URL itself.
  - Suggested tags: RevOps, Data Quality, AI Agents, Model Context Protocol, B2B Sales
  - Publish under a real person's byline and add the AI-assistance disclosure at the end.
-->

# Your CRM is decaying. I wired an AI agent to clean it in real time.

The general consensus is that B2B contact data decays at roughly 30% a year - actually the decay rate resembles a reverse Moore's law, so half of your database is likely to be stale after 23 months. In general, people buy an enrichment tool, run a big batch, feel good for a quarter — and then they're back to square one because cleaning is a project, not a habit.

I wanted to stop treating it as a project so I connected our enrichment API directly to my AI agent of choice, and now cleaning happens the moment I notice a problem — inside the same chat where I'm already working.

This is a short account of how that changed the shape of the work, how to set it up yourself, and where it does and doesn't help.

## Why the data goes bad in the first place

It helps to be precise about what "decay" actually means, because it's not one problem — it's four, and they have different half-lives.

- **People change jobs.** A verified contact from eighteen months ago may still be a real person, but the title, company, and email are now wrong. This is the biggest single source of rot in a B2B database.
- **Companies change shape.** Mergers, acquisitions, rebrands, and domain migrations quietly invalidate email domains and firmographics.
- **Emails churn.** Catch-all addresses go dark, mailboxes get deprovisioned, and deliverability degrades even when the person is still there.
- **Records were never clean to begin with.** Form fills with personal Gmail addresses, typos, and half-filled fields enter the CRM dirty and stay that way.

Each of these is fixable with enrichment and verification. The trouble is never the fix — it's the cadence. Fixing decay once a quarter, against something that drifts continuously, is always going to lose.

## The problem with batch cleaning

The traditional loop looks like this: export a segment to CSV, upload it to an enrichment vendor, wait, download the result, reconcile it against the CRM, re-import. It works, but it has two failure modes.

First, **it's high-friction, so it happens rarely.** Anything that involves a CSV round-trip is going to be a chore so the natural tendency is to delay as much as possible.

Second, **it separates cleaning from the decision.** By the time you've enriched a list, you've lost the context of *why* you needed it clean.

A seamless process is to enrich and clean *in the flow of the actual task* — while I'm building a list, prepping an event follow-up, or triaging inbound.

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

I paste a list into the chat and say:

> Enrich these 40 registrants, drop anyone without a verified business email, and give me a table with name, title, company, and company domain.

The agent calls `submit_lookup`, polls `check_lookup`, filters out the unverified rows, and hands back a clean table — in one turn. No export, no re-import, no context switch.

What makes this different from a macro or a Zap is that the next step is a conversation, not a new automation. If the table comes back and I notice something off, I just say so:

> Three of these still show old titles — re-verify the ones at Acme and Globex, and flag anyone whose email domain doesn't match their company.

The agent re-runs the relevant lookups and reconciles the result. I never left the chat, and I never had to define a rigid pipeline up front. The cleaning bent itself around the question I actually had.

The shift is subtle but real: cleaning stopped being a scheduled chore and became something that happens **whenever I notice the data is wrong**, or whenever I want to make sure my current dataset is spotless before being used. That's the difference between data hygiene as a project and data hygiene as a habit.

## How the agent chains the tools

Under the hood there's no magic — and that's the point. When I ask it to enrich a list, the agent:

1. Calls `submit_lookup` with the emails or LinkedIn URLs, which returns a job identifier.
2. Polls `check_lookup` with that identifier until the enrichment completes.
3. Applies whatever filtering and formatting I asked for — dropping unverified rows, shaping the columns, sorting — as ordinary reasoning over the returned data.

Because each step is a discrete, inspectable tool call, you can always ask the agent what it did and why. That transparency matters when the output is going to touch your system of record.

## Keeping a human in the loop

This isn't a case for letting an agent write to your CRM unattended. The model I use keeps a person on the decision and the machine on the mechanics:

- **The agent proposes; you approve the write-back.** Enrichment and verification are safe to automate. Overwriting a field in the CRM is not — that's a judgment call about which source wins.
- **Define what "clean" means before you start.** Which fields are authoritative? What happens when the enrichment disagrees with an existing value? Answer that once, tell the agent, and it will apply it consistently.
- **Spot-check the edges.** Verified-business-email filters are conservative by design; occasionally a legitimate contact gets dropped. A quick scan of what got filtered out catches those.

## Where this fits in your stack

This doesn't replace your enrichment vendor, your CRM, or your batch jobs — it changes _when_ enrichment happens. The heavy quarterly sync still has its place for wholesale coverage. What the agent adds is the in-between: the constant, low-effort, in-context cleaning that keeps the database from drifting between those big runs. Think of it as the difference between deep-cleaning your house twice a year and wiping the counter every time you cook.

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
