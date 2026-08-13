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

// Smoke test: the server should start on stdio and log its banner to stderr
// without crashing.
test("server boots on stdio", async () => {
  const child = spawn("node", [serverPath], { stdio: ["pipe", "pipe", "pipe"] });

  const banner = await new Promise((resolve, reject) => {
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("timed out waiting for banner"));
    }, 5000);

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.includes("running on stdio")) {
        clearTimeout(timer);
        child.kill();
        resolve(stderr);
      }
    });
    child.on("error", reject);
  });

  assert.match(banner, /running on stdio/);
});
