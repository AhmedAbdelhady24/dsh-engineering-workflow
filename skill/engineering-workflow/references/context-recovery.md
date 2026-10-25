# Context Discipline & Task Recovery Ledger Reference

Long coding sessions inevitably experience context compaction, token pruning, or conversational truncation. Without disciplined state management, agents risk repeating already completed edits, forgetting architectural constraints, or hallucinating test outcomes.

This reference provides a host-agnostic recovery protocol centered around a lightweight **Task Recovery Ledger**.

---

## Core Invariants

1. **Host-Native Compaction**:
   - The skill relies strictly on each platform's native compaction mechanism (e.g., Antigravity's reactive summaries, DSH's `compaction-basic`, Codex's sliding window, or Claude Code's `/compact`).
   - The skill does NOT install background daemons, cron loops, or runtime hooks to force arbitrary token thresholds (such as 50%) unless natively supported by the host.

2. **Zero Redundant Work**:
   - Compaction does NOT invalidate already written code or passing tests on disk.
   - After context is refreshed or summarized, the agent MUST inspect the filesystem and Git status before taking any action. Never re-execute a step that is already completed.

3. **Evidence-Grounded Resumption**:
   - Do not trust unverified memory across compactions.
   - Reconcile the recorded Task Recovery Ledger against live terminal evidence: `git status`, `git diff`, and current test runner output.

4. **No Secret Storage**:
   - Never record passwords, API keys, session tokens, or personal data in the recovery ledger.

---

## The Task Recovery Ledger Schema

For tasks spanning more than 2 steps, keep a minimal markdown ledger file at `.agents/TASK_RECOVERY_LEDGER.md` (or in chat memory if untracked files are prohibited):

```markdown
# Task Recovery Ledger

- **Timestamp**: [ISO 8601 UTC timestamp]
- **Task Objective**: [Exact user prompt and requirements]
- **Target Branch**: [Git branch name]
- **Current Phase**: [SETUP | PLANNING | IMPLEMENTATION | VERIFICATION | REVIEW]

## Approved Decisions & Constraints
1. [Key architectural decision approved by user]
2. [Interface contract or boundary established]

## Work Completed
- [x] Step 1: [Description] - Verified by [exact test command]
- [x] Step 2: [Description] - Verified by [exact test command]

## Files Modified & Owned
- `path/to/file1.ts` (Added feature X)
- `path/to/file2.test.ts` (Unit tests)

## Git & Test State
- **Git Status**: [Clean / Modified / Staged]
- **Last Verification Command**: `pnpm test path/to/test.ts`
- **Output Summary**: [e.g., 5 passed, 0 failed in 420ms]

## Open Issues / Blockers
- None (or specific noted defect)

## Next Unfinished Action
- [ ] Step 3: Implement endpoint Y and verify with test Z.
```

---

## Post-Compaction Recovery Routine

When the agent detects context compaction or resumes from a previous session:

```text
Step 1: Check for Ledger
        └─ Look for .agents/TASK_RECOVERY_LEDGER.md or recent ledger block in history.

Step 2: Inspect Live Repository State
        ├─ Run: git status --short
        ├─ Run: git diff --stat
        └─ Compare modified files against the ledger.

Step 3: Re-Verify Volatile Assertions
        └─ Run targeted test suite to confirm passing state without re-implementing.

Step 4: Continue Directly from Next Step
        └─ Resume execution starting strictly at "Next Unfinished Action".
```

---

## Update Frequency & Lifecycle

- **When to update**: Only at major phase transitions or milestone completions (e.g., after a test suite passes or a component is created).
- **When NOT to update**: Do not update on every individual file read or terminal command.
- **Teardown**: Upon final task acceptance and user approval, the ledger can be removed or archived into commit history.
