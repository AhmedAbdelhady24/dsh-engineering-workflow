# Cross-Agent Compatibility Matrix Reference

This document details the operational semantics, discovery paths, invocation syntax, and runtime behaviors across all four supported host environments: **Google Antigravity**, **DeepSeek Harness (DSH)**, **OpenAI Codex**, and **Claude Code**.

---

## Compatibility Comparison Matrix

| Dimension | Antigravity IDE | Antigravity CLI | DeepSeek Harness (DSH) | OpenAI Codex | Claude Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard Discovery Root** | `.agents/skills/` | `.agents/skills/` | `.dsh/skills/` (Rank 100) or `.agents/skills/` (Rank 200) | `.agents/skills/` | `.claude/skills/` or `.agents/skills/` |
| **User Global Root** | `~/.gemini/config/skills/` | `~/.gemini/antigravity-cli/skills/` | `~/.dsh/skills/` (Rank 400) | `~/.agents/skills/` | `~/.claude/skills/` |
| **Skills CLI Target** | Supported via open standard | Supported via open standard | Supported via `.agents/skills` or `customSkillDirs` | Supported (`~/.agents/skills`) | Supported (`npx skills add --agent claude-code`) |
| **Primary Invocation** | `/engineering-workflow <op> [focus]` | `/engineering-workflow <op> [focus]` | `/engineering-workflow <op> [focus]` | `$engineering-workflow <op> [focus]` | `/engineering-workflow <op> [focus]` |
| **Fallback Invocation** | Prompt mention / `@engineering-workflow` | Prompt mention / `@engineering-workflow` | `tool-skill` / prompt mention | Prompt mention / `$skill-name` | Prompt mention / `/skill-name` |
| **Argument Forwarding** | Yes (captured as prompt suffix) | Yes (captured in turn prompt) | Yes (captured in turn prompt) | Yes (captured after `$name`) | Yes (passed in command line) |
| **Subagent Delegation** | Native `invoke_subagent` | Native `invoke_subagent` | Native DSH subagents / sequential pass | Native multi-agent / sequential pass | Native Task runner / sequential pass |
| **Compaction Engine** | Native reactive compaction | Native reactive compaction | Native `compaction-basic` (near 50%) | Native context sliding window | Native `/compact` and auto-pruning |
| **MCP Registry** | `~/.gemini/antigravity/mcp/` | `~/.gemini/antigravity/mcp/` | `~/.dsh/mcp.json` or profile config | `~/.codex/mcp.json` | `claude mcp add` / `mcp.json` |
| **Sandbox & Approval** | Client permission dialogs | Client permission dialogs | DSH security policies / profile | Codex approval modes | Claude Code confirmation prompts |

### Supported Operations & Argument Syntax
- **`setup`**: `/engineering-workflow setup` (Initial repository onboarding and capability audit)
- **`execute`**: `/engineering-workflow execute [task description]` (TDD and implementation loop)
- **`review`**: `/engineering-workflow review [branch | PR | diff]` (Read-only technical and code review)
- **`ux-audit`**: `/engineering-workflow ux-audit [onboarding | navigation | accessibility | <flow>]` (Product usability, UI/UX, and technical UX audit)
- **Portable Fallback**: `"Use the engineering-workflow skill in ux-audit mode to evaluate this product's usability, UI/UX, and technical experience."`

---

## Host-Specific Details

### 1. Google Antigravity (IDE & CLI)
- **Discovery**:
  - **Antigravity IDE**: Global skills reside at `~/.gemini/config/skills/engineering-workflow`.
  - **Antigravity CLI (`agy`)**: Global skills reside at `~/.gemini/antigravity-cli/skills/engineering-workflow`.
  - **Project-Local**: Both IDE and CLI natively inspect `<projectRoot>/.agents/skills/engineering-workflow` or `.gemini/config/skills/`.
- **Invocation**: When the user types `/engineering-workflow setup`, Antigravity injects the skill into context and passes `setup` in the user message.
- **Subagents**: Planning and Review phases spawn dedicated child agents using `invoke_subagent` with read-only tools, providing true process isolation.
- **Instructions**: References `AGENTS.md` natively in the project root.

### 2. DeepSeek Harness (DSH)
- **Discovery**: Scans six ranked paths:
  1. `<projectRoot>/.dsh/skills/` (Rank 100)
  2. `<projectRoot>/.agents/skills/` (Rank 200)
  3. `Config.customSkillDirs` (Rank 300)
  4. `~/.dsh/skills/` (Rank 400)
  5. `~/.agents/skills/` (Rank 500)
  6. Bundled skills (Rank 600)
- **Invocation**: `/engineering-workflow <operation>`.
- **Compaction**: Native `compaction-basic` triggers automatic summarization at high context pressure. The skill maintains a lightweight `TASK_RECOVERY_LEDGER.md` for deterministic resume.

### 3. OpenAI Codex
- **Discovery**: Prioritizes `.agents/skills/engineering-workflow` in the repository and `~/.agents/skills/` globally.
- **Invocation**: Use `$engineering-workflow <operation>` or an explicit mention in the prompt.
- **Subagents**: In environments where subagents are not enabled, execute the Planner, Executor, and Reviewer as sequential phases in the same session, explicitly reporting that independent reviewer isolation was unavailable.
- **Instructions**: Reads `AGENTS.md` automatically at repository root.

### 4. Claude Code
- **Discovery**: Scans `.claude/skills/engineering-workflow` or `.agents/skills/engineering-workflow`, and user-global `~/.claude/skills/`.
- **Invocation**: `/engineering-workflow <operation>` or prompt mention.
- **Subagents**: Subagent task delegation or sequential pass with explicit isolation disclosure.
- **Instructions**: Reads `CLAUDE.md` or `AGENTS.md`. A thin `CLAUDE.md` pointing to `AGENTS.md` is provided in `templates/compatibility/CLAUDE.md`.

---

## Invocation Fallback Protocol

If a client's slash-command router fails to forward arguments or does not recognize slash commands:

```text
Prompt Fallback:
"Use the engineering-workflow skill to execute [operation: setup | execute | review] for [task description]."
```

The skill detects the operation keyword (`setup`, `execute`, or `review`) within the first 100 tokens of the prompt and branches accordingly.
