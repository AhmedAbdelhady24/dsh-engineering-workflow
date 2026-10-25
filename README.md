# Universal Engineering Workflow

A portable, production-quality Agent Skills package implementing a disciplined multi-stage software engineering workflow across Google Antigravity, DeepSeek Harness, OpenAI Codex, and Claude Code. Built strictly to the [Agent Skills open specification](https://agentskills.io/specification).

![Universal Engineering Workflow](docs/visuals/universal-workflow-banner.png)

---

## Why Engineering Workflow

Autonomous coding agents are powerful, but complex engineering tasks quickly encounter context chaos: redundant refactoring after context compaction, silent overwrites of uncommitted changes, unverified assumptions, and destructive Git commands.

Universal Engineering Workflow brings the discipline of a Staff Software Engineer to coding agents. It enforces a strict single-writer rule, dynamic specialist skill routing, test-driven development (TDD), bounded review loops (maximum 3 cycles), and persistent context compaction recovery. It provides **one canonical implementation** that runs reliably in your IDE and CLI without background daemons, custom execution runtimes, or vendor lock-in.

---

## Workflow Operations & Capabilities

Standardizing software engineering tasks into three core operations:

| Operation | How it helps | Specialists & Integrations | Reference Guide |
| :--- | :--- | :--- | :--- |
| **[`setup`](./skill/engineering-workflow/references/setup.md)** | Inspects repository structure, audits installed skills & MCPs, proposes standards, drafts an initial plan, and halts at an **Approval Gate**. | `find-skills`, `domain-modeling`, `codebase-design` | [`references/setup.md`](./skill/engineering-workflow/references/setup.md) |
| **[`execute`](./skill/engineering-workflow/references/execute.md)** | Triages task scope, routes specialist skills on demand, implements minimal changes with TDD, and drives a bounded review loop. | `test-driven-development`, `systematic-debugging`, Matt Pocock skills, UI/UX skills | [`references/execute.md`](./skill/engineering-workflow/references/execute.md) |
| **[`review`](./skill/engineering-workflow/references/review.md)** | Conducts an objective, independent audit (correctness, security, performance, accessibility) with file:line references and zero code mutations. | `code-review`, `verification-before-completion`, `ui-audit` | [`references/review.md`](./skill/engineering-workflow/references/review.md) |
| **[`ux-audit`](./skill/engineering-workflow/references/ux-audit.md)** | Comprehensive product usability, user journey walkthrough, visual design, WCAG 2.2 AA accessibility, and UX technical architecture audit. | `ui-ux-pro-max`, `frontend-design`, `make-interfaces-feel-better`, `break-ui`, `browser-testing-with-devtools` | [`references/ux-audit.md`](./skill/engineering-workflow/references/ux-audit.md) |
| **[`recovery`](./skill/engineering-workflow/references/context-recovery.md)** | Maintains a persistent [`TASK_RECOVERY_LEDGER.md`](./templates/TASK_RECOVERY_LEDGER.md) so agents resume post-compaction without repeating completed edits. | Platform native compaction, Ledger reconciliation | [`references/context-recovery.md`](./skill/engineering-workflow/references/context-recovery.md) |

---

## Skill Execution Contract & Dynamic Orchestration

There is a fundamental difference between listing specialist skills in documentation and **actually invoking them at runtime**. Universal Engineering Workflow enforces the **Skill Execution Contract**:

> **Rule — Skill Execution Contract**:
> Before performing a task, identify the relevant specialist skills, verify that they are installed and invocable, and explicitly load or invoke them through the host's supported mechanism.
> 
> **Do not treat mentioning a skill in the routing documentation as execution.**
> If a required skill is unavailable, report the blocker clearly with its verified installation command.
> At completion, explicitly distinguish between **Skills Actually Invoked** vs. **Skills Merely Considered** vs. **Skills Missing/Blocked**.

### Task Archetype to Specialist Skill Mapping

| Task Archetype | Specialist Skills Considered | Primary Purpose & Execution Intent |
| :--- | :--- | :--- |
| **New feature with unclear requirements** | `grilling` (or `grill-with-docs`), `domain-modeling` | Socratic challenge, clarifying models and entities before writing code. |
| **Architecture planning** | `codebase-design`, `implementation-planning` | Deep module boundaries, small interfaces hiding complexity, vertical slices. |
| **Feature implementation** | `implement`, `ponytail`, `test-driven-development` | Guided plan execution, minimal/focused changes without bloat, TDD loop. |
| **Bug fixing** | `systematic-debugging`, `test-driven-development` | Root-cause reproduction before mutation, failing regression tests, verifying fixes. |
| **Engineering handoff** | `handoff` | Packaging structured context packages and recovery ledgers for peer agents. |
| **UX audit** | `ui-ux-pro-max`, `frontend-design`, `make-interfaces-feel-better`, `browser-testing-with-devtools`, `break-ui` | Usability heuristics, visual design, micro-interactions, WCAG 2.2 AA testing. |
| **Simple change** | `ponytail` principles, focused verification | Minimal complete diff, zero speculative abstractions, focused unit testing. |

### Execution Report Contract

Every task execution completion report must include an explicit **Skills Execution Summary**:

```markdown
- **Skills Execution Summary**:
  - **Skills Considered**: [List matching task archetype]
  - **Skills Actually Invoked**: [List confirmed installed and actively executed with method]
  - **Skills Missing / Blocked**: [Any required specialist skills absent from the environment and fallback applied]
```

---

## Getting Started

Install the workflow once into your project or globally across your development environment.

### 1. Google Antigravity (IDE / CLI)

```bash
# Project-local installation (.agents/skills/engineering-workflow)
bash scripts/install.sh --target antigravity-ide --scope project

# User-global installation
bash scripts/install.sh --target antigravity-ide --scope global  # ~/.gemini/config/skills/
bash scripts/install.sh --target antigravity-cli --scope global  # ~/.gemini/antigravity-cli/skills/
```

**Invocation**: In Antigravity chat, trigger with `/engineering-workflow <setup | execute | review | ux-audit>` or natural intent (e.g., `"Use engineering-workflow ux-audit to evaluate this product's usability"`). Supports optional focus argument: `/engineering-workflow ux-audit [onboarding | navigation | accessibility | <flow>]`.

### 2. DeepSeek Harness (DSH)

```bash
# Project-local installation (.agents/skills/engineering-workflow)
bash scripts/install.sh --target dsh --scope project

# User-global installation
bash scripts/install.sh --target dsh --scope global  # ~/.dsh/skills/
```

**Invocation**: Run `/engineering-workflow <setup | execute | review | ux-audit>` or prompt DSH with `tool-skill: engineering-workflow`.

### 3. OpenAI Codex (CLI / IDE)

```bash
# Project-local installation (.agents/skills/engineering-workflow)
bash scripts/install.sh --target codex --scope project

# User-global installation
bash scripts/install.sh --target codex --scope global  # ~/.agents/skills/
```

**Invocation**: Mention `$engineering-workflow <setup | execute | review | ux-audit>` or invoke in session prompt.

### 4. Claude Code (CLI)

```bash
# Project-local installation (.agents/skills/engineering-workflow)
bash scripts/install.sh --target claude --scope project

# User-global installation
bash scripts/install.sh --target claude --scope global  # ~/.claude/skills/
```

**Invocation**: Run `/engineering-workflow <setup | execute | review | ux-audit>`.

### 5. Open Skills CLI (`skills.sh`)

If using the open Skills CLI (`npx skills`):

```bash
npx skills add ./skill/engineering-workflow
```

---

## How It Works

Every component in the workflow is strictly file-based — pure markdown, standard YAML frontmatter, and JSON. No custom background daemons, no event buses, and no vendor lock-in.

```text
engineering-workflow/
├── SKILL.md                     # Canonical Agent Skill manifest & operation router
└── references/                  # Specialized execution contracts
    ├── setup.md                 # Discovery & approval gate
    ├── execute.md               # TDD, single-writer & review loop
    ├── review.md                # Read-only audit & severity taxonomy
    ├── ux-audit.md              # Product usability, UI/UX & technical UX audit
    ├── skill-routing.md         # Dynamic specialist activation
    ├── mcps.md                  # Context7 & Chrome DevTools policies
    ├── context-recovery.md      # Compaction recovery protocol
    └── agent-compatibility.md   # Multi-agent roles & host invocations
```

- **Operations (`setup`, `execute`, `review`, `ux-audit`)** encode the engineering and product contracts. Each operation has clear boundaries, deliverables, and stop criteria.
- **Specialists** are activated strictly on demand. For backend projects, UI capabilities are classified as NOT APPLICABLE; for frontend projects, UI and Chrome DevTools skills are activated dynamically.
- **Connectors (MCPs)** wire your agents to external capabilities (Context7 for library docs, Chrome DevTools for DOM/browser verification) under strict approval-first rules.

---

## Making It Yours

The workflow ships with sensible, production-tested defaults, but is designed to be tailored to your team's stack:

- **Customize Engineering Standards** — Edit [`templates/docs/ENGINEERING_STANDARDS.md`](./templates/docs/ENGINEERING_STANDARDS.md) and [`templates/docs/UI_STANDARDS.md`](./templates/docs/UI_STANDARDS.md) to codify your team's linting, formatting, testing, and architectural conventions.
- **Configure MCP Connectors** — Follow [`references/mcps.md`](./skill/engineering-workflow/references/mcps.md) to wire Context7 or Chrome DevTools into your specific agent config.
- **Plug in Specialist Skills** — Add specialized skills (e.g., security audits, custom ORMs, brand styling) to `.agents/skills` and reference them in [`references/skill-routing.md`](./skill/engineering-workflow/references/skill-routing.md).
- **Configure Multi-Agent Roles** — In multi-agent environments, assign Planner, Executor, and Independent Reviewer to isolated subagents with read-only constraints for reviewers.

---

## Key Invariants & Safety

1. **Strict Git Safety**:
   - Inspects `git status` before touching files; protects concurrent work from other sessions.
   - Destructive Git operations (`git reset --hard`, `git clean -fd`, `git push --force`) are prohibited.
   - Requires explicit human approval before any commit, push, or branch switch.
2. **Single-Writer Rule**: Only one active writer per file or worktree. Planning and Review roles are strictly read-only.
3. **Bounded Review Loop**: Maximum 3 fix-and-verify iterations between Reviewer and Executor.
4. **Non-Destructive Setup**: Existing repository instructions (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`) are never overwritten blindly.
5. **Context Compaction Recovery**: Utilizes native platform compaction alongside a persistent [`TASK_RECOVERY_LEDGER.md`](templates/TASK_RECOVERY_LEDGER.md) to resume execution without repeating completed edits.
6. **Dynamic Specialist Routing**: Preloads nothing unnecessarily. Activates TDD, debugging, Matt Pocock skills, or UI skills strictly on demand. Pure backend projects classify UI capabilities as **NOT APPLICABLE**.

---

## Rollback & Uninstallation

Safely removes the skill without affecting any other skills or project files:

```bash
# Project-local removal:
bash scripts/uninstall.sh --scope project

# Global removal:
bash scripts/uninstall.sh --scope global
```

---

## Contributing

Universal Engineering Workflow is an open-source Agent Skills package. Contributions, issue reports, and specialist skill integrations are welcome via GitHub pull requests.

## License

[MIT License](LICENSE)
