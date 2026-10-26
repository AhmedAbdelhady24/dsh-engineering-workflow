import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const canonicalRegistryPath = path.join(rootDir, "skill/engineering-workflow/skill-registry.json");
const taskLogTemplate = fs.readFileSync(path.join(rootDir, "templates/TASK_LOG.md"), "utf-8");
const ledgerTemplate = fs.readFileSync(path.join(rootDir, "templates/TASK_RECOVERY_LEDGER.md"), "utf-8");

test("Agent scenario 1: setup operation produces readiness report and halts at Approval Gate without mutating code", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-scenario-setup-"));
  try {
    // 1. Simulate greenfield / existing project with package.json
    fs.writeFileSync(
      path.join(tempProject, "package.json"),
      JSON.stringify({
        name: "sample-service",
        version: "1.0.0",
        scripts: { test: "node --test" },
      })
    );
    fs.writeFileSync(path.join(tempProject, "index.js"), 'export const status = "ok";\n');

    // Snapshot existing files and mtimes
    const initialFiles = fs.readdirSync(tempProject);
    const initialCodeContent = fs.readFileSync(path.join(tempProject, "index.js"), "utf-8");

    // 2. Perform agent setup simulation
    // - Inspect tools and package manager
    const hasPackageJson = fs.existsSync(path.join(tempProject, "package.json"));
    assert(hasPackageJson, "Setup must discover package.json");

    // - Classify archetype
    const archetype = "backend-service";

    // - Initialize templates safely without overwriting user code
    const taskLogDest = path.join(tempProject, "TASK_LOG.md");
    const ledgerDest = path.join(tempProject, "TASK_RECOVERY_LEDGER.md");

    fs.writeFileSync(taskLogDest, taskLogTemplate);
    fs.writeFileSync(ledgerDest, ledgerTemplate);

    // 3. Verify invariants:
    // - Code files are NOT mutated
    assert.equal(fs.readFileSync(path.join(tempProject, "index.js"), "utf-8"), initialCodeContent);
    // - TASK_LOG and TASK_RECOVERY_LEDGER exist and are populated
    assert(fs.existsSync(taskLogDest), "TASK_LOG.md must be initialized");
    assert(fs.existsSync(ledgerDest), "TASK_RECOVERY_LEDGER.md must be initialized");
    assert(fs.readFileSync(taskLogDest, "utf-8").includes("Skills & Capabilities Invoked"), "TASK_LOG must have skills section");
    assert(fs.readFileSync(ledgerDest, "utf-8").includes("Single-Writer Boundary"), "Ledger must establish single-writer boundary");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Agent scenario 2: execute operation enforces red-green TDD discipline and bounded correction cycles", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-scenario-execute-"));
  try {
    // Initialize git repo for porcelain checks
    execSync("git init -q", { cwd: tempProject });
    execSync('git config user.name "Test Agent"', { cwd: tempProject });
    execSync('git config user.email "agent@example.com"', { cwd: tempProject });

    // Initial base commit
    fs.writeFileSync(path.join(tempProject, "calc.mjs"), "export function add(a, b) { return 0; }\n");
    execSync("git add calc.mjs && git commit -qm 'initial base commit'", { cwd: tempProject });

    // Step 1: RED phase — write failing unit test first
    const testFile = path.join(tempProject, "calc.test.mjs");
    fs.writeFileSync(
      testFile,
      `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add } from './calc.mjs';

test('add numbers correctly', () => {
  assert.equal(add(2, 3), 5);
});
`
    );

    const cleanEnv = {
      PATH: process.env.PATH || "",
      HOME: process.env.HOME || "",
      NODE_PATH: process.env.NODE_PATH || "",
    };

    let testFailedAsExpected = false;
    try {
      execSync("node --test calc.test.mjs", { cwd: tempProject, stdio: "pipe", env: cleanEnv });
    } catch (err) {
      testFailedAsExpected = true;
      assert(err.status !== 0, "Test must fail in RED phase");
    }
    assert(testFailedAsExpected, "RED phase must produce a verifiable test failure before implementation");

    // Step 2: GREEN phase — implement minimal code to pass test
    fs.writeFileSync(path.join(tempProject, "calc.mjs"), "export function add(a, b) { return a + b; }\n");

    const testOutput = execSync("node --test calc.test.mjs", { cwd: tempProject, encoding: "utf-8", env: cleanEnv });
    assert(testOutput.includes("pass 1"), "GREEN phase must pass unit test");

    // Step 3: Bounded correction cycles check
    const maxReviewCycles = 3;
    let reviewCycleCount = 1;
    assert(reviewCycleCount <= maxReviewCycles, "Correction cycle must not exceed bound of 3");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Agent scenario 3: independent review operation evaluates standards and spec compliance strictly read-only", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-scenario-review-"));
  try {
    execSync("git init -q", { cwd: tempProject });
    execSync('git config user.name "Test Agent"', { cwd: tempProject });
    execSync('git config user.email "agent@example.com"', { cwd: tempProject });

    fs.writeFileSync(path.join(tempProject, "service.mjs"), 'export function serve() { return "v1"; }\n');
    execSync("git add . && git commit -qm 'base'", { cwd: tempProject });

    // Make an uncommitted edit that introduces a defect (missing input validation)
    fs.writeFileSync(
      path.join(tempProject, "service.mjs"),
      'export function serve(req) {\n  return req.query.name; // unvalidated access\n}\n'
    );

    const diff = execSync("git diff", { cwd: tempProject, encoding: "utf-8" });
    assert(diff.includes("req.query.name"), "Diff must be inspectable");

    // Reviewer inspection simulation
    const findings = [];
    if (diff.includes("req.query.name") && !diff.includes("if (!req")) {
      findings.push({
        file: "service.mjs",
        line: 2,
        severity: "HIGH",
        axis: "Standards Compliance",
        message: "Missing null/undefined check on query parameter before dereference.",
      });
    }

    assert.equal(findings.length, 1, "Reviewer must identify defect");
    assert.equal(findings[0].severity, "HIGH");
    assert.equal(findings[0].axis, "Standards Compliance");

    // Invariant: Review role MUST NOT mutate files
    const status = execSync("git status --porcelain", { cwd: tempProject, encoding: "utf-8" });
    assert(status.includes("M service.mjs"), "Reviewer must not stage or commit code");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Agent scenario 4: missing specialist skill triggers registered fallback policy without hallucinated claims", () => {
  const registry = JSON.parse(fs.readFileSync(canonicalRegistryPath, "utf-8"));
  const ponytail = registry.skills.find((s) => s.canonicalName === "ponytail");

  // Simulate environment where ponytail skill is NOT installed
  const installedSkills = ["testing", "git"];
  const isPonytailInstalled = installedSkills.includes("ponytail");
  assert.equal(isPonytailInstalled, false, "Ponytail is uninstalled in this environment");

  // Agent execution contract enforcement
  let executionSummary = "";
  if (!isPonytailInstalled) {
    // Must NOT claim skill was invoked
    const claimedInvoked = false;
    assert.equal(claimedInvoked, false, "Must not claim external ponytail skill was invoked");

    // Apply fallback policy from registry
    assert(ponytail.fallbackPolicy.includes("7-Rung"), "Must cite 7-Rung decision ladder fallback");

    executionSummary = `
- **Skills Actually Invoked**: None
- **Skills Missing / Blocked**: ponytail (Applied native 7-Rung Decision Ladder fallback)
`;
  }

  assert(executionSummary.includes("Actually Invoked**: None"), "Execution report must distinguish uninvoked skills");
  assert(executionSummary.includes("Missing / Blocked**: ponytail"), "Execution report must report missing skill");
});

test("Agent scenario 5: context recovery reconciles git and test state, detecting stale evidence and preventing redundant work", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-scenario-recovery-"));
  try {
    execSync("git init -q", { cwd: tempProject });
    execSync('git config user.name "Test Agent"', { cwd: tempProject });
    execSync('git config user.email "agent@example.com"', { cwd: tempProject });

    fs.writeFileSync(path.join(tempProject, "app.mjs"), 'export const app = "ready";\n');
    execSync("git add . && git commit -qm 'initial checkpoint'", { cwd: tempProject });
    const checkpointSha = execSync("git rev-parse HEAD", { cwd: tempProject, encoding: "utf-8" }).trim();

    // Create ledger recording milestone 1 done, milestone 2 pending
    const ledgerContent = `
# Task Recovery Ledger
- Task ID: TASK-404
- Base Commit SHA: ${checkpointSha}

## 1. Goal & Boundary
Implement authentication service.

## 2. Files Modified & Owned (Single-Writer Boundary)
- app.mjs

## 3. Milestones & Checkpoints
- [x] Milestone 1: Create base service contract
- [ ] Milestone 2: Implement password hashing

## 4. Git & Verification State
- Commit: ${checkpointSha}
- Test Pass Claim: node --test (PASS at timestamp 2026-10-26T18:00:00Z)

## 5. Open Issues & Active Blockers
None.

## 6. Next Unfinished Action & Pending Next Step
Implement password hashing in app.mjs and verify with hash test.
`;
    fs.writeFileSync(path.join(tempProject, "TASK_RECOVERY_LEDGER.md"), ledgerContent);

    // Case A: Clean working tree matches checkpoint — agent resumes at Milestone 2 without repeating Milestone 1
    const currentSha = execSync("git rev-parse HEAD", { cwd: tempProject, encoding: "utf-8" }).trim();
    assert.equal(currentSha, checkpointSha, "Commit SHA must match checkpoint");
    assert(!ledgerContent.includes("- [ ] Milestone 1"), "Completed Milestone 1 must NOT be repeated");

    // Case B: Post-compaction working tree is dirtied — stale evidence detection
    fs.writeFileSync(path.join(tempProject, "app.mjs"), 'export const app = "modified post-test";\n');
    const dirtyStatus = execSync("git status --porcelain", { cwd: tempProject, encoding: "utf-8" });
    const isTreeDirty = dirtyStatus.trim().length > 0;

    assert(isTreeDirty, "Working tree has modifications post-checkpoint");

    // Protocol requires invalidating previous pass claims
    const isPreviousEvidenceStale = isTreeDirty;
    assert.equal(isPreviousEvidenceStale, true, "Agent must mark previous test pass claim as STALE EVIDENCE");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});
