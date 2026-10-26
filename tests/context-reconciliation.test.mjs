import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const recoveryTemplatePath = path.join(rootDir, "templates/TASK_RECOVERY_LEDGER.md");

// Reconciler simulation function matching context-recovery.md rules
function reconcileLedgerState(ledgerContent, repoDir) {
  // 1. Parse current state
  const taskIdMatch = ledgerContent.match(/- \*\*Task ID\*\*:\s*`?([^\r\n`]+)`?/);
  const baseCommitMatch = ledgerContent.match(/- \*\*Base Commit\*\*:\s*`?([^\r\n`]+)`?/);
  const completedSteps = [...ledgerContent.matchAll(/-\s*\[x\]\s*(.+)/gi)].map((m) => m[1].trim());
  const pendingStepMatch = ledgerContent.match(/## 6\..*?[\r\n]+-\s*\[\s*\]\s*(.+)/s);

  // 2. Query git state in repo
  const gitStatus = execSync("git status --porcelain", { cwd: repoDir, encoding: "utf-8" }).trim();
  const currentHead = execSync("git rev-parse --short HEAD", { cwd: repoDir, encoding: "utf-8" }).trim();

  // 3. Detect evidence invalidation
  const isDirty = gitStatus.length > 0;
  const isHeadChanged = baseCommitMatch && baseCommitMatch[1].trim() !== currentHead;
  const isEvidenceStale = isDirty || isHeadChanged;

  return {
    taskId: taskIdMatch ? taskIdMatch[1].trim() : null,
    baseCommit: baseCommitMatch ? baseCommitMatch[1].trim() : null,
    completedStepsCount: completedSteps.length,
    pendingAction: pendingStepMatch ? pendingStepMatch[1].split(/[\r\n]/)[0].trim() : null,
    gitStatus,
    currentHead,
    isEvidenceStale,
    nextAction: isEvidenceStale
      ? `Re-verify stale evidence with test suite before proceeding`
      : pendingStepMatch ? pendingStepMatch[1].split(/[\r\n]/)[0].trim() : null,
  };
}

test("Context reconciliation: parses structured ledger fields accurately", () => {
  const sampleLedger = `
# Task Recovery Ledger
- **Task ID**: \`TASK-2026-999\`
- **Timestamp (UTC)**: 2026-10-26T12:00:00Z
- **Task Objective**: Add rate limiting to auth routes
- **Target Branch**: \`feat/rate-limiting\`
- **Base Commit**: \`c0ffee1\`
- **Current Phase**: IMPLEMENTATION

## 1. Approved Architectural Decisions & Constraints
1. Token bucket algorithm stored in memory cache.

## 2. Files Modified & Owned (Single-Writer Boundary)
- **Active Writer Role**: Executor Subagent
- **Owned Files**:
  - \`src/rate-limiter.ts\`

## 3. Work Completed
- [x] Step 1: Token bucket implementation — Verified by npm test (Exit: 0)
- [x] Step 2: Rate limit middleware — Verified by npm test (Exit: 0)

## 4. Git & Verification State
- **Git Status**: Clean
- **Last Verification Command**: \`npm test\`
- **Evidence Validity**:
  - Validated Commit: \`c0ffee1\`
  - **Stale / Invalidated Evidence**: None

## 5. Open Issues & Active Blockers
- None

## 6. Next Unfinished Action & Pending Next Step
- [ ] Step 3: Wire middleware to express router and verify 429 response
  `;

  const tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), "uew-reconcile-"));
  try {
    execSync(
      "git init -b main && git config user.name 'Test' && git config user.email 'test@example.com' && touch init.txt && git add . && git commit -m 'Initial commit'",
      { cwd: tempRepo, stdio: "ignore" }
    );

    const reconciled = reconcileLedgerState(sampleLedger, tempRepo);

    assert.equal(reconciled.taskId, "TASK-2026-999");
    assert.equal(reconciled.completedStepsCount, 2);
    assert.equal(reconciled.pendingAction, "Step 3: Wire middleware to express router and verify 429 response");
  } finally {
    fs.rmSync(tempRepo, { recursive: true, force: true });
  }
});

test("Context reconciliation: detects stale evidence when working tree is dirtied post-test", () => {
  const tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), "uew-stale-"));
  try {
    execSync(
      "git init -b main && git config user.name 'Test' && git config user.email 'test@example.com' && touch file.ts && git add . && git commit -m 'Commit 1'",
      { cwd: tempRepo, stdio: "ignore" }
    );
    const headCommit = execSync("git rev-parse --short HEAD", { cwd: tempRepo, encoding: "utf-8" }).trim();

    const ledger = `
# Task Recovery Ledger
- **Task ID**: \`TASK-001\`
- **Base Commit**: \`${headCommit}\`
## 3. Work Completed
- [x] Step 1: Initial logic
## 4. Git & Verification State
- **Git Status**: Clean
## 6. Next Unfinished Action & Pending Next Step
- [ ] Step 2: Next step
    `;

    // 1. In clean repo, evidence is not stale
    const cleanReconciled = reconcileLedgerState(ledger, tempRepo);
    assert.equal(cleanReconciled.isEvidenceStale, false);
    assert.equal(cleanReconciled.nextAction, "Step 2: Next step");

    // 2. Modify a file without running tests
    fs.appendFileSync(path.join(tempRepo, "file.ts"), "\n// unverified edit\n");

    // 3. Evidence must now be detected as STALE
    const dirtyReconciled = reconcileLedgerState(ledger, tempRepo);
    assert.equal(dirtyReconciled.isEvidenceStale, true);
    assert(dirtyReconciled.nextAction.includes("Re-verify stale evidence"));
  } finally {
    fs.rmSync(tempRepo, { recursive: true, force: true });
  }
});
