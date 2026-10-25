#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const skillDir = fs.existsSync(path.join(rootDir, "skill", "engineering-workflow"))
  ? path.join(rootDir, "skill", "engineering-workflow")
  : path.join(rootDir, "skills", "engineering-workflow");
const skillMdPath = path.join(skillDir, "SKILL.md");

console.log("🔍 Validating Agent Skills specification compliance...");
console.log(`   Path: ${skillMdPath}`);

if (!fs.existsSync(skillMdPath)) {
  console.error(`❌ Missing SKILL.md at ${skillMdPath}`);
  process.exit(1);
}

const content = fs.readFileSync(skillMdPath, "utf-8");

// 1. Verify YAML frontmatter
const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!frontmatterMatch) {
  console.error("❌ SKILL.md is missing YAML frontmatter (enclosed by '---').");
  process.exit(1);
}

const frontmatterBlock = frontmatterMatch[1];
const nameMatch = frontmatterBlock.match(/^name:\s*([a-z0-9-]+)\s*$/m);
const descMatch = frontmatterBlock.match(/^description:\s*(.+)$/m);

if (!nameMatch) {
  console.error("❌ Frontmatter missing valid 'name' field (must be lowercase alphanumeric + dashes).");
  process.exit(1);
}

if (!descMatch || descMatch[1].trim().length < 10) {
  console.error("❌ Frontmatter missing a meaningful 'description' field (at least 10 chars).");
  process.exit(1);
}

console.log(`   ✓ Name: ${nameMatch[1]}`);
console.log(`   ✓ Description: ${descMatch[1].trim().substring(0, 60)}...`);

// 2. Verify References
const refLinks = [...content.matchAll(/\[.*?\]\((references\/[a-zA-Z0-9_-]+\.md)\)/g)].map((m) => m[1]);
const uniqueRefs = [...new Set(refLinks)];

console.log(`   Found ${uniqueRefs.length} linked reference documents.`);

let missingRefs = 0;
for (const relRef of uniqueRefs) {
  const fullRefPath = path.join(skillDir, relRef);
  if (!fs.existsSync(fullRefPath)) {
    console.error(`❌ Linked reference does not exist: ${relRef}`);
    missingRefs++;
  } else {
    const refStats = fs.statSync(fullRefPath);
    if (refStats.size === 0) {
      console.error(`❌ Linked reference is empty: ${relRef}`);
      missingRefs++;
    } else {
      console.log(`   ✓ Reference: ${relRef} (${refStats.size} bytes)`);
    }
  }
}

if (missingRefs > 0) {
  console.error(`❌ ${missingRefs} reference link(s) failed validation.`);
  process.exit(1);
}

// 3. Verify Operations router
const requiredOps = ["setup", "execute", "review"];
for (const op of requiredOps) {
  if (!content.includes(op)) {
    console.error(`❌ SKILL.md does not document operation: '${op}'`);
    process.exit(1);
  }
  console.log(`   ✓ Operation router includes: ${op}`);
}

console.log("✅ All Agent Skills specification checks passed cleanly!");
