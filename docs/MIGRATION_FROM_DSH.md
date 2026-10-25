# Migration Audit: From DSH Cordis Plugin to Universal Agent Skill

This document details the architectural migration from the DeepSeek Harness (DSH) engineering workflow plugin (`dsh-engineering-workflow`) to the portable, vendor-neutral Agent Skills package (`universal-engineering-workflow`).

---

## 1. Architectural Evolution

| Dimension | Legacy DSH Plugin (`dsh-engineering-workflow`) | Universal Skill (`universal-engineering-workflow`) |
| :--- | :--- | :--- |
| **Packaging Model** | Cordis runtime plugin + DSH profile patch | Open Agent Skills format (`agentskills.io` standard) |
| **Runtime Target** | DeepSeek Harness v0.2.1-rc.3 only | Google Antigravity, DSH, OpenAI Codex, Claude Code |
| **Host Configuration** | `cordis.patch.yml` mutating profile settings | File-based discovery (`.agents/skills`, `.dsh/skills`, etc.) |
| **Recovery Engine** | Custom JavaScript daemon listening to `session/event` and `agent/pre-step` | Native host compaction + lightweight Task Recovery Ledger |
| **Tooling Dependencies** | Python patch compiler (`build-patch.py`, `check-compat.py`) | Zero runtime dependencies; standard Node test runner |
| **Operations** | Monolithic prompt injection | Distinct operational routers: `setup`, `execute`, `review` |
| **Skill Discovery** | Bundled static skills only | Dynamic on-demand specialist routing matrix |
| **MCP Integration** | Hardcoded Cordis MCP configurations | Host-agnostic MCP policy (Context7, Chrome DevTools) |

---

## 2. What Was Discarded (DSH-Specific Infrastructure)

The legacy package was tightly bound to DSH's internal Cordis plugin architecture:

1. **`cordis.patch.yml` & Python Build Tools**:
   - The YAML patch mechanism injected presets into DSH's internal configuration store. This was non-portable and required maintaining Python AST validators to verify compatibility across DSH releases.
   - *Status*: **Removed**. Modern agents discover skills natively on the filesystem.

2. **`recovery/index.js` & `recovery/message.js`**:
   - The custom recovery daemon intercepted DSH internal events (`compaction/start`, `compaction/end`) to prepend user messages on `agent/pre-step`.
   - *Status*: **Removed**. Modern AI models are instruction-tuned to consult on-disk recovery ledgers (`TASK_RECOVERY_LEDGER.md`) without requiring active background daemons.

3. **`DSH_ENGINEERING_RECOVERY_TEST` Overrides**:
   - Test-only environment variables and Cordis mocks.
   - *Status*: **Removed**. Replaced with declarative test runner asserting ledger schemas and post-compaction continuation.

---

## 3. What Was Preserved & Enhanced

The core engineering principles of the original workflow were preserved and strengthened:

1. **The Three-Role Workflow**:
   - Structured division of labor: Planner → Executor → Independent Reviewer.
   - Preserved: Read-only planning/review, single writer per file, and honest disclosure when independent subagents are unavailable.

2. **Git & Working Tree Safety**:
   - Pre-flight inspection of `git status` and `git branch`.
   - Preserved: Strict prohibition against destructive Git operations (`git reset --hard`, `git clean -fd`, `git push --force`).
   - Enhanced: Active protection of dirty working trees representing concurrent work from other sessions.

3. **Bounded Correction Cycles**:
   - Preserved: Strict cap of 3 fix-and-verify loops between Reviewer and Executor before escalating to human operator.

4. **Context Recovery Ledger**:
   - Replaced custom compaction listeners with a standardized markdown ledger (`TASK_RECOVERY_LEDGER.md`) containing:
     - Exact task acceptance criteria
     - Approved architectural decisions
     - Completed milestones with test evidence
     - Next unfinished action

---

## 4. New Universal Capabilities Added

1. **First-Class Operations**:
   - `setup`: Guided repository onboarding, capability audit, standards proposal, and an interactive **Approval Gate**.
   - `execute`: Proportional task planning, TDD execution, minimal complete changes, and acceptance verification.
   - `review`: Multi-axis read-only inspection (correctness, security, performance, accessibility) with a structured severity taxonomy.

2. **Dynamic Capability Matrix**:
   - Selective on-demand routing for specialist skills (Ponytail, Matt Pocock engineering skills, UI/UX skills).
   - Strict classification of UI capabilities as **NOT APPLICABLE** on pure backend codebases.
   - Enforced rule: Never silently downgrade quality gates if a mandatory skill is missing.

3. **Context7 & Chrome DevTools MCP Integration**:
   - Context7 designated as baseline live documentation provider for external SDKs and libraries.
   - Chrome DevTools MCP required for browser-accessible web application verification.
   - Zero hardcoded credentials; human approval required for all MCP registrations.
