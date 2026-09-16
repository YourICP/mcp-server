import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const serverPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "server.js"
);

// Boots the server on stdio and resolves once stderr contains `waitFor`.
// Rejects on timeout so a hung child fails the test rather than the suite.
function bootAndCollectStderr(waitFor, env = {}, timeoutMs = 5000) {
  const child = spawn("node", [serverPath], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });

  return new Promise((resolve, reject) => {
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timed out waiting for ${JSON.stringify(waitFor)}; saw: ${stderr}`));
    }, timeoutMs);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.includes(waitFor)) {
        clearTimeout(timer);
        child.kill();
        resolve(stderr);
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Sends one JSON-RPC request over stdio after the MCP initialize handshake and
// resolves with the response whose id matches.
function rpc(requests, env = {}, timeoutMs = 8000) {
  const child = spawn("node", [serverPath], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });

  return new Promise((resolve, reject) => {
    const responses = new Map();
    let buffer = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timed out; got ids ${[...responses.keys()].join(",")}`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const message = JSON.parse(line);
        if (message.id !== undefined) responses.set(message.id, message);
      }
      // Every request answered — hand them all back.
      if (requests.every((r) => responses.has(r.id))) {
        clearTimeout(timer);
        child.kill();
        resolve(responses);
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "0" },
        },
      }) + "\n"
    );
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"
    );
    for (const request of requests) {
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...request }) + "\n");
    }
  });
}

// Smoke test: the server should start on stdio and log its banner to stderr
// without crashing.
test("server boots on stdio", async () => {
  const banner = await bootAndCollectStderr("running on stdio");
  assert.match(banner, /running on stdio/);
});

// Spec docs/specs/mcp-billing-tokens.md §3.5 test 2: the new env var name is
// preferred, the old one still works and says so once.
test("YOURICP_AUTH_TOKEN is preferred and logs no deprecation notice", async () => {
  const stderr = await bootAndCollectStderr("running on stdio", {
    YOURICP_AUTH_TOKEN: "new-name",
    YOURICP_API_TOKEN: "old-name",
  });
  assert.doesNotMatch(stderr, /Deprecation notice/);
});

test("YOURICP_API_TOKEN still works and logs one deprecation notice", async () => {
  const stderr = await bootAndCollectStderr("running on stdio", {
    YOURICP_AUTH_TOKEN: "",
    YOURICP_API_TOKEN: "old-name",
  });
  assert.match(stderr, /YOURICP_API_TOKEN is deprecated/);
  assert.equal(stderr.match(/Deprecation notice/g).length, 1);
});

// Spec §3.5 test 1: both tool names work and the old one says it is deprecated.
test("set_token and set_auth_token are both registered, set_token deprecated", async () => {
  const responses = await rpc([{ id: 1, method: "tools/list", params: {} }]);
  const tools = responses.get(1).result.tools;
  const byName = new Map(tools.map((t) => [t.name, t]));

  assert.ok(byName.has("set_auth_token"), "set_auth_token should be registered");
  assert.ok(byName.has("set_token"), "set_token should still be registered");
  assert.match(byName.get("set_token").description, /deprecated/i);
  assert.doesNotMatch(byName.get("set_auth_token").description, /deprecated/i);
});

test("set_token and set_auth_token both set the auth token", async () => {
  const responses = await rpc([
    { id: 1, method: "tools/call", params: { name: "set_auth_token", arguments: { token: "abc" } } },
    { id: 2, method: "tools/call", params: { name: "set_token", arguments: { token: "def" } } },
  ]);

  for (const id of [1, 2]) {
    const result = responses.get(id).result;
    assert.equal(result.isError ?? false, false);
    assert.match(result.content[0].text, /Auth token set/);
  }
});
