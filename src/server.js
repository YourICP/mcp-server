#!/usr/bin/env node
/**
 * YourICP MCP Server — reference open-source implementation.
 *
 * A minimal, stdio-based Model Context Protocol server that exposes the
 * YourICP contact-enrichment API to MCP-compatible AI clients such as
 * Claude Desktop.
 *
 * TWO KINDS OF TOKEN, NEVER THE BARE WORD
 * ---------------------------------------
 * YourICP uses "token" for two unrelated things, and this file only ever deals
 * with the first:
 *   - AUTH TOKEN    the credential proving who you are (what this server sets)
 *   - BILLING TOKEN the prepaid currency YourICP work is charged in (100 = $1.00)
 *
 * Configuration (environment variables):
 *   YOURICP_API_URL     Base URL of the YourICP API (default: https://app.youricp.com)
 *   YOURICP_AUTH_TOKEN  Your YourICP auth token. Get one at https://app.youricp.com
 *   YOURICP_API_TOKEN   Deprecated alias for YOURICP_AUTH_TOKEN.
 *
 * Run it:
 *   YOURICP_AUTH_TOKEN=xxxx node src/server.js
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = (process.env.YOURICP_API_URL ?? "https://app.youricp.com").replace(/\/$/, "");

// YOURICP_AUTH_TOKEN is the name; YOURICP_API_TOKEN keeps working because
// existing installs set it in their client config and a hard cutover would
// break every one of them on upgrade. The notice fires once per process, so it
// is visible without drowning stderr.
function readAuthTokenFromEnv() {
  if (process.env.YOURICP_AUTH_TOKEN) return process.env.YOURICP_AUTH_TOKEN;
  if (process.env.YOURICP_API_TOKEN) {
    console.error(
      "Deprecation notice: YOURICP_API_TOKEN is deprecated — rename it to " +
        "YOURICP_AUTH_TOKEN. The old name still works for now."
    );
    return process.env.YOURICP_API_TOKEN;
  }
  return "";
}

// The auth token comes from the environment, or is set at runtime with the
// `set_auth_token` tool.
let authToken = readAuthTokenFromEnv();

/** Small helper around the YourICP REST API. */
async function api(path, { method = "GET", body } = {}) {
  if (!authToken) {
    throw new Error(
      "No auth token configured. Set YOURICP_AUTH_TOKEN, or call the `set_auth_token` tool first."
    );
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${authToken}`,
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

// --- set_auth_token, and its deprecated alias -----------------------------
// Both names run the same handler. An MCP tool name is a wire contract —
// clients and saved agent instructions already say `set_token` — so it stays
// callable and is marked deprecated in its description instead of removed.

function setAuthToken(token) {
  authToken = token.trim();
  return { content: [{ type: "text", text: "Auth token set for this session." }] };
}

server.tool(
  "set_auth_token",
  "Set the YourICP auth token for this session. This is your API credential, not " +
    "YourICP billing tokens. Get one at https://app.youricp.com.",
  { token: z.string().min(1).describe("Your YourICP auth token") },
  async ({ token }) => setAuthToken(token)
);

server.tool(
  "set_token",
  "Deprecated — call set_auth_token instead. Sets the YourICP auth token for this session.",
  { token: z.string().min(1).describe("Your YourICP auth token") },
  async ({ token }) => setAuthToken(token)
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
