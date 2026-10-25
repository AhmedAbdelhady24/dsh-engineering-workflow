---
name: engineering-workflow
description: Reliable multi-stage software engineering workflow with bounded independent review, git safety, incremental verification, checkpointing and context efficiency.
---
# Engineering Workflow

Apply on nontrivial repository work. Respect more specific project AGENTS.md and existing approval/sandbox policies.

## Task routing
- Trivial explanation or edit: inspect relevant area, execute, verify; do not spawn agents reflexively.
- Bug: reproduce and document observed failure before changing code when feasible.
- Feature/refactor: Planner maps dependencies, acceptance criteria, risks, baseline checks and concise implementation steps.
- Execution: one writer per file, smallest complete change, meaningful tests, preserve security/error handling/accessibility; use Ponytail or Matt Pocock skills only if **actually installed**, relevant, and conflict-free.
- Review: independent read-only reviewer inspects diff, missing tests, regression risks and security; maximum three evidence-based fix/review cycles. Never treat own assertions as independent checks.
- Gate: focused checks first, full project-required acceptance command before marking complete; report actual outputs, limitations and unrun checks.

## Git and execution safety
- Before edits inspect branch, index and dirty working tree; protect work of other sessions.
- Never stage, commit, merge, reset, clean, stash, rebase or overwrite concurrent changes without explicit approval.
- Separate writers by worktree for parallel implementation. Never run unapproved install scripts or untrusted commands.

## Context discipline
- Keep static reusable instructions and stable repository summaries early in context.
- Prefer file paths, symbol maps and focused extracts over full source dumps. Bound tool output; summarize subagents' observations and link to source paths.
- Context compaction is a **runtime concern**. The skill cannot autonomously measure or enforce a token threshold.
- Before compaction when supported, produce a compact recoverable checkpoint containing: objective/acceptance criteria; phase; decisions; files edited/owned; git/index constraints; passing/failing checks; unresolved risks; next action.
- Post-compaction, restore from actual summary/checkpoint and revalidate volatile state. Never repeat completed edits or invent test results. Do not save credentials.
- Keep checkpoints out of app source and untracked unless user expressly approves tracking. No endless background optimization jobs.

## Skills and visual routing
- Use `visual-communication` for architecture, workflows, state and dependency diagrams when meaningfully useful.
- Use `find-skills` for research ONLY when a needed capability is absent; never auto-install external skills.
- Prefer already verified project skills. Avoid loading duplicated debugging/TDD/review instructions.

## Final report
What changed; test commands/results; independent findings; unresolved risks; approval needed. Never claim a gate passed unless observed.
