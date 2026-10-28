import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const triggerEvalsPath = path.join(rootDir, "tests/evals/trigger-queries.json");
const registryPath = path.join(rootDir, "skill/engineering-workflow/skill-registry.json");

test("Trigger evals dataset parses valid JSON and has required metadata", () => {
  assert.ok(fs.existsSync(triggerEvalsPath), "trigger-queries.json exists");
  const raw = fs.readFileSync(triggerEvalsPath, "utf-8");
  const data = JSON.parse(raw);

  assert.ok(data.version, "version property present");
  assert.ok(data.description, "description property present");
  assert.ok(Array.isArray(data.queries), "queries is an array");
});

test("Trigger evals dataset is exactly 20 queries and balanced between positive and negative", () => {
  const data = JSON.parse(fs.readFileSync(triggerEvalsPath, "utf-8"));
  const { queries } = data;

  assert.equal(queries.length, 20, "dataset must contain exactly 20 queries");

  const positives = queries.filter((q) => q.shouldTrigger === true);
  const negatives = queries.filter((q) => q.shouldTrigger === false);

  assert.equal(positives.length, 10, "exactly 10 positive trigger queries");
  assert.equal(negatives.length, 10, "exactly 10 negative non-trigger queries");

  // At least 6 positives in natural language without slash commands
  const nlPositives = positives.filter((q) => q.isSlashCommand === false);
  assert.ok(
    nlPositives.length >= 6,
    `expected >= 6 natural language positive queries, got ${nlPositives.length}`
  );

  // At least 6 near-miss negatives
  const nearMissNegatives = negatives.filter((q) => q.isNearMiss === true);
  assert.ok(
    nearMissNegatives.length >= 6,
    `expected >= 6 near-miss negative queries, got ${nearMissNegatives.length}`
  );

  // Unique query IDs
  const ids = new Set(queries.map((q) => q.id));
  assert.equal(ids.size, 20, "all query IDs must be unique");

  // Every positive specifies valid targetOperation
  const validOps = new Set(["setup", "execute", "review", "ux-audit"]);
  for (const pos of positives) {
    assert.ok(pos.targetOperation, `positive ${pos.id} must define targetOperation`);
    assert.ok(
      validOps.has(pos.targetOperation),
      `positive ${pos.id} targetOperation '${pos.targetOperation}' must be one of setup, execute, review, ux-audit`
    );
    assert.ok(pos.reason && pos.reason.trim().length > 0, `positive ${pos.id} must have reason`);
  }

  // Every negative has a reason and boolean isNearMiss
  for (const neg of negatives) {
    assert.equal(typeof neg.isNearMiss, "boolean", `negative ${neg.id} must define boolean isNearMiss`);
    assert.ok(neg.reason && neg.reason.trim().length > 0, `negative ${neg.id} must have reason`);
  }
});

test("Trigger evals dataset contains no references to external skills not in this repo", () => {
  const data = JSON.parse(fs.readFileSync(triggerEvalsPath, "utf-8"));
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));
  const repoSkillNames = new Set(registry.skills.map((s) => s.name));
  repoSkillNames.add("engineering-workflow");

  // Disallowed external skills that are not part of engineering-workflow or its registry
  const disallowedNames = [
    "brandkit",
    "hyperframes",
    "slideshow",
    "automation",
    "figma",
    "embedded-captions",
    "faceless-explainer",
    "motion-graphics",
    "music-to-video",
    "product-launch-video",
    "pr-to-video",
    "talking-head-recut",
    "stitch-design-taste"
  ];

  for (const q of data.queries) {
    const text = `${q.query} ${q.reason}`.toLowerCase();
    for (const name of disallowedNames) {
      assert.ok(
        !text.includes(name),
        `query ${q.id} must not reference external non-repo skill '${name}'`
      );
    }
  }
});
