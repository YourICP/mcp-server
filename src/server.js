#!/usr/bin/env node
/**
 * YourICP MCP Server — reference open-source implementation.
 *
 * A minimal, stdio-based Model Context Protocol server that exposes the
 * YourICP contact-enrichment API to MCP-compatible AI clients such as
 * Claude Desktop.
 *
 * Configuration (environment variables):
 *   YOURICP_API_URL    Base URL of the YourICP API (default: https://app.youricp.com)
 *   YOURICP_API_TOKEN  Your YourICP API token. Get one at https://app.youricp.com
 *
 * Run it:
 *   YOURICP_API_TOKEN=xxxx node src/server.js
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = (process.env.YOURICP_API_URL ?? "https://app.youricp.com").replace(/\/$/, "");

// The token can be provided via env or set at runtime with the `set_token` tool.
let apiToken = process.env.YOURICP_API_TOKEN ?? "";

/** Small helper around the YourICP REST API. */
async function api(path, { method = "GET", body } = {}) {
  if (!apiToken) {
    throw new Error(
      "No API token configured. Set YOURICP_API_TOKEN, or call the `set_token` tool first."
    );
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`YourICP API ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

const server = new McpServer({
  name: "youricp-mcp-server",
  version: "0.1.0",
});

server.tool(
  "set_token",
  "Set the YourICP API token for this session. Get one at https://app.youricp.com.",
  { token: z.string().min(1).describe("Your YourICP API token") },
  async ({ token }) => {
    apiToken = token.trim();
    return { content: [{ type: "text", text: "API token set for this session." }] };
  }
);

server.tool(
  "submit_lookup",
  "Enrich one or more contacts by email address or LinkedIn URL. Returns a jobId to poll with check_lookup.",
  {
    emails: z.array(z.string().email()).optional().describe("Contact email addresses to enrich"),
    linkedin_urls: z.array(z.string().url()).optional().describe("LinkedIn profile URLs to enrich"),
  },
  async ({ emails = [], linkedin_urls = [] }) => {
    if (emails.length === 0 && linkedin_urls.length === 0) {
      throw new Error("Provide at least one email or LinkedIn URL.");
    }
    const data = await api("/api/enrich/submit", {
      method: "POST",
      body: { emails, linkedin_urls },
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "check_lookup",
  "Poll the result of an enrichment job created with submit_lookup.",
  { jobId: z.string().min(1).describe("The jobId returned by submit_lookup") },
  async ({ jobId }) => {
    const data = await api(`/api/enrich/result/${encodeURIComponent(jobId)}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logging; stdout is reserved for the MCP protocol.
  console.error("YourICP MCP server running on stdio.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
