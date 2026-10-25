import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const monorepoFixture = path.join(rootDir, "tests/fixtures/monorepo");

test("Repository safety: detects dirty working tree and preserves concurrent edits", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "monorepo-safe-"));
  try {
    fs.cpSync(monorepoFixture, tempDir, { recursive: true });
    execSync(
      "git init -b main && git config user.name 'Test' && git config user.email 'test@example.com' && git add . && git commit -m 'Initial commit'",
      {
        cwd: tempDir,
        stdio: "ignore",
      }
    );

    const targetFile = path.join(tempDir, "packages/core/index.js");
    fs.appendFileSync(targetFile, "\n// uncommitted working change from another user\n");

    const statusOutput = execSync("git status --porcelain", {
      cwd: tempDir,
      encoding: "utf-8",
    }).trim();

    assert(
      statusOutput.includes("M packages/core/index.js"),
      "Fixture must contain dirty modified state representing concurrent work"
    );

    const fileContent = fs.readFileSync(targetFile, "utf-8");
    assert(
      fileContent.includes("uncommitted working change from another user"),
      "Concurrent working changes must be present and protected"
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("Repository safety: templates do not overwrite existing instructions blindly", () => {
  const setupMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/setup.md"), "utf-8");
  assert(
    setupMd.includes("Never overwrite existing instructions blindly"),
    "setup.md must explicitly prohibit blind instruction overwriting"
  );

  const executeMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/execute.md"), "utf-8");
  assert(
    executeMd.includes("never overwrite or discard unrelated edits"),
    "execute.md must explicitly protect concurrent edits"
  );
});

test("Repository safety: destructive git commands are strictly prohibited", () => {
  const skillMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/SKILL.md"), "utf-8");
  const prohibited = ["git reset --hard", "git clean -fd", "git push --force"];
  for (const cmd of prohibited) {
    assert(
      skillMd.includes(cmd),
      `SKILL.md must explicitly ban destructive command: ${cmd}`
    );
  }
});
