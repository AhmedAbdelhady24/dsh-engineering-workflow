---
name: engineering-workflow
description: Universal multi-stage software engineering workflow supporting setup, execute, review, and ux-audit operations with Git safety, dynamic specialist skill routing, Context7/Chrome DevTools MCP integration, and compaction-safe recovery across Antigravity, DSH, Codex, and Claude Code.
---

# Universal Engineering Workflow

The `engineering-workflow` skill provides a portable, production-quality engineering methodology designed for modern AI coding agents across **Google Antigravity**, **DeepSeek Harness (DSH)**, **OpenAI Codex**, and **Claude Code**.

It standardizes autonomous and pair programming workflows into four disciplined operations—**setup**, **execute**, **review**, and **ux-audit**—while strictly enforcing local Git safety, minimal complete changes, evidence-based verification, and zero hallucinated progress.

---

## Operations Router

When invoking this skill, identify the requested operation from the command arguments or prompt context:

```text
/engineering-workflow <operation> [focus]    [Antigravity, DSH, Claude Code]
$engineering-workflow <operation> [focus]    [OpenAI Codex]
@engineering-workflow <operation> [focus]    [Explicit Prompt Fallback]
```

| Operation | Objective | Primary Reference | Gate / Exit Condition |
| :--- | :--- | :--- | :--- |
| **`setup`** | New project onboarding, repository inspection, capability/MCP verification, standards proposal, initial plan. | [references/setup.md](references/setup.md) | **Approval Gate**: Halt before writing files or running external installs until user signs off on the readiness report. |
| **`execute`** | Plan, select specialist skills, write minimal tested changes, run independent review (max 3 cycles), final acceptance. | [references/execute.md](references/execute.md) | **Acceptance Gate**: Focused unit tests pass, project acceptance command passes, diff summary and risks reported. |
| **`review`** | Read-only independent audit across correctness, security, performance, accessibility, and maintainability. | [references/review.md](references/review.md) | **Findings Report**: Structured findings with severity levels and exact file/line links. No code modifications. |
| **`ux-audit`** | Comprehensive product usability, user journey, visual design, accessibility (WCAG 2.2 AA), and technical UX audit. | [references/ux-audit.md](references/ux-audit.md) | **UX Audit Report**: Structured scorecard (1–5), visual & technical findings, and prioritized backlog. Strictly read-only. |

If no operation is explicitly passed:
1. If the repository lacks `AGENTS.md` or baseline configuration: default to **`setup`**.
2. If working on a specific feature, bug, or refactor: default to **`execute`**.
3. If asked to inspect a PR, diff, or branch: default to **`review`**.
4. If asked to evaluate product usability, UI/UX, user flows, or accessibility: default to **`ux-audit`**.

Optional focus argument for `ux-audit`:
- `/engineering-workflow ux-audit` [Antigravity, DSH, Claude Code]
- `$engineering-workflow ux-audit` [OpenAI Codex]
- `/engineering-workflow ux-audit onboarding` (First-time user onboarding & orientation)
- `/engineering-workflow ux-audit navigation` (Information architecture & routing)
- `/engineering-workflow ux-audit accessibility` (WCAG 2.2 AA, keyboard, screen-reader)
- `/engineering-workflow ux-audit <flow>` (Targeted workflow, e.g. `checkout`, `search`)

---

## Core Invariants & Safety Rules

1. **Strict Git Safety**:
   - Always inspect `git status --short` and `git branch --show-current` before modifying files.
   - Never run destructive Git commands (`git reset --hard`, `git clean -fd`, `git push --force`, `git checkout -- .`) without explicit user instruction.
   - Protect concurrent work; never stage, commit, or discard uncommitted changes belonging to other sessions.
   - Require human approval before any commit, push, or branch switch.

2. **Single-Writer Rule**:
   - Only one agent may write to a specific file or worktree at any time.
   - Planning and Review roles are strictly read-only.

3. **Minimal Complete Slices**:
   - Implement the smallest coherent change that satisfies requirements.
   - Preserve existing code comments, docstrings, and unrelated formatting.
   - No placeholder comments (`// TODO: implement later`, `/* ... */`).

4. **Skill Execution Contract**:
   - Before performing a task, identify the relevant specialist skills from the machine-readable catalog ([`skill-registry.json`](skill-registry.json)) on demand.
   - Verify that selected skills are installed and invocable, and explicitly load or invoke them through the host's supported mechanism.
   - Do not treat mentioning a skill in the routing documentation as execution.
   - If a required skill is unavailable, report the blocker and provide the installation command; apply its registered `fallbackPolicy` without falsely claiming external skill invocation.
   - At completion, the execution summary must explicitly distinguish between **Skills Actually Invoked** vs. **Skills Merely Considered** vs. **Skills Missing/Blocked**.
   - For non-UI projects, classify UI skills as **NOT APPLICABLE**.
   - See [skill-registry.json](skill-registry.json), [references/skill-routing.md](references/skill-routing.md), [references/execute.md](references/execute.md), and [references/mcps.md](references/mcps.md).

5. **Context Compaction & Ledger Discipline**:
   - The skill does not run custom background daemons or attempt to measure runtime tokens.
   - Maintain a lightweight **Task Recovery Ledger** ([`TASK_RECOVERY_LEDGER.md`](references/context-recovery.md)) for multi-step tasks.
   - After context compaction, reconcile the ledger against live `git status`, diffs, and test outputs before proceeding. Never repeat completed steps.
   - See [references/context-recovery.md](references/context-recovery.md).

---

## Detailed References

- [Setup Operation Reference](references/setup.md): Complete guide for repository discovery, capability audits, and onboarding proposals.
- [Execute Operation Reference](references/execute.md): End-to-end execution loop, TDD, correction cycles, and verification gates.
- [Review Operation Reference](references/review.md): Multi-axis read-only review guidelines and severity taxonomy.
- [UX Audit Operation Reference](references/ux-audit.md): End-to-end product usability, accessibility, and user-facing technical architecture audit.
- [Skill Routing Matrix](references/skill-routing.md): Core and UI specialist skill matrix, installation methods, and on-demand activation.
- [Skill Registry](skill-registry.json): Machine-readable catalog of supported specialist capabilities, canonical upstreams, dependencies, and invocation policies.
- [MCP Integration & Policies](references/mcps.md): Portable guidelines and connection specs for Context7, Chrome DevTools MCP, and external integrations.
- [Context & Ledger Recovery](references/context-recovery.md): Compaction-resilient ledger format and state reconciliation.
- [Agent Host Compatibility](references/agent-compatibility.md): Cross-host mapping for Antigravity, DSH, Codex, and Claude Code.
