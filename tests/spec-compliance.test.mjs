import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const skillDir = fs.existsSync(path.join(rootDir, "skill", "engineering-workflow"))
  ? path.join(rootDir, "skill", "engineering-workflow")
  : path.join(rootDir, "skills", "engineering-workflow");
const skillMdPath = path.join(skillDir, "SKILL.md");

test("Agent Skills specification: valid frontmatter and naming", () => {
  assert(fs.existsSync(skillMdPath), "SKILL.md must exist at root of skill folder");
  const content = fs.readFileSync(skillMdPath, "utf-8");

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert(match, "SKILL.md must begin with YAML frontmatter enclosed in '---'");

  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/^name:\s*([a-z0-9-]+)\s*$/m);
  assert(nameMatch, "Frontmatter must contain valid 'name' (lowercase alphanumeric with hyphens)");
  assert.equal(nameMatch[1], "engineering-workflow");

  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  assert(descMatch, "Frontmatter must contain 'description'");
  assert(descMatch[1].trim().length >= 20, "Description must be comprehensive (>= 20 chars)");
});

test("Agent Skills specification: all referenced documents exist and are populated", () => {
  const content = fs.readFileSync(skillMdPath, "utf-8");
  const refLinks = [...content.matchAll(/\[.*?\]\((references\/[a-zA-Z0-9_-]+\.md)\)/g)].map((m) => m[1]);
  assert(refLinks.length >= 5, "SKILL.md must reference at least 5 modular guides");

  const expectedRefs = [
    "references/setup.md",
    "references/execute.md",
    "references/review.md",
    "references/skill-routing.md",
    "references/mcps.md",
    "references/context-recovery.md",
    "references/agent-compatibility.md",
  ];

  for (const expected of expectedRefs) {
    const fullPath = path.join(skillDir, expected);
    assert(fs.existsSync(fullPath), `Reference file must exist on disk: ${expected}`);
    const stat = fs.statSync(fullPath);
    assert(stat.size > 200, `Reference file must not be empty or trivial: ${expected}`);
  }
});

test("Zero DSH-specific plugin/daemon execution infrastructure in universal skill", () => {
  const allFiles = fs.readdirSync(path.join(skillDir, "references")).map((f) => path.join(skillDir, "references", f));
  allFiles.push(skillMdPath);

  const bannedKeywords = [
    "@deepseek-ai/dsh-agent-preset",
    "cordis.patch.yml",
    "DSH_ENGINEERING_RECOVERY_TEST",
    "ctx.on(\"session/event\"",
    "ctx.on(\"agent/pre-step\"",
  ];

  for (const filePath of allFiles) {
    const text = fs.readFileSync(filePath, "utf-8");
    for (const banned of bannedKeywords) {
      assert(
        !text.includes(banned),
        `Found obsolete DSH runtime plugin code '${banned}' in ${path.relative(rootDir, filePath)}`
      );
    }
  }
});
