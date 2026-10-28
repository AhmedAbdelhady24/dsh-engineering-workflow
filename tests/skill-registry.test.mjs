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
  assert.equal(registry.$schema, "./registry.schema.json", "Registry must reference local registry.schema.json schema");
  assert(registry.version, "Registry must define version");
  assert(Array.isArray(registry.skills), "Registry must contain skills array");
  assert.equal(registry.skills.length, 21, "Registry must contain exactly 21 registered capabilities");

  const canonicalSchemaPath = path.join(rootDir, "skill/engineering-workflow/registry.schema.json");
  const mirrorSchemaPath = path.join(rootDir, "skills/engineering-workflow/registry.schema.json");
  assert(fs.existsSync(canonicalSchemaPath), "Canonical registry.schema.json must exist");
  assert(fs.existsSync(mirrorSchemaPath), "Mirror registry.schema.json must exist");
  assert.equal(
    fs.readFileSync(canonicalSchemaPath, "utf-8"),
    fs.readFileSync(mirrorSchemaPath, "utf-8"),
    "Canonical and mirror registry.schema.json must be identical"
  );

  const schema = JSON.parse(fs.readFileSync(canonicalSchemaPath, "utf-8"));
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema", "Schema must be Draft 2020-12");

  const validPolicies = ["model-invocable", "user-only", "host-dependent"];
  const validCapabilityTypes = ["external-skill", "mcp-tool", "bundled-operation"];
  const validFallbackTypes = ["principles-based", "not-applicable", "static-analysis"];
  const validStrategies = ["skills-cli", "mcp-server", "claude-plugin", "bundled"];

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

    // Installation object structure
    assert(s.installation && typeof s.installation === "object", `Skill '${s.canonicalName}' must define installation object`);
    assert(validStrategies.includes(s.installation.strategy), `Skill '${s.canonicalName}' has invalid installation.strategy: ${s.installation.strategy}`);
    assert(s.installation.command && s.installation.command.length > 5, `Skill '${s.canonicalName}' must define non-trivial installation.command`);

    // Evidence-based hosts object structure
    assert(s.hosts && typeof s.hosts === "object", `Skill '${s.canonicalName}' must define hosts object`);
    assert(Array.isArray(s.hosts.compatible) && s.hosts.compatible.length > 0, `Skill '${s.canonicalName}' must define hosts.compatible`);
    assert(Array.isArray(s.hosts.installable), `Skill '${s.canonicalName}' must define hosts.installable array`);
    assert(["none", "installer-test", "host-e2e"].includes(s.hosts.evidence), `Skill '${s.canonicalName}' must define valid hosts.evidence marker`);
    assert(Array.isArray(s.hosts.verifiedExecuted), `Skill '${s.canonicalName}' must define hosts.verifiedExecuted array`);
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

test("Skill Registry: single source of truth for routing tables (no unresolved skill names)", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  const registeredSkills = new Set(registry.skills.map((s) => s.canonicalName));
  const builtInOps = new Set(["setup", "execute", "review", "ux-audit"]);

  const filesToCheck = [
    path.join(rootDir, "README.md"),
    path.join(rootDir, "skill/engineering-workflow/SKILL.md"),
    path.join(rootDir, "skill/engineering-workflow/references/execute.md"),
    path.join(rootDir, "skill/engineering-workflow/references/skill-routing.md"),
  ];

  // Regex to extract backticked identifiers in table rows or task archetype mappings
  const skillCandidateRegex = /`([a-z0-9]+(?:-[a-z0-9]+)+)`/g;
  const nonSkillIdentifiers = new Set([
    "engineering-workflow",
    "task-recovery-ledger",
    "git-status",
    "pre-flight",
    "single-writer",
    "smallest-complete-slice",
    "model-invocable",
    "user-only",
    "principles-based",
    "chrome-devtools",
    "chrome-devtools-mcp",
    "context7-mcp",
    "not-applicable",
    "not-tested",
    "prefers-reduced-motion",
    "focus-visible",
    "sub-agents",
    "peer-agents",
    "host-dependent",
    "red-green-refactor",
  ]);

  for (const filePath of filesToCheck) {
    const content = fs.readFileSync(filePath, "utf-8");
    const matches = [...content.matchAll(skillCandidateRegex)].map((m) => m[1]);

    for (const name of matches) {
      if (nonSkillIdentifiers.has(name) || builtInOps.has(name)) {
        continue;
      }
      assert(
        registeredSkills.has(name),
        `Unresolved skill '${name}' referenced in ${path.relative(rootDir, filePath)} must be registered in skill-registry.json`
      );
    }
  }
});

test("Skill Registry: user-only capabilities enforce recommendation, fallback, and no false execution claims", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  const userOnlySkills = ["grill-with-docs", "implement", "handoff", "improve-codebase-architecture"];

  for (const name of userOnlySkills) {
    const s = registry.skills.find((sk) => sk.canonicalName === name);
    assert(s, `User-only skill '${name}' must be registered`);
    assert.equal(s.invocationPolicy, "user-only", `'${name}' must have invocationPolicy === 'user-only'`);
    assert(
      s.fallbackPolicy.toLowerCase().includes("without claiming") ||
      s.fallbackPolicy.toLowerCase().includes("never report as actually invoked") ||
      s.fallbackPolicy.toLowerCase().includes("execute must not route to implement automatically"),
      `'${name}' fallbackPolicy must forbid false execution claims or uncommanded routing`
    );
  }

  const routingMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/skill-routing.md"), "utf-8");
  const executeMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/execute.md"), "utf-8");
  const skillMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/SKILL.md"), "utf-8");

  for (const doc of [routingMd, executeMd, skillMd]) {
    assert(
      doc.includes("recommends them to the user and applies the registered built-in fallback policy") ||
      doc.includes("recommends them to the user and applies the built-in fallback"),
      "Documents must instruct the agent to recommend user-only skills and apply fallback"
    );
    assert(
      doc.includes("never reports them as Actually Invoked without explicit user action") ||
      doc.includes("never report as Actually Invoked without explicit user action") ||
      doc.includes("NEVER report user-only skills as \"Actually Invoked\" without explicit user action"),
      "Documents must forbid reporting user-only skills as Actually Invoked without explicit user action"
    );
  }

  // Verify opt-in constraint on implement
  const implementSkill = registry.skills.find((sk) => sk.canonicalName === "implement");
  assert(implementSkill, "implement must be registered");
  assert(
    routingMd.includes("execute does not auto-route to opt-in implement") ||
    routingMd.includes("execute operation must not route to it automatically"),
    "routing tables must specify that execute does not auto-route to opt-in implement"
  );
  assert(
    executeMd.includes("Execute does not route to opt-in `implement` automatically") ||
    executeMd.includes("execute operation must not route to it automatically"),
    "execute.md must specify that execute does not route to opt-in implement automatically"
  );
});

test("Skill Registry: all entries declare valid source metadata with verified git revisions", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  assert.equal(registry.skills.length, 21, "Registry must contain exactly 21 capabilities");

  for (const s of registry.skills) {
    assert(s.source, `Skill '${s.canonicalName}' must declare source metadata`);
    assert(s.source.repository.startsWith("https://github.com/"), `Skill '${s.canonicalName}' repository must be a GitHub URL`);
    if (s.capabilityType === "mcp-tool") {
      assert(s.source.package && typeof s.source.package === "string", `MCP '${s.canonicalName}' must declare source.package`);
      assert(/^\d+\.\d+\.\d+/.test(s.source.version), `MCP '${s.canonicalName}' source.version must be a semver string (got '${s.source.version}')`);
      // Assert no unpinned @latest
      assert(!s.installation.command.includes("@latest"), `MCP '${s.canonicalName}' must not use floating @latest tag`);
      assert(s.installation.command.includes(s.source.version), `MCP '${s.canonicalName}' installation must pin exact version ${s.source.version}`);
    } else {
      assert(/^[0-9a-f]{40}$/.test(s.source.revision), `Skill '${s.canonicalName}' revision must be a 40-character commit SHA`);
    }
    assert.equal(s.source.verifiedAt, "2026-10-28", `Skill '${s.canonicalName}' verifiedAt must be 2026-10-28`);

    // Evidence-based host verification: only claim installable when backed by installer test
    const validHosts = ["claude", "codex", "antigravity", "dsh"];
    for (const h of [...s.hosts.compatible, ...s.hosts.installable, ...s.hosts.verifiedExecuted]) {
      assert(validHosts.includes(h), `Host '${h}' in skill '${s.canonicalName}' must be one of: ${validHosts.join(", ")}`);
    }

    if (s.capabilityType === "mcp-tool") {
      assert.deepEqual(s.hosts.installable, [], `'${s.canonicalName}' installable must be empty without installer test coverage`);
      assert.equal(s.hosts.evidence, "none", `'${s.canonicalName}' hosts.evidence must be 'none'`);
    } else {
      assert.deepEqual(s.hosts.installable, ["codex"], `'${s.canonicalName}' installable must list only 'codex' (covered by installer test)`);
      if (s.canonicalName === "tdd" || s.canonicalName === "code-review") {
        assert.equal(s.hosts.evidence, "host-e2e", `'${s.canonicalName}' hosts.evidence must be 'host-e2e'`);
      } else {
        assert.equal(s.hosts.evidence, "installer-test", `'${s.canonicalName}' hosts.evidence must be 'installer-test'`);
      }
    }

    // Evidence-based host verification: only claim verifiedExecuted when backed by test
    if (s.canonicalName === "tdd" || s.canonicalName === "code-review") {
      assert.deepEqual(s.hosts.verifiedExecuted, ["codex"], `'${s.canonicalName}' verifiedExecuted must reflect Codex host e2e test`);
    } else {
      assert.deepEqual(s.hosts.verifiedExecuted, [], `'${s.canonicalName}' verifiedExecuted must be empty without live host test proof`);
    }
  }

  const readme = fs.readFileSync(path.join(rootDir, "README.md"), "utf-8");
  assert(readme.includes("addyosmani/agent-skills"), "README.md must list addyosmani/agent-skills among canonical upstreams");

  // Verify Package Update Policy document
  const policyPath = path.join(rootDir, "docs/PACKAGE_UPDATE_POLICY.md");
  assert(fs.existsSync(policyPath), "docs/PACKAGE_UPDATE_POLICY.md must exist");
  const policyText = fs.readFileSync(policyPath, "utf-8");
  assert(policyText.includes("Review Cadence"), "Update policy must define Review Cadence");
  assert(policyText.includes("Monthly"), "Update policy must specify Monthly review cadence");
  assert(policyText.includes("Security Out-of-Band"), "Update policy must specify security-fix bump policy");
  assert(policyText.includes("Verification Protocol"), "Update policy must specify verification gates");
});
