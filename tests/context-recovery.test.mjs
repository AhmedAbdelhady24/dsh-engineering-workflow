import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const ledgerTemplate = fs.readFileSync(path.join(rootDir, "templates/TASK_RECOVERY_LEDGER.md"), "utf-8");
const recoveryRef = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/context-recovery.md"), "utf-8");

test("Context recovery: Task Recovery Ledger contains all mandatory recovery fields", () => {
  const mandatoryFields = [
    "Task Objective",
    "Current Phase",
    "Approved Architectural Decisions",
    "Work Completed",
    "Files Modified & Owned",
    "Git & Verification State",
    "Open Issues",
    "Next Unfinished Action",
  ];

  for (const field of mandatoryFields) {
    assert(
      ledgerTemplate.includes(field),
      `Task Recovery Ledger template must include mandatory field: '${field}'`
    );
  }
});

test("Context recovery: reconciliation protocol enforces zero redundant work after compaction", () => {
  assert(
    recoveryRef.includes("Zero Redundant Work"),
    "context-recovery.md must mandate zero redundant work"
  );
  assert(
    recoveryRef.includes("Never re-execute a step that is already completed"),
    "Must explicitly forbid repeating completed work"
  );
  assert(
    recoveryRef.includes("Host-Native Compaction"),
    "Must use native compaction and avoid custom background daemons"
  );
});

test("Context recovery: simulation of post-compaction continuation", () => {
  // Simulate reading a ledger with Step 1 and 2 done, Step 3 unfinished
  const mockLedger = `
# Task Recovery Ledger
- **Task Objective**: Build user auth endpoint
- **Current Phase**: IMPLEMENTATION
## Work Completed
- [x] Step 1: Add user table schema - Verified by test
- [x] Step 2: Implement password hashing - Verified by test
## Next Unfinished Action
- [ ] Step 3: Implement login route and JWT signing
  `;

  // Parser logic to extract next action
  const nextActionMatch = mockLedger.match(/## Next Unfinished Action\s*[\r\n]+-\s*\[\s*\]\s*(.+)/);
  assert(nextActionMatch, "Ledger parser must successfully detect unfinished action");
  assert.equal(nextActionMatch[1].trim(), "Step 3: Implement login route and JWT signing");

  // Verify completed steps are marked done
  const completedSteps = [...mockLedger.matchAll(/-\s*\[x\]\s*(.+)/gi)];
  assert.equal(completedSteps.length, 2);
});
