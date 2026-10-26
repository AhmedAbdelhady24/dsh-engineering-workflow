# Context Discipline & Task Recovery Ledger Reference

Long coding sessions inevitably experience context compaction, token pruning, or conversational truncation. Without disciplined state management, agents risk repeating already completed edits, forgetting architectural constraints, or hallucinating test outcomes.

This reference provides a host-agnostic recovery protocol centered around a lightweight, repository-resident **Task Recovery Ledger** and defined multi-agent boundaries.

---

## Core Invariants

1. **Host-Native Compaction**:
   - The skill relies strictly on each platform's native compaction mechanism (e.g., Antigravity's reactive summaries, DSH's `compaction-basic`, Codex's sliding window, or Claude Code's `/compact`).
   - The skill does NOT install background daemons, cron loops, or runtime hooks to force arbitrary token thresholds.

2. **Zero Redundant Work**:
   - Compaction does NOT invalidate already written code or passing tests on disk.
   - After context is refreshed or summarized, the agent MUST inspect the filesystem and Git status before taking any action. Never re-execute a step that is already completed.

3. **Evidence-Grounded Resumption & Invalidation**:
   - Do not trust unverified memory across compactions.
   - Reconcile the recorded Task Recovery Ledger against live terminal evidence: `git status`, `git diff`, and current test runner output.
   - **Evidence Invalidation Rule**: If any file belonging to a tested module was modified after the recorded test run, the prior verification evidence is **STALE / INVALIDATED** and must be re-run before declaring completion.

4. **No Secret Storage**:
   - Never record passwords, API keys, session tokens, or personal data in the recovery ledger.

---

## The Task Recovery Ledger Schema

For tasks spanning more than 2 steps, keep a minimal markdown ledger file at `.agents/TASK_RECOVERY_LEDGER.md` (or in chat memory if untracked files are prohibited):

```markdown
# Task Recovery Ledger

- **Task ID**: `TASK-2026-001`
- **Timestamp (UTC)**: 2026-10-26T18:30:00Z
- **Task Objective**: Build user authentication endpoint with JWT validation
- **Target Branch**: `feat/user-auth`
- **Base Commit**: `a1b2c3d`
- **Current Phase**: IMPLEMENTATION

## 1. Approved Decisions & Constraints
1. Use argon2id for password hashing.
2. Issue short-lived access tokens (15m) and persistent refresh tokens.

## 2. Owned Files & Worktrees (Single-Writer Boundary)
- **Active Writer Role**: Executor Subagent
- **Owned Files**:
  - `src/auth/service.ts`
  - `tests/auth/service.test.ts`
- **Worktree Path**: `/workspace/repo`

## 3. Work Completed
- [x] Step 1: User table schema migration — Verified by `npm test tests/db` (Exit 0)
- [x] Step 2: Password hashing service — Verified by `npm test tests/auth/service.test.ts` (Exit 0)

## 4. Git & Test Verification State
- **Git Status**: 2 files modified, unstaged
- **Last Verification Command**: `npm test tests/auth/service.test.ts`
- **Verification Output Summary**: 4 passed, 0 failed in 180ms
- **Stale / Invalidated Evidence**: None (All edits covered by last test run)

## 5. Active Blockers & Unresolved Reviews
- Unresolved Review Items: None
- External Blockers: Awaiting staging database credentials

## 6. Pending Next Action
- [ ] Step 3: Implement JWT signing and verify with route integration test
```

---

## Post-Compaction Recovery Routine

When the agent detects context compaction or resumes from a previous session:

```text
Step 1: Check for Ledger
        └─ Inspect .agents/TASK_RECOVERY_LEDGER.md or recent ledger block.

Step 2: Inspect Live Repository State
        ├─ Run: git status --short
        ├─ Run: git diff --stat
        └─ Compare modified files against the ledger.

Step 3: Reconcile Evidence & Detect Invalidation
        ├─ Did files change since the last recorded verification?
        ├─ If YES: Mark evidence STALE and re-run targeted test.
        └─ If NO: Re-affirm verification without re-implementing code.

Step 4: Continue Directly from Next Step
        └─ Resume execution starting strictly at "Pending Next Action".
```

---

## Multi-Agent Execution & Parallel Boundaries

In multi-agent environments (Antigravity, Codex, Claude Code), follow strict coordination boundaries:

| Dimension | Planner Subagent | Executor Subagent | Reviewer Subagent |
| :--- | :--- | :--- | :--- |
| **Role** | Requirements & Slice Decomposition | Incremental Implementation & Testing | Two-Axis Verification |
| **File Permissions** | **Read-Only** | **Single-Writer** (Assigned files) | **Read-Only** |
| **Permitted Tools** | Read files, grep, graph search | Read/write files, run tests, linter | Read files, git diff, run tests |
| **Input Artifact** | User prompt & repo architecture | Milestone spec & interface contract | Git diff & acceptance criteria |
| **Output Artifact** | Decomposed slices in plan | Working code & passing test logs | Two-axis review report |
| **Completion Contract**| Approval Gate reached | Acceptance test exit code 0 | Approval / actionable findings |

### Rules for Parallel Agents
1. **True Independence**: Spawn parallel agents only when workpackages have zero shared file dependencies (e.g. backend API and frontend component in distinct packages).
2. **Prevent Write Collisions**: Never assign two concurrent subagents write access to the same file or worktree.
3. **Orchestrator Role**: The primary orchestrator focuses strictly on dispatch, dependency order, and ledger reconciliation, avoiding duplicating the specialist agents' execution steps.
