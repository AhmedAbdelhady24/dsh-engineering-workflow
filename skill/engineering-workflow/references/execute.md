# Execute Operation Reference: Implementation, Verification & Delivery

The **`execute`** operation carries out a specific software engineering task—feature, bugfix, refactor, or optimization—with strict engineering discipline, minimal incremental changes, test-driven validation, bounded independent review, and verifiable acceptance gates.

---

## Execution Lifecycle

```text
┌─────────────────────────────────┐
│ 1. Pre-Flight Inspection        │  (Git status, branch, clean working tree)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 2. Task Triage & Plan Sizing    │  (Trivial vs. Medium vs. Complex)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 3. On-Demand Skill Routing      │  (Activate TDD, debugging, or UI specialists)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 4. Incremental Implementation   │  (Smallest coherent diff, single-writer rule)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 5. Focused Verification         │  (Targeted unit & integration tests)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 6. Independent Review Loop      │  (Read-only reviewer; max 3 fix cycles)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 7. Acceptance Gate & Report     │  (Full project test command, diffs, risks)
└─────────────────────────────────┘
```

---

## Phase 1: Pre-Flight Inspection

Before making any modification:
1. Run `git status --short` and `git branch --show-current`.
2. Verify you are on an appropriate feature or working branch.
3. Check for unstaged changes from previous tasks or other sessions. Protect existing work; never overwrite or discard unrelated edits.
4. Read the project's `AGENTS.md` and `docs/ENGINEERING_STANDARDS.md` to refresh repository rules.

---

## Phase 2: Task Triage & Plan Sizing

Size the plan proportionally to task complexity:

- **Trivial Edits (Single function, typo, styling fix, config update)**:
  - Do not create extensive subagent plans or multi-round deliberations.
  - State the intended change directly, write a test if logic is touched, apply the fix, verify, and complete.

- **Medium / Multi-File Changes (New endpoint, component, refactor)**:
  - Outline explicit acceptance criteria and affected modules.
  - Define interfaces/contracts before writing concrete implementations.
  - Create a lightweight 3–5 step plan in the chat or in `TASK_RECOVERY_LEDGER.md`.

- **Complex / Architectural Changes (New subsystem, data migration, protocol rewrite)**:
  - Decompose into thin, verifiable slices where each slice leaves the test suite green.
  - Establish a rollback strategy and interface seams before altering core behavior.

---

## Phase 3: On-Demand Specialist Skill Routing

Select specialist skills strictly as needed. Do not load all skills simultaneously:
- **For bugs**: Activate `systematic-debugging` (reproduce failure before modifying code).
- **For core logic / business rules**: Activate `test-driven-development` (red-green-refactor loop).
- **For interface design / refactoring**: Activate Matt Pocock engineering skills (`codebase-design`, `improve-codebase-architecture`) if installed.
- **For UI features**: Activate `frontend-ui-engineering` and `make-interfaces-feel-better`.
- If an applicable skill is missing: Consult [references/skill-routing.md](references/skill-routing.md).

---

## Phase 4: Incremental Implementation

Follow the **Iron Laws of Execution**:
1. **Single Writer**: Only the designated Executor agent modifies files.
2. **Smallest Complete Slice**: Write the minimum code needed to satisfy the current milestone. Avoid speculative abstractions.
3. **Preserve Documentation Integrity**: Preserve all existing docstrings, type annotations, and comments that are unrelated to your change.
4. **No Placeholders**: Never insert placeholder stubs (`// TODO: implement later`, `/* ... */`, `pass`).
5. **Context7 for External APIs**: If using unfamiliar framework APIs or library versions, query Context7 MCP instead of hallucinating parameters.

---

## Phase 5: Focused Verification

Verify changes in progressive tiers:
1. **Typecheck & Linter**: Run project typecheck (`tsc --noEmit`, `mypy`, `cargo check`) to ensure contract safety.
2. **Targeted Unit Tests**: Run only the tests directly associated with the modified files (`vitest run path/to/test.ts`, `pytest tests/test_feature.py`).
3. **Browser / UI Verification (if UI)**: Use Chrome DevTools MCP or CDP screenshot scripts to visually verify layout, console logs, and responsiveness.

---

## Phase 6: Independent Review Loop

1. **Role Separation**:
   - In hosts supporting native subagents (Antigravity, Codex, Claude Code), delegate the diff to a separate read-only Reviewer subagent.
   - In environments without delegation (or standalone CLI), perform a distinct, sequential review pass and explicitly report: *"Independent isolation unavailable; executed as sequential review pass."*
2. **Review Scope**: Inspect diff for correctness, security regressions, memory leaks, and missing edge tests.
3. **Bounded Correction Cycles**:
   - If the Reviewer finds evidence-backed defects, the Executor fixes them.
   - **Maximum of 3 correction cycles**. If unresolved after 3 cycles, halt and escalate to the user with full diagnostics.

---

## Phase 7: Acceptance Gate & Completion Report

Before declaring completion:
1. Run the project's full acceptance command (e.g., `pnpm test`, `cargo test`, `npm run build`).
2. Verify that zero tests fail and zero regressions were introduced.
3. Present the final completion report containing:
   - **Exact Files Modified**: Summary of changes per file.
   - **Verification Evidence**: Commands run and verbatim test summary results.
   - **Independent Review Findings**: Resolutions of any reviewed concerns.
   - **Residual Risks & Limitations**: Any unverified edge cases or deferred tasks.
   - **Approval Request**: Request user sign-off before committing or merging.
