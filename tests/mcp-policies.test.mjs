import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const mcpsMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/mcps.md"), "utf-8");

test("MCP policy: all installations and connections require user approval", () => {
  assert(mcpsMd.includes("Human Approval Gate"), "mcps.md must establish human approval gate");
  assert(mcpsMd.includes("Zero Embedded Secrets"), "mcps.md must prohibit embedded secrets");
});

test("Context7 MCP: baseline documentation rules defined accurately", () => {
  assert(mcpsMd.includes("Context7"), "mcps.md must include Context7");
  assert(mcpsMd.includes("Unfamiliar third-party framework or SDK APIs"), "Context7 must cover third-party APIs");
  assert(mcpsMd.includes("Familiar standard library methods"), "Context7 must forbid querying standard library");
  assert(mcpsMd.includes("resolve-library-id"), "Context7 must document resolve-library-id tool");
  assert(mcpsMd.includes("query-docs"), "Context7 must document query-docs tool");
});

test("Chrome DevTools MCP: browser testing rules defined accurately", () => {
  assert(mcpsMd.includes("Chrome DevTools MCP"), "mcps.md must include Chrome DevTools MCP");
  assert(mcpsMd.includes("chrome-devtools-mcp"), "mcps.md must cite official package name");
  assert(mcpsMd.includes("isolated testing profile"), "Chrome DevTools must specify isolated testing profile");
});

test("Host configurations: provided for Antigravity, DSH, Codex, and Claude Code", () => {
  const hosts = ["Antigravity", "DeepSeek Harness", "OpenAI Codex", "Claude Code"];
  for (const host of hosts) {
    assert(mcpsMd.includes(host), `mcps.md must contain configuration instructions for: ${host}`);
  }
});
