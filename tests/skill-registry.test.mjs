import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const canonicalRegistryPath = path.join(rootDir, "skill/engineering-workflow/skill-registry.json");
const mirrorRegistryPath = path.join(rootDir, "skills/engineering-workflow/skill-registry.json");

test("Skill Registry: canonical and mirror registry files exist and are identical", () => {
  assert(fs.existsSync(canonicalRegistryPath), "Canonical skill-registry.json must exist");
  assert(fs.existsSync(mirrorRegistryPath), "Mirror skill-registry.json must exist");

  const canonicalRaw = fs.readFileSync(canonicalRegistryPath, "utf-8");
  const mirrorRaw = fs.readFileSync(mirrorRegistryPath, "utf-8");

  assert.equal(canonicalRaw, mirrorRaw, "Canonical and mirror skill-registry.json must be identical");
});

test("Skill Registry: schema validity and mandatory skill fields", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  assert(registry.version, "Registry must define version");
  assert(Array.isArray(registry.skills), "Registry must contain skills array");
  assert(registry.skills.length >= 10, "Registry must contain at least 10 registered capabilities");

  const validPolicies = ["model-invocable", "user-only", "host-dependent"];

  for (const s of registry.skills) {
    assert(s.canonicalName && typeof s.canonicalName === "string", `Skill missing valid canonicalName: ${JSON.stringify(s)}`);
    assert(s.upstream && typeof s.upstream === "string", `Skill '${s.canonicalName}' missing upstream repository URL`);
    assert(s.purpose && s.purpose.length > 15, `Skill '${s.canonicalName}' missing comprehensive purpose`);
    assert(Array.isArray(s.triggerConditions) && s.triggerConditions.length > 0, `Skill '${s.canonicalName}' must list triggerConditions`);
    assert(validPolicies.includes(s.invocationPolicy), `Skill '${s.canonicalName}' has invalid invocationPolicy: ${s.invocationPolicy}`);
    assert(s.fallbackPolicy && s.fallbackPolicy.length > 10, `Skill '${s.canonicalName}' must define explicit fallbackPolicy`);
    assert(s.executionEvidence && s.executionEvidence.length > 10, `Skill '${s.canonicalName}' must define executionEvidence requirements`);
  }
});

test("Skill Registry: Ponytail canonical source and fallback definition", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  const ponytail = registry.skills.find((s) => s.canonicalName === "ponytail");

  assert(ponytail, "Ponytail must be registered in skill-registry.json");
  assert(ponytail.upstream.includes("DietrichGebert/ponytail"), "Ponytail upstream must be DietrichGebert/ponytail");
  assert.equal(ponytail.invocationPolicy, "model-invocable", "Ponytail must be model-invocable");
  assert(ponytail.fallbackPolicy.includes("7-Rung"), "Ponytail fallback must enforce 7-Rung Decision Ladder directly");
  assert(ponytail.fallbackPolicy.toLowerCase().includes("without claiming"), "Ponytail fallback must forbid falsely claiming skill invocation");
});

test("Skill Registry: Matt Pocock skills invocation policies and upstreams", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));

  const modelInvocableSkills = ["grilling", "domain-modeling", "codebase-design", "tdd", "diagnosing-bugs", "code-review"];
  for (const name of modelInvocableSkills) {
    const s = registry.skills.find((sk) => sk.canonicalName === name);
    assert(s, `Matt Pocock skill '${name}' must be registered`);
    assert(s.upstream.includes("mattpocock/skills"), `'${name}' upstream must cite mattpocock/skills`);
    assert.equal(s.invocationPolicy, "model-invocable", `'${name}' must be classified as model-invocable`);
  }

  const userOnlySkills = ["grill-with-docs"];
  for (const name of userOnlySkills) {
    const s = registry.skills.find((sk) => sk.canonicalName === name);
    assert(s, `Matt Pocock workflow '${name}' must be registered`);
    assert.equal(s.invocationPolicy, "user-only", `'${name}' must be classified as user-only`);
  }
});

test("Skill Registry: Testing and debugging mutual conflict declarations", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));

  const tddPocock = registry.skills.find((s) => s.canonicalName === "tdd");
  assert(tddPocock.conflicts.includes("test-driven-development"), "tdd must declare conflict with test-driven-development");

  const diagPocock = registry.skills.find((s) => s.canonicalName === "diagnosing-bugs");
  assert(diagPocock.conflicts.includes("systematic-debugging"), "diagnosing-bugs must declare conflict with systematic-debugging");
});
