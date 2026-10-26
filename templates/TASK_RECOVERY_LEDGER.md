# Task Recovery Ledger

- **Task ID**: `{{TASK_ID}}`
- **Timestamp (UTC)**: {{TIMESTAMP_UTC}}
- **Task Objective**: {{TASK_OBJECTIVE}}
- **Target Branch**: `{{TARGET_BRANCH}}`
- **Base Commit**: `{{BASE_COMMIT_SHA}}`
- **Current Phase**: {{CURRENT_PHASE}} <!-- SETUP | PLANNING | IMPLEMENTATION | VERIFICATION | REVIEW -->

---

## 1. Approved Architectural Decisions & Constraints
1. {{DECISION_1}}
2. {{DECISION_2}}

---

## 2. Files Modified & Owned (Single-Writer Boundary)
- **Active Writer Role**: {{ACTIVE_WRITER_ROLE}} <!-- e.g. Executor Subagent 1 -->
- **Owned Files**:
  - `{{FILE_1_PATH}}` (Scope: {{FILE_1_SCOPE}})
  - `{{FILE_2_PATH}}` (Scope: {{FILE_2_SCOPE}})
- **Worktree Path**: `{{WORKTREE_PATH_OR_MAIN}}`

---

## 3. Work Completed
- [x] Step 1: {{STEP_1_DESC}} — Verified by `{{STEP_1_TEST_CMD}}` (Exit: {{STEP_1_EXIT_CODE}})
- [x] Step 2: {{STEP_2_DESC}} — Verified by `{{STEP_2_TEST_CMD}}` (Exit: {{STEP_2_EXIT_CODE}})

---

## 4. Git & Verification State
- **Git Status**: {{GIT_STATUS_SUMMARY}} (Clean / Uncommitted)
- **Last Verification Command**: `{{LAST_TEST_COMMAND}}`
- **Verification Output Summary**: {{VERIFICATION_OUTPUT_SUMMARY}}
- **Evidence Validity**:
  - Validated Commit / State: `{{VALIDATED_COMMIT_OR_TIMESTAMP}}`
  - **Stale / Invalidated Evidence**: {{STALE_EVIDENCE_SUMMARY_OR_NONE}}
  *(Note: Any file modification made after a test run immediately invalidates recorded verification evidence).*

---

## 5. Open Issues & Active Blockers
- **Unresolved Review Items**: {{UNRESOLVED_REVIEWS_OR_NONE}}
- **External Blockers**: {{BLOCKERS_OR_NONE}}

---

## 6. Next Unfinished Action & Pending Next Step
- [ ] Step 3: {{NEXT_STEP_DESCRIPTION}}
