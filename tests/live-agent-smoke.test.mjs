/**
 * Live Agent Host Smoke Tests (Optional / Explicit Invocability Suite)
 *
 * NOTE: These tests inspect the current execution environment for installed
 * agent host CLIs (Claude Code, OpenAI Codex, Google Antigravity, DeepSeek Harness,
 * and Skills CLI).
 *
 * Behavior:
 * - If a host CLI is detected in PATH, it executes a live, non-destructive check
 *   (e.g., `--version`) to verify runtime invocability.
 * - If a host CLI is NOT detected in PATH (such as in headless CI environments),
 *   the test skips cleanly via `t.skip(...)` without failing the suite.
 *
 * To run this suite specifically:
 *   npm run test:live-smoke
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function findExecutable(binName) {
  try {
    const isWindows = process.platform === "win32";
    const checkCmd = isWindows ? `where ${binName}` : `which ${binName}`;
    const output = execSync(checkCmd, { stdio: ["pipe", "pipe", "ignore"], encoding: "utf-8" }).trim();
    return output.split(/\r?\n/)[0] || null;
  } catch {
    return null;
  }
}

test("Live agent smoke test: Claude Code CLI invocability", (t) => {
  const bin = findExecutable("claude");
  if (!bin) {
    t.skip("Host CLI 'claude' not found in PATH; skipping live runtime check");
    return;
  }

  const output = execSync("claude --version", { encoding: "utf-8" }).trim();
  assert(output.length > 0, "Claude CLI must return version information");
  assert(
    output.toLowerCase().includes("claude") || /^\d+\.\d+/.test(output),
    `Claude CLI version output unexpected: ${output}`
  );
});

test("Live agent smoke test: OpenAI Codex CLI invocability", (t) => {
  const bin = findExecutable("codex");
  if (!bin) {
    t.skip("Host CLI 'codex' not found in PATH; skipping live runtime check");
    return;
  }

  const output = execSync("codex --version", { encoding: "utf-8" }).trim();
  assert(output.length > 0, "Codex CLI must return version information");
  assert(
    output.toLowerCase().includes("codex") || /^\d+\.\d+/.test(output),
    `Codex CLI version output unexpected: ${output}`
  );
});

test("Live agent smoke test: Google Antigravity / Gemini CLI invocability", (t) => {
  const bin = findExecutable("agy") || findExecutable("gemini");
  if (!bin) {
    t.skip("Host CLI 'agy' or 'gemini' not found in PATH; skipping live runtime check");
    return;
  }

  const cmd = path.basename(bin);
  const output = execSync(`${cmd} --version`, { encoding: "utf-8" }).trim();
  assert(output.length > 0, `${cmd} CLI must return version information`);
});

test("Live agent smoke test: DeepSeek Harness CLI invocability", (t) => {
  const bin = findExecutable("dsh");
  if (!bin) {
    t.skip("Host CLI 'dsh' not found in PATH; skipping live runtime check");
    return;
  }

  const output = execSync("dsh --version", { encoding: "utf-8" }).trim();
  assert(output.length > 0, "DSH CLI must return version information");
});

test("Live agent smoke test: Skills CLI invocability", (t) => {
  const bin = findExecutable("skills");
  if (!bin) {
    t.skip("Skills CLI 'skills' not found in PATH; skipping live runtime check");
    return;
  }

  const output = execSync("skills --version", { encoding: "utf-8" }).trim();
  assert(output.length > 0, "Skills CLI must return version information");
});
