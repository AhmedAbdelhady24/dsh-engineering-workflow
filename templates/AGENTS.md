# Agent Engineering Instructions: {{PROJECT_NAME}}

Welcome to {{PROJECT_NAME}}. These instructions define the engineering standards, architecture rules, and development lifecycle for all AI coding agents working in this repository.

---

## 1. Quick Reference & Core Commands

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Install Dependencies** | `{{INSTALL_COMMAND}}` | Install locked dependencies. |
| **Run Dev Server** | `{{DEV_COMMAND}}` | Start local development environment. |
| **Run Unit Tests** | `{{TEST_COMMAND}}` | Run focused unit and integration tests. |
| **Type Check** | `{{TYPECHECK_COMMAND}}` | Run compiler validation. |
| **Lint & Format** | `{{LINT_COMMAND}}` | Run static analysis and linting. |
| **Full Build** | `{{BUILD_COMMAND}}` | Build production artifacts. |

---

## 2. Engineering Invariants & Safety Rules

1. **Git Safety**:
   - Inspect `git status --short` before modifying files.
   - Never run destructive Git commands (`git reset --hard`, `git clean -fd`, `git push --force`).
   - Protect concurrent work; never stage, commit, or revert edits belonging to other sessions.
   - Require explicit human approval before any commit, push, or branch switch.

2. **Single-Writer Rule**:
   - Only one agent may write to a file or worktree at any time.
   - Planning and Review phases are strictly read-only.

3. **Minimal Complete Changes**:
   - Implement the smallest coherent change that meets acceptance criteria.
   - Preserve existing code comments, docstrings, and unrelated formatting.
   - Never use placeholder comments (`// TODO`, `/* ... */`, `pass`).

4. **Evidence-Based Verification**:
   - Run tests directly in the terminal before claiming a task is complete.
   - Do not claim a verification check passed without observing terminal output.

---

## 3. Workflow & Specialist Skills

When executing non-trivial tasks in this repository, use the canonical `engineering-workflow` skill:

```text
/engineering-workflow setup    # Onboarding & standards verification
/engineering-workflow execute  # Feature/bug implementation with TDD & review
/engineering-workflow review   # Read-only multi-axis audit
```

- **Documentation**: Use Context7 MCP for version-specific third-party library documentation.
- **Browser Testing**: Use Chrome DevTools MCP for browser-accessible UI verification.
- **Visuals**: Use Mermaid for concise inline architecture and state flow diagrams.

---

## 4. Documentation Links

- **Engineering Standards**: [`docs/ENGINEERING_STANDARDS.md`](docs/ENGINEERING_STANDARDS.md)
- **Architecture & System Topology**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **UI & Accessibility Standards**: [`docs/UI_STANDARDS.md`](docs/UI_STANDARDS.md)
- **Task Recovery Ledger**: [`.agents/TASK_RECOVERY_LEDGER.md`](.agents/TASK_RECOVERY_LEDGER.md)
