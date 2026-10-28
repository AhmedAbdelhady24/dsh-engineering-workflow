# Universal Engineering Workflow

[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-Compliant-brightgreen)](https://agentskills.io/specification)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI Status](https://github.com/AhmedAbdelhady24/engineering-workflow/actions/workflows/ci.yml/badge.svg)](https://github.com/AhmedAbdelhady24/engineering-workflow/actions/workflows/ci.yml)
[![Platforms: Claude Code | Codex | Antigravity | DSH](https://img.shields.io/badge/Platforms-Claude%20Code%20%7C%20Codex%20%7C%20Antigravity%20%7C%20DSH-orange)](docs/COMPATIBILITY_MATRIX.md)

The compaction-resilient orchestrator for real software engineering — not vibe coding.

![Universal Engineering Workflow](docs/visuals/universal-workflow-banner.png)

Developing production applications with coding agents is hard. Monolithic frameworks try to help by owning the process, locking your terminal into rigid state machines and stripping away human control. At the other extreme, unguided agents fly without a compass, hallucinate passing tests, and suffer from total amnesia the moment context compacts.

**Universal Engineering Workflow** provides the missing discipline: four lean operations (`setup`, `execute`, `review`, `ux-audit`), an ironclad **Skill Execution Contract**, a machine-readable [Skill Registry](skill/engineering-workflow/skill-registry.json), a compaction-resilient recovery ledger, and end-to-end runtime verification across Claude Code, OpenAI Codex, Google Antigravity, and DeepSeek Harness.

---

## What It Does vs. What It Does NOT Do

| What This Workflow DOES | What This Workflow Does NOT Do |
| :--- | :--- |
| **Enforces four disciplined operations**: `setup`, `execute`, `review`, and `ux-audit`. | **Does NOT hijack your terminal** or run proprietary background daemon processes. |
| **Enforces the Skill Execution Contract**: Verifies installed skills, invokes them explicitly, and requires hard command evidence. | **Does NOT vendor third-party skills**: References canonical upstreams (`DietrichGebert/ponytail`, `mattpocock/skills`, `obra/superpowers`, `addyosmani/agent-skills`). |
| **Maintains native test discipline**: Applies red-green cycles natively even when external TDD skills are absent. | **Does NOT claim unverified execution**: Never claims TDD or Ponytail was invoked without real execution evidence. |
| **Provides compaction-resilient recovery**: Persists checkpoints in `TASK_LOG.md` and `TASK_RECOVERY_LEDGER.md` with explicit git and test reconciliation protocols. | **Does NOT lock you into proprietary runtimes**: Pure markdown, JSON manifests, and standard shell scripts. |
| **Conducts two-axis code reviews**: Inspects diffs for both Engineering Standards and Spec fulfillment. | **Does NOT mutate code during reviews or audits**: Review and UX-audit roles are strictly read-only. |
| **Performs 8-stage UX audits**: Walks real user journeys, audits 10 Nielsen heuristics, and inspects accessibility. | **Does NOT equate automated passes with full WCAG conformance**: Distinguishes automated checks from true accessibility. |

---

## Prerequisites

- **Git**: v2.20 or later with standard porcelain support.
- **Node.js**: v18.0.0 or later (Node 20+ recommended for test suite).
- **Supported Agent Environments**:
  - Claude Code (CLI or plugin marketplace)
  - OpenAI Codex (CLI or IDE extension)
  - Google Antigravity / Gemini CLI (`agy`)
  - DeepSeek Harness (DSH)
  - Any agent supporting the open [Agent Skills specification](https://agentskills.io/specification) (Cursor, Windsurf, OpenCode)

---

## 30-Second Setup

Pick your agent environment below:

### 1. Install

<details open>
<summary><strong>Claude Code</strong> (Plugin Marketplace)</summary>

```bash
claude plugin marketplace add AhmedAbdelhady24/engineering-workflow
claude plugin install engineering-workflow@AhmedAbdelhady24
```

*Follows Claude Code plugin marketplace update policies.*

</details>

<details>
<summary><strong>OpenAI Codex</strong> (Plugin Marketplace)</summary>

```bash
codex plugin marketplace add AhmedAbdelhady24/engineering-workflow
codex plugin add engineering-workflow@AhmedAbdelhady24
```

*Follows Codex plugin marketplace update policies.*

</details>

<details>
<summary><strong>Google Antigravity / Gemini CLI</strong> (Native Skills)</summary>

```bash
# Global installation (Antigravity IDE & CLI)
gemini skills install https://github.com/AhmedAbdelhady24/engineering-workflow.git --path skills/engineering-workflow

# Or project-local installation via installer script
bash scripts/install.sh --target antigravity-ide --scope project
```

</details>

<details>
<summary><strong>Open Skills CLI (skills.sh / Cursor / Windsurf / OpenCode)</strong></summary>

```bash
npx skills add AhmedAbdelhady24/engineering-workflow
```

</details>

<details>
<summary><strong>Direct Shell Installer (Universal)</strong></summary>

```bash
# Recommended: Clone and install locally
git clone https://github.com/AhmedAbdelhady24/engineering-workflow.git
cd engineering-workflow
bash scripts/install.sh --scope project    # or --scope global

# Direct automated bootstrap (clones/extracts archive automatically)
curl -fsSL https://raw.githubusercontent.com/AhmedAbdelhady24/engineering-workflow/master/scripts/install.sh | bash -s -- --scope project
```

</details>

### 2. Run `/engineering-workflow setup`

In your agent's chat or CLI, run setup once per repository:

```bash
/engineering-workflow setup
```

The orchestrator will:
1. Inspect the codebase, package managers, and test runners (non-blocking read-only).
2. Audit installed skills, MCP tools, and runtime capabilities against `skill-registry.json`.
3. Classify project archetype (backend, frontend, monorepo, greenfield).
4. Formulate the proposed implementation plan, standards, and ledger templates in memory.
5. Halt at an explicit **Approval Gate** presenting the Capability Readiness Report.
6. **Post-Approval**: Upon human sign-off, write the initialized `TASK_LOG.md`, `TASK_RECOVERY_LEDGER.md`, and approved standards baseline to disk.

### 3. You're ready to engineer.

---

## Why Universal Engineering Workflow Exists

Built to eliminate the four fatal failure modes of AI-assisted software engineering:

### #1: The Process Hijack vs. Pure Chaos

> "Simplicity is prerequisite for reliability."
> — Edsger W. Dijkstra

**The Problem**: Monolithic autonomous frameworks lock you out of your terminal with heavy runtimes, background daemons, and brittle state graphs. If an agent hits a bug, you cannot steer it. At the other extreme, unguided vibe-coding agents quickly descend into chaotic edits, unverified assumptions, and destructive Git commands.

**The Fix**: Four transparent, composable operations that guide the agent without hijacking control:
- **[`setup`](./skill/engineering-workflow/references/setup.md)**: Audits the repo, establishes test gates, presents the readiness report, halts at an Approval Gate, and initializes the recovery ledger upon approval.
- **[`execute`](./skill/engineering-workflow/references/execute.md)**: Executes specs in thin, test-driven vertical slices with a single-writer rule and bounded review loops.
- **[`review`](./skill/engineering-workflow/references/review.md)**: Strictly read-only, two-axis verification (Repo standards + Originating spec compliance).
- **[`ux-audit`](./skill/engineering-workflow/references/ux-audit.md)**: Evaluates real-world product usability, visual hierarchy, and accessibility via live browser automation.

### #2: Hallucinated Skill Execution ("I totally used TDD")

> "Without data, you're just another person with an opinion."
> — W. Edwards Deming

**The Problem**: Agents often have access to great specialist skills (`tdd`, `codebase-design`, `grilling`, `ponytail`), but merely mention them in conversation without actually invoking them. The agent claims it followed TDD, but wrote the implementation first, added tests as an afterthought, or skipped testing altogether.

**The Fix**: The **Skill Execution Contract**.
Before taking action, the agent must:
1. Match the task archetype against the **Task-to-Skill Consideration Matrix** in [`skill-registry.json`](skill/engineering-workflow/skill-registry.json).
2. Verify the selected specialist skill is installed in the current host environment.
3. Explicitly invoke the skill through the host's supported mechanism.
4. Report concrete runtime evidence (test commands, logs, exit codes) in the completion report.

```markdown
- **Skills Execution Summary**:
  - **Skills Considered**: [`grilling`, `domain-modeling`]
  - **Skills Actually Invoked**: [`tdd` (ran `npm test` red -> green), `ponytail` (minimal focused diff)]
  - **Skills Missing / Blocked**: [None]
```

### #3: Post-Compaction Amnesia

> "Those who cannot remember the past are condemned to repeat it."
> — George Santayana

**The Problem**: As conversations stretch past context limits, the host environment compacts or truncates history. The agent loses track of architectural boundaries, forgets what files were already edited, repeats completed work, and re-introduces previously solved bugs.

**The Fix**: The **Compaction-Proof Engineering Ledger**.
Every session persists a lightweight [`TASK_LOG.md`](./templates/TASK_LOG.md) and [`RECOVERY_LEDGER.md`](./templates/TASK_RECOVERY_LEDGER.md) with explicit checkpoint boundaries. If context compacts or the session restarts, the agent reads the ledger and reconciles disk status, resuming immediately from the last incomplete step with zero loss of momentum.

### #4: Code Passes CI, But the Experience Is Broken (The UX Blindspot)

> "Design is not just what it looks like and feels like. Design is how it works."
> — Steve Jobs

**The Problem**: AI-generated code frequently passes unit tests and TypeScript compilation, but fails catastrophically in the browser: modals trap keyboard focus, mobile viewports overflow, forms lack validation feedback, empty states are missing, and key user flows take five confusing clicks.

**The Fix**: **`ux-audit`**.
Walks real user journeys using live browser automation (Playwright or Chrome DevTools MCP), scores 10 Nielsen usability heuristics (1–5 scale), verifies WCAG 2.2 AA accessibility compliance, and produces concrete, reproducible fixes with file:line references.

---

## Operations & Skills Taxonomy

### User-Invoked Operations

Direct commands triggered by humans in the agent chat or CLI:

| Operation | Command | Primary Purpose | Deliverable |
| :--- | :--- | :--- | :--- |
| **`setup`** | `/engineering-workflow setup` | Codebase discovery, skill audit, tracker detection, baseline plan | `TASK_LOG.md`, `RECOVERY_LEDGER.md`, Approval Gate |
| **`execute`** | `/engineering-workflow execute` | Spec-driven, test-driven implementation in thin vertical slices | Verified code diffs, passing tests, execution evidence |
| **`review`** | `/engineering-workflow review` | Independent, read-only code review along Standards and Spec axes | Two-axis review report with file:line severity findings |
| **`ux-audit`** | `/engineering-workflow ux-audit [focus]` | Live browser walkthrough, usability heuristics, accessibility | Usability scorecard (1–5), WCAG findings, visual fixes |

### Dynamic Specialist Skill Integration

Specialist capabilities are evaluated dynamically via [`skill-registry.json`](skill/engineering-workflow/skill-registry.json):

| Task Archetype | Specialist Skills Considered | Primary Purpose & Execution Intent |
| :--- | :--- | :--- |
| **New feature with unclear requirements** | `grilling`, `grill-with-docs`, `domain-modeling` | Socratic interview; clarifying domain models and entities before writing code. |
| **Architecture planning** | `codebase-design`, `planning-and-task-breakdown` | Deep module boundaries, small interfaces hiding complexity, vertical slices. |
| **Feature implementation** | `ponytail`, `test-driven-development` (or `tdd`) [opt-in: `implement`] | Minimal complete diffs, TDD loop; execute does not auto-route to opt-in implement. |
| **Bug fixing** | `systematic-debugging`, `test-driven-development` | Root-cause reproduction before mutation, failing regression tests, verifying fixes. |
| **Engineering handoff** | `handoff` (user-only; ledger fallback) | Packaging structured context packages and recovery ledgers for peer agents. |
| **UX audit** | `ui-ux-pro-max`, `frontend-design`, `make-interfaces-feel-better`, `break-ui`, `browser-testing-with-devtools`, `frontend-ui-engineering` | Usability heuristics, visual design, micro-interactions, WCAG 2.2 AA testing. |
| **Simple change** | `ponytail` principles, focused verification | Minimal complete diff, zero speculative abstractions, focused unit testing. |

---

## Repository Structure

Built strictly to the [Agent Skills open specification](https://agentskills.io/specification). Pure markdown, JSON manifests, and standard shell scripts — zero proprietary binaries or background daemons.

```text
engineering-workflow/
├── .github/workflows/                 # CI automation (Node 20/22, least-privilege)
│   └── ci.yml
├── .claude-plugin/                    # Native Claude Code & Codex Marketplace
│   ├── marketplace.json               # Registers repository as an installable plugin catalog
│   └── plugin.json                    # Plugin manifest with operations & metadata
├── .changeset/                        # Automated semantic releases & changelogs
│   └── config.json
├── .agents/adr/                       # Architectural Decision Records
│   ├── 0001-skill-execution-contract.md
│   ├── 0002-compaction-proof-ledger.md
│   └── 0003-ux-audit-framework.md
├── scripts/
│   ├── sync-plugin-version.mjs        # Synchronizes versions across manifests
│   ├── validate-skill.mjs             # Schema & reference integrity validator
│   ├── install.sh                     # Idempotent, atomic multi-host installer
│   └── uninstall.sh                   # Safe rollback & uninstallation script
├── skill/engineering-workflow/        # Canonical Agent Skill implementation
│   ├── SKILL.md                       # Core router & Skill Execution Contract
│   ├── skill-registry.json            # Machine-readable specialist skill matrix
│   └── references/
│       ├── setup.md                   # Discovery & approval gate
│       ├── execute.md                 # Adaptive execution, TDD, single-writer & review loop
│       ├── review.md                  # Read-only two-axis audit & severity taxonomy
│       ├── ux-audit.md                # 8-stage usability & accessibility audit
│       ├── skill-routing.md           # Dynamic specialist consideration matrix
│       ├── mcps.md                    # Context7 & Chrome DevTools policies
│       ├── context-recovery.md        # Compaction recovery protocol & multi-agent rules
│       └── agent-compatibility.md     # Multi-agent roles & host invocations
├── skills/engineering-workflow/       # Agent Skills standard mirror (strictly synced)
├── templates/                         # TASK_LOG, RECOVERY_LEDGER, UX_AUDIT_REPORT, Standards
├── tests/                             # Comprehensive automated test suite
├── package.json
└── README.md
```

---

## Core Invariants & Safety

1. **Strict Git Safety**:
   - Inspects `git status` before touching files; protects concurrent work from other sessions.
   - Destructive Git operations (`git reset --hard`, `git clean -fd`, `git push --force`) are strictly prohibited.
   - Requires explicit human approval before any commit, push, or branch switch.
2. **Single-Writer Rule**: Only one active writer per file or worktree. Planning, Review, and UX Audit roles are strictly read-only.
3. **Bounded Review Loop**: Maximum 3 fix-and-verify iterations between Reviewer and Executor.
4. **Non-Destructive Setup**: Existing repository instructions (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`) are never overwritten blindly.
5. **Context Compaction Recovery**: Utilizes native platform compaction alongside persistent [`TASK_LOG.md`](./templates/TASK_LOG.md) and [`TASK_RECOVERY_LEDGER.md`](./templates/TASK_RECOVERY_LEDGER.md) to resume execution without repeating completed edits.
6. **Dynamic Specialist Routing**: Preloads nothing unnecessarily. Activates TDD, debugging, Matt Pocock skills, or UI skills strictly on demand. Pure backend projects classify UI capabilities as **NOT APPLICABLE**.

---

## Verification & Testing

The repository includes an automated test suite verifying spec compliance, routing rules, installer idempotency, recovery protocols, link integrity, and UX audit contracts:

```bash
# Run the automated test suite (95 tests)
npm test

# Run Host CLI Availability Tests (CLIs detected in PATH)
npm run test:live-smoke

# Run Host End-to-End Tests (Discovery & Invocability)
npm run test:host-e2e

# Validate Agent Skills specification compliance
npm run validate

# Verify plugin manifest version synchronization
npm run check-plugin-version
```

---

## Troubleshooting & FAQ

<details>
<summary><strong>Q: What if a specialist skill (like TDD or Ponytail) is not installed?</strong></summary>

Universal Engineering Workflow applies its own built-in discipline:
- For TDD: It writes a failing test, runs the project test runner to confirm the failure, implements minimal code, and verifies the passing run.
- For Ponytail: It applies the 7-Rung Decision Ladder directly (YAGNI, standard library, minimal diff) without falsely claiming external skill invocation.
</details>

<details>
<summary><strong>Q: How do I remove the skill or roll back an installation?</strong></summary>

Run the uninstaller script with the appropriate scope:
```bash
# Project-local removal:
bash scripts/uninstall.sh --scope project

# Global removal:
bash scripts/uninstall.sh --scope global
```
The uninstaller verifies ownership before deletion and preserves unowned files and symlink targets.
</details>

---

## License

[MIT License](LICENSE) &copy; Ahmed Abdelhady
