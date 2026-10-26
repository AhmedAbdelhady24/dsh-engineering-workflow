# Execute Operation Reference: Implementation, Verification & Delivery

The **`execute`** operation carries out a specific software engineering task—feature, bugfix, refactor, or optimization—with adaptive engineering discipline, minimal incremental changes, native test-driven validation, bounded independent review, and verifiable acceptance gates.

---

## Execution Lifecycle

```text
┌─────────────────────────────────┐
│ 1. Pre-Flight Inspection        │  (Git status, branch, clean working tree)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 2. Adaptive Task Sizing         │  (Trivial vs. Medium vs. Complex)
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 3. On-Demand Skill Routing      │  (Check availability; apply native TDD/minimalism)
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

## Phase 2: Adaptive Execution Sizing

Proportion execution overhead directly to task complexity:

### A. Trivial Edits (Single function, typo, styling tweak, config update)
- **Flow**: Inspect -> minimal change -> targeted verification.
- Do NOT spawn multiple subagents, generate multi-page plans, or perform extended deliberations.
- State the intended change concisely, update or add a test if logic is touched, apply the fix, verify, and complete.

### B. Medium Tasks (New endpoint, UI component, targeted refactor)
- **Flow**: Concise plan -> route specialist skills -> implement -> test -> review.
- Outline explicit acceptance criteria and affected modules.
- Define interfaces/contracts before writing concrete implementations.
- Maintain a lightweight 3–5 step plan in the chat or in `TASK_RECOVERY_LEDGER.md`.

### C. Complex / Architectural Tasks (New subsystem, data migration, protocol rewrite)
- **Flow**: Requirements / architecture alignment -> approved decisions -> vertical slices -> isolated execution where supported -> comprehensive verification.
- Interrogate requirements and assumptions before writing code.
- Decompose into thin, verifiable slices where each slice leaves the test suite green.
- Record milestones and decisions in `TASK_RECOVERY_LEDGER.md` with rollback boundaries before altering core behavior.

---

## Phase 3: On-Demand Specialist Skill Routing & Execution Contract

In accordance with the **Skill Execution Contract**, specialist skills are identified, verified, and explicitly invoked on demand. Mentioning a skill in documentation or routing tables does NOT constitute execution.

### 1. Task Archetype Characterization & Skill Matching

The orchestrator matches the current task to its target archetype using [`skill-registry.json`](../skill-registry.json):

| Task Archetype | Specialist Skills to Consider | Primary Purpose & Execution Intent |
| :--- | :--- | :--- |
| **New feature with unclear requirements** | `grilling` (or `grill-with-docs`), `domain-modeling` | Socratic challenge, interrogating assumptions, establishing ubiquitous language and domain models before writing code. |
| **Architecture planning** | `codebase-design`, `implementation-planning` (or `planning-and-task-breakdown`) | Establishing deep module boundaries, small interfaces hiding complexity, interface seams, and decomposed vertical slices. |
| **Feature implementation** | `implement`, `ponytail`, `test-driven-development` (or `tdd`) | Guiding implementation against approved plans, maintaining minimal coherent diffs without speculative bloat, red-green-refactor loop. |
| **Bug fixing** | `systematic-debugging` (or `diagnosing-bugs`), `test-driven-development` (or `tdd`) | Root-cause diagnosis, reproducing failure before mutation, writing failing regression tests, verifying the fix. |
| **Engineering handoff** | `handoff` | Packaging structured context, recovery ledgers, and architectural summaries for peer agents or session resets. |
| **UX audit** | `ui-ux-pro-max`, `frontend-design`, `make-interfaces-feel-better`, `browser-testing-with-devtools`, `break-ui` | Evaluating usability heuristics, visual hierarchy, micro-interactions, WCAG 2.2 AA accessibility, and runtime browser behavior. |
| **Simple change** | `ponytail` principles, focused verification | Minimal complete diff, zero speculative abstractions, focused unit testing, fast turn-around. |

### 2. Built-In Test Discipline (No External Skill Required)

The workflow does **NOT** require an external TDD skill merely to run tests:
- When a specialist TDD skill (`tdd` or `test-driven-development`) is installed: route to it seamlessly.
- When an external TDD skill is **absent**: the orchestrator applies native test discipline:
  1. Write a targeted, failing unit or integration test defining expected behavior.
  2. Run the project's test command and observe the test failure (RED phase).
  3. Implement the minimal code required to satisfy the test (GREEN phase).
  4. Re-run the test command and verify clean exit code 0.
  5. Refactor while keeping tests green.

### 3. Pragmatic Minimalism (Ponytail Fallback)

- When `ponytail` is installed: invoke it to guide minimal implementation.
- When `ponytail` is **absent**: apply the 7-Rung Decision Ladder directly (YAGNI -> reuse existing -> standard library -> platform native -> dependency -> one line -> minimum code) without claiming external skill invocation.

---

## Phase 4: Incremental Implementation

Follow the **Iron Laws of Execution**:
1. **Single Writer**: Only the designated Executor agent modifies files.
2. **Smallest Complete Slice**: Write the minimum code needed to satisfy the current milestone. Avoid speculative abstractions.
3. **Preserve Documentation Integrity**: Preserve all existing docstrings, type annotations, and comments that are unrelated to your change.
4. **No Placeholders**: Never insert placeholder stubs (`// TODO: implement later`, `/* ... */`, `pass`).
5. **Context7 for External APIs**: If using unfamiliar framework APIs or library versions, query Context7 MCP instead of hallucinating parameters.

---

## Phase 5: Focused Verification & Failure Handling

Verify changes in progressive tiers:
1. **Typecheck & Linter**: Run project typecheck (`tsc --noEmit`, `mypy`, `cargo check`) to ensure contract safety.
2. **Targeted Unit Tests**: Run only the tests directly associated with the modified files (`vitest run path/to/test.ts`, `pytest tests/test_feature.py`).
3. **Browser / UI Verification (if UI)**: Use Chrome DevTools MCP or CDP screenshot scripts to visually verify layout, console logs, and responsiveness.

### Failure Handling Protocol
- If a verification step fails, do NOT guess or apply random edits.
- Read the compiler, linter, or test runner error output carefully.
- If an unexpected regression occurs, revert the minimal failing edit and re-isolate.
- If a blocker persists after **3 correction cycles**, halt and escalate to the human user with exact reproduction commands and error output.

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
   - **Skills Execution Summary**:
     - **Skills Considered**: Specialist skills evaluated based on task archetype.
     - **Skills Actually Invoked**: Specialist skills verified as installed and explicitly executed (with invocation method).
     - **Skills Missing / Blocked**: Any required specialist skills absent from the environment and the fallback applied.
   - **Approval Request**: Request user sign-off before committing or merging.
