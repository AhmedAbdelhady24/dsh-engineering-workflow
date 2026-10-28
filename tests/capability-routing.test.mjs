import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const routingMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/skill-routing.md"), "utf-8");

// Mock evaluator matching the logic in references/skill-routing.md
function evaluateProjectCapabilities(fixturePath) {
  const pkgPath = path.join(fixturePath, "package.json");
  const hasPkg = fs.existsSync(pkgPath);
  let isUI = false;

  if (hasPkg) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    isUI = Boolean(deps.react || deps["react-dom"] || deps.vue || deps.svelte || deps.next);
  }

  const results = {
    tdd: "ACTIVE",
    debugging: "ACTIVE",
    codeReview: "ACTIVE",
    planning: "ACTIVE",
    uiEngineering: isUI ? "ACTIVE" : "NOT APPLICABLE",
    uiDesign: isUI ? "ACTIVE" : "NOT APPLICABLE",
    browserTesting: isUI ? "ACTIVE" : "NOT APPLICABLE",
  };
  return results;
}

test("Skill routing: pure backend projects classify UI capabilities as NOT APPLICABLE", () => {
  const backendFixture = path.join(rootDir, "tests/fixtures/backend-project");
  const caps = evaluateProjectCapabilities(backendFixture);

  assert.equal(caps.uiEngineering, "NOT APPLICABLE");
  assert.equal(caps.uiDesign, "NOT APPLICABLE");
  assert.equal(caps.browserTesting, "NOT APPLICABLE");
  assert.equal(caps.tdd, "ACTIVE");
  assert.equal(caps.codeReview, "ACTIVE");
});

test("Skill routing: frontend projects activate UI capabilities", () => {
  const frontendFixture = path.join(rootDir, "tests/fixtures/frontend-project");
  const caps = evaluateProjectCapabilities(frontendFixture);

  assert.equal(caps.uiEngineering, "ACTIVE");
  assert.equal(caps.uiDesign, "ACTIVE");
  assert.equal(caps.browserTesting, "ACTIVE");
});

test("Skill routing: enforces no silent downgrade when a mandatory skill is missing", () => {
  assert(routingMd.includes("Do NOT silently downgrade standards."), "Must forbid silent downgrades");
  assert(routingMd.includes("Do NOT hallucinate that the skill was executed."), "Must forbid hallucinated skills");
  assert(routingMd.includes("npx skills add"), "Must propose supported installation command");
});

test("Skill routing: Matt Pocock engineering skills verified by canonical names", () => {
  const expectedPocockSkills = [
    "grilling",
    "grill-with-docs",
    "domain-modeling",
    "codebase-design",
    "implement",
    "handoff",
    "improve-codebase-architecture",
  ];

  for (const skillName of expectedPocockSkills) {
    assert(
      routingMd.includes(`\`${skillName}\``),
      `skill-routing.md must reference Matt Pocock skill: ${skillName}`
    );
  }
});

test("Skill routing: enforces the Skill Execution Contract", () => {
  assert(
    routingMd.includes("Skill Execution Contract"),
    "Must document Skill Execution Contract"
  );
  assert(
    routingMd.includes("Do not treat mentioning a skill in the routing documentation as execution"),
    "Must explicitly forbid treating documentation mention as execution"
  );
  assert(
    routingMd.toLowerCase().includes("skills actually invoked") && routingMd.toLowerCase().includes("skills merely considered"),
    "Must distinguish skills actually invoked from skills merely considered"
  );
});

test("Skill routing: defines Task-to-Skill Consideration Matrix across archetypes", () => {
  const archetypes = [
    "New feature with unclear requirements",
    "Architecture planning",
    "Feature implementation",
    "Bug fixing",
    "Engineering handoff",
    "UX audit",
    "Simple change",
  ];

  for (const arch of archetypes) {
    assert(
      routingMd.includes(arch),
      `skill-routing.md must include task archetype: ${arch}`
    );
  }

  // Verify task-specific skill mappings
  assert(routingMd.includes("grilling") && routingMd.includes("domain-modeling"), "Unclear requirements routes to grilling & domain-modeling");
  assert(routingMd.includes("codebase-design") && routingMd.includes("planning-and-task-breakdown"), "Architecture planning routes to codebase-design & planning");
  assert(routingMd.includes("implement") && routingMd.includes("ponytail") && routingMd.includes("test-driven-development"), "Feature implementation routes to implement, ponytail & TDD");
  assert(routingMd.includes("systematic-debugging"), "Bug fixing routes to systematic debugging");
  assert(routingMd.includes("handoff"), "Engineering handoff routes to handoff skill");
});

test("Skill routing: Ponytail role defined as minimal, focused, and complete implementation", () => {
  assert(
    routingMd.toLowerCase().includes("minimal") && routingMd.toLowerCase().includes("focused") && routingMd.toLowerCase().includes("complete"),
    "Ponytail must be defined as keeping implementations minimal, focused, and complete"
  );
});

test("Skill routing: execute completion report requires distinguishing considered vs. invoked vs. blocked skills", () => {
  const executeMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/execute.md"), "utf-8");
  assert(executeMd.includes("Skills Execution Summary"), "execute.md must require Skills Execution Summary in report");
  assert(executeMd.includes("Skills Considered"), "execute.md must report Skills Considered");
  assert(executeMd.includes("Skills Actually Invoked"), "execute.md must report Skills Actually Invoked");
  assert(executeMd.includes("Skills Missing / Blocked"), "execute.md must report Skills Missing / Blocked");
});
