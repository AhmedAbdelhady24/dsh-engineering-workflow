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

test("Skill Registry: schema validity, taxonomy, and mandatory skill fields", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  assert(registry.version, "Registry must define version");
  assert(Array.isArray(registry.skills), "Registry must contain skills array");
  assert(registry.skills.length >= 10, "Registry must contain at least 10 registered capabilities");

  const validPolicies = ["model-invocable", "user-only", "host-dependent"];
  const validCapabilityTypes = ["external-skill", "mcp-tool", "bundled-operation"];
  const validFallbackTypes = ["principles-based", "not-applicable", "static-analysis"];

  for (const s of registry.skills) {
    assert(s.canonicalName && typeof s.canonicalName === "string", `Skill missing valid canonicalName: ${JSON.stringify(s)}`);
    assert(validCapabilityTypes.includes(s.capabilityType), `Skill '${s.canonicalName}' has invalid capabilityType: ${s.capabilityType}`);
    assert(s.upstream && s.upstream.startsWith("https://github.com/"), `Skill '${s.canonicalName}' missing valid GitHub upstream URL`);
    assert(s.purpose && s.purpose.length > 15, `Skill '${s.canonicalName}' missing comprehensive purpose`);
    assert(Array.isArray(s.triggerConditions) && s.triggerConditions.length > 0, `Skill '${s.canonicalName}' must list triggerConditions`);
    assert(validPolicies.includes(s.invocationPolicy), `Skill '${s.canonicalName}' has invalid invocationPolicy: ${s.invocationPolicy}`);
    assert(validFallbackTypes.includes(s.fallbackType), `Skill '${s.canonicalName}' has invalid fallbackType: ${s.fallbackType}`);
    assert(s.fallbackPolicy && s.fallbackPolicy.length > 10, `Skill '${s.canonicalName}' must define explicit fallbackPolicy`);
    assert(s.executionEvidence && s.executionEvidence.length > 10, `Skill '${s.canonicalName}' must define executionEvidence requirements`);
  }
});

test("Skill Registry: duplicate canonical name detection", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  const names = new Set();
  for (const s of registry.skills) {
    assert(!names.has(s.canonicalName), `Duplicate canonicalName detected in skill registry: '${s.canonicalName}'`);
    names.add(s.canonicalName);
  }
});

test("Skill Registry: dependency validation and invalid reference checks", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  const registeredNames = new Set(registry.skills.map((s) => s.canonicalName));
  const knownMcpServers = new Set(["Chrome DevTools MCP", "Context7"]);

  for (const s of registry.skills) {
    for (const dep of s.dependencies) {
      assert.notEqual(dep, s.canonicalName, `Skill '${s.canonicalName}' cannot depend on itself`);
      const isRegisteredSkill = registeredNames.has(dep);
      const isKnownMcp = knownMcpServers.has(dep);
      assert(
        isRegisteredSkill || isKnownMcp,
        `Skill '${s.canonicalName}' has unresolvable dependency: '${dep}'`
      );
    }

    for (const conflict of s.conflicts) {
      assert.notEqual(conflict, s.canonicalName, `Skill '${s.canonicalName}' cannot declare conflict with itself`);
    }
  }
});

test("Skill Registry: Ponytail canonical source and fallback definition", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  const ponytail = registry.skills.find((s) => s.canonicalName === "ponytail");

  assert(ponytail, "Ponytail must be registered in skill-registry.json");
  assert.equal(ponytail.capabilityType, "external-skill", "Ponytail must be classified as external-skill");
  assert(ponytail.upstream.includes("DietrichGebert/ponytail"), "Ponytail upstream must be DietrichGebert/ponytail");
  assert.equal(ponytail.invocationPolicy, "model-invocable", "Ponytail must be model-invocable");
  assert.equal(ponytail.fallbackType, "principles-based", "Ponytail fallback must be principles-based");
  assert(ponytail.fallbackPolicy.includes("7-Rung"), "Ponytail fallback must enforce 7-Rung Decision Ladder directly");
  assert(ponytail.fallbackPolicy.toLowerCase().includes("without claiming"), "Ponytail fallback must forbid falsely claiming skill invocation");
});

test("Skill Registry: Matt Pocock skills, grill-with-docs dependencies, and user-only invocation", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));

  const modelInvocableSkills = ["grilling", "domain-modeling", "codebase-design", "tdd", "diagnosing-bugs", "code-review"];
  for (const name of modelInvocableSkills) {
    const s = registry.skills.find((sk) => sk.canonicalName === name);
    assert(s, `Matt Pocock skill '${name}' must be registered`);
    assert(s.upstream.includes("mattpocock/skills"), `'${name}' upstream must cite mattpocock/skills`);
    assert.equal(s.invocationPolicy, "model-invocable", `'${name}' must be classified as model-invocable`);
    assert.equal(s.capabilityType, "external-skill", `'${name}' must be classified as external-skill`);
  }

  const grillWithDocs = registry.skills.find((sk) => sk.canonicalName === "grill-with-docs");
  assert(grillWithDocs, "grill-with-docs must be registered");
  assert.equal(grillWithDocs.invocationPolicy, "user-only", "grill-with-docs must be user-only");
  assert(grillWithDocs.dependencies.includes("domain-modeling"), "grill-with-docs must declare domain-modeling dependency");
  assert(grillWithDocs.dependencies.includes("grilling"), "grill-with-docs must declare grilling dependency");
  assert(grillWithDocs.dependencies.includes("Context7"), "grill-with-docs must declare Context7 dependency");
});

test("Skill Registry: verified upstream repositories for Anthropic frontend-design and UI/UX skills", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));

  const frontendDesign = registry.skills.find((s) => s.canonicalName === "frontend-design");
  assert(frontendDesign, "frontend-design must be registered");
  assert(frontendDesign.upstream.includes("anthropics/skills"), "frontend-design upstream must be anthropics/skills");
  assert.equal(frontendDesign.capabilityType, "external-skill", "frontend-design must be external-skill");

  const uiUxProMax = registry.skills.find((s) => s.canonicalName === "ui-ux-pro-max");
  assert(uiUxProMax, "ui-ux-pro-max must be registered");
  assert(uiUxProMax.upstream.includes("nextlevelbuilder/ui-ux-pro-max-skill"), "ui-ux-pro-max upstream must be nextlevelbuilder/ui-ux-pro-max-skill");
  assert.equal(uiUxProMax.capabilityType, "external-skill", "ui-ux-pro-max must be external-skill");

  const makeFeelBetter = registry.skills.find((s) => s.canonicalName === "make-interfaces-feel-better");
  assert(makeFeelBetter, "make-interfaces-feel-better must be registered");
  assert(makeFeelBetter.upstream.includes("jakubkrehel/make-interfaces-feel-better"), "make-interfaces-feel-better upstream must be jakubkrehel/make-interfaces-feel-better");
  assert.equal(makeFeelBetter.capabilityType, "external-skill", "make-interfaces-feel-better must be external-skill");

  const breakUi = registry.skills.find((s) => s.canonicalName === "break-ui");
  assert(breakUi, "break-ui must be registered");
  assert(breakUi.upstream.includes("emilkowalski/skills"), "break-ui upstream must be emilkowalski/skills");
  assert.equal(breakUi.capabilityType, "external-skill", "break-ui must be external-skill");
});

test("Skill Registry: Testing and debugging mutual conflict declarations", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));

  const tddPocock = registry.skills.find((s) => s.canonicalName === "tdd");
  assert(tddPocock.conflicts.includes("test-driven-development"), "tdd must declare conflict with test-driven-development");

  const diagPocock = registry.skills.find((s) => s.canonicalName === "diagnosing-bugs");
  assert(diagPocock.conflicts.includes("systematic-debugging"), "diagnosing-bugs must declare conflict with systematic-debugging");
});
