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
    "references/ux-audit.md",
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

test("Canonical skill/ and mirrored skills/ directories remain strictly synchronized", () => {
  const canonicalDir = path.join(rootDir, "skill", "engineering-workflow");
  const mirrorDir = path.join(rootDir, "skills", "engineering-workflow");

  assert(fs.existsSync(canonicalDir), "Canonical skill/engineering-workflow must exist");
  assert(fs.existsSync(mirrorDir), "Mirror skills/engineering-workflow must exist");

  const canonicalFiles = fs.readdirSync(path.join(canonicalDir, "references"));
  const mirrorFiles = fs.readdirSync(path.join(mirrorDir, "references"));

  assert.deepEqual(canonicalFiles.sort(), mirrorFiles.sort(), "References in canonical and mirror must match exactly");

  // Check content identity
  const canonicalSkillMd = fs.readFileSync(path.join(canonicalDir, "SKILL.md"), "utf-8");
  const mirrorSkillMd = fs.readFileSync(path.join(mirrorDir, "SKILL.md"), "utf-8");
  assert.equal(canonicalSkillMd, mirrorSkillMd, "SKILL.md in canonical and mirror must be identical");

  for (const ref of canonicalFiles) {
    const cContent = fs.readFileSync(path.join(canonicalDir, "references", ref), "utf-8");
    const mContent = fs.readFileSync(path.join(mirrorDir, "references", ref), "utf-8");
    assert.equal(cContent, mContent, `Reference file '${ref}' in canonical and mirror must be identical`);
  }
});

test("Claude Plugin and Codex Marketplace manifests are valid and in sync", () => {
  const pluginJsonPath = path.join(rootDir, ".claude-plugin", "plugin.json");
  const marketplaceJsonPath = path.join(rootDir, ".claude-plugin", "marketplace.json");
  const packageJsonPath = path.join(rootDir, "package.json");

  assert(fs.existsSync(pluginJsonPath), ".claude-plugin/plugin.json must exist");
  assert(fs.existsSync(marketplaceJsonPath), ".claude-plugin/marketplace.json must exist");

  const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, "utf-8"));
  const marketplaceJson = JSON.parse(fs.readFileSync(marketplaceJsonPath, "utf-8"));
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  assert.equal(pluginJson.name, "engineering-workflow", "plugin.json name must match package name");
  assert.equal(pluginJson.version, packageJson.version, "plugin.json version must match package.json version");
  assert(Array.isArray(pluginJson.skills) && pluginJson.skills.includes("./skills/engineering-workflow"), "plugin.json must list ./skills/engineering-workflow");

  assert(Array.isArray(marketplaceJson.plugins), "marketplace.json must contain plugins array");
  const pluginEntry = marketplaceJson.plugins.find((p) => p.name === "engineering-workflow");
  assert(pluginEntry, "marketplace.json must register engineering-workflow plugin");
});

test("Architectural Decision Records (ADRs) are documented in .agents/adr", () => {
  const adrDir = path.join(rootDir, ".agents", "adr");
  assert(fs.existsSync(adrDir), ".agents/adr directory must exist");

  const adrFiles = fs.readdirSync(adrDir);
  assert(adrFiles.length >= 3, "Must have at least 3 documented ADRs");
  assert(adrFiles.some((f) => f.includes("skill-execution-contract")), "Must document skill execution contract ADR");
  assert(adrFiles.some((f) => f.includes("compaction-proof-ledger")), "Must document compaction proof ledger ADR");
  assert(adrFiles.some((f) => f.includes("ux-audit")), "Must document UX audit framework ADR");
});

