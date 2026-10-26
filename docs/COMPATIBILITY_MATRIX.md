# Cross-Agent Compatibility Matrix

This document provides platform engineers and agent contributors with a comprehensive breakdown of how the `engineering-workflow` skill operates across all supported target environments.

---

## 1. Feature Support Matrix

| Capability / Dimension | Antigravity IDE | Antigravity CLI | DeepSeek Harness (DSH) | OpenAI Codex | Claude Code |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Verification Tier** | ✅ Runtime-Verified | ✅ Runtime-Verified | ✅ Runtime-Verified (Fixture) | 📋 Spec-Compatible (Docs-Verified) | ✅ Runtime-Verified |
| **Agent Skills Format (`SKILL.md`)** | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| **Universal Discovery Path (`.agents/skills`)** | ✅ Supported | ✅ Supported | ✅ Supported (Rank 200) | ✅ Supported | ✅ Supported |
| **Host-Specific Project Directory** | `.gemini/config/skills/` | `.gemini/antigravity-cli/skills/` | `.dsh/skills/` (Rank 100) | `.agents/skills/` | `.claude/skills/` |
| **User-Global Home Directory** | `~/.gemini/config/skills/` | `~/.gemini/antigravity-cli/skills/` | `~/.dsh/skills/` (Rank 400) | `~/.agents/skills/` | `~/.claude/skills/` |
| **Skills CLI Support (`npx skills`)** | ✅ Open standard | ✅ Open standard | ⚠️ Via custom path / copy | ✅ Supported | ✅ Supported |
| **Primary Invocation** | `/engineering-workflow <op>` | `/engineering-workflow <op>` | `/engineering-workflow <op>` | `$engineering-workflow <op>` | `/engineering-workflow <op>` |
| **Fallback Invocation** | `@engineering-workflow <op>` | `@engineering-workflow <op>` | `tool-skill` / prompt mention | Prompt mention | Prompt mention |
| **Argument Forwarding** | ✅ Suffix in turn prompt | ✅ Suffix in turn prompt | ✅ Turn prompt argument | ✅ Suffix in command | ✅ CLI argument capture |
| **Subagent Process Isolation** | ✅ `invoke_subagent` (Isolated context) | ✅ `invoke_subagent` | ✅ DSH native subagents | ⚠️ Multi-agent / Sequential | ⚠️ Task runner / Sequential |
| **Compaction Strategy** | Native reactive compaction | Native reactive compaction | Native `compaction-basic` | Native context window | Native `/compact` |
| **MCP Registry** | `~/.gemini/antigravity/mcp/` | `~/.gemini/antigravity/mcp/` | `~/.dsh/mcp.json` or profile | `~/.codex/config.toml` (`codex mcp add`) | `claude mcp add` |
| **Sandbox & Permissions** | UI modal approval | Terminal approval | DSH profile permissions | Execution approval | Interactive CLI prompt |

---

## 2. Platform Deep Dives

### 2.1 Google Antigravity (IDE & CLI)
- **Antigravity IDE**: Global skills reside at `~/.gemini/config/skills/engineering-workflow`. Discovers skills on workspace startup and parses YAML frontmatter to build the tool index.
- **Antigravity CLI (`agy`)**: Global skills reside at `~/.gemini/antigravity-cli/skills/engineering-workflow`.
- **Project-Local**: Both IDE and CLI natively inspect `<projectRoot>/.agents/skills/engineering-workflow` or `.gemini/config/skills/`.
- **Subagents**: High fidelity. Supports true multi-agent execution with role specialization (e.g. read-only Reviewer subagents).
- **Instructions**: Natively searches for `AGENTS.md` in repository root.

### 2.2 DeepSeek Harness (DSH)
- **Loading Behavior**: `@deepseek-ai/dsh-skill-filesystem` evaluates directories according to rank:
  1. `<projectRoot>/.dsh/skills/` (Rank 100)
  2. `<projectRoot>/.agents/skills/` (Rank 200)
  3. `customSkillDirs` (Rank 300)
  4. `~/.dsh/skills/` (Rank 400)
  5. `~/.agents/skills/` (Rank 500)
- **Standalone Architecture**: The universal skill requires no custom background daemons or runtime patches. Native DSH discovers `SKILL.md` directly.

### 2.3 OpenAI Codex CLI / IDE
- **Loading Behavior**: Discovers skills in `.agents/skills` or `.codex/skills`. Global skills reside at `~/.agents/skills/engineering-workflow`.
- **Syntax**: Uses `$` prefix for skill commands (e.g., `$engineering-workflow execute`).
- **Isolation Fallback**: In standalone CLI runs where subagent spawning is unavailable, the workflow executes the Planner, Executor, and Reviewer roles as distinct sequential passes in the same context, logging the absence of independent process isolation.

### 2.4 Claude Code
- **Loading Behavior**: Discovers skills in `.claude/skills` or `.agents/skills`. Global skills reside at `~/.claude/skills/engineering-workflow`.
- **Syntax**: Uses `/engineering-workflow <operation>`.
- **Instructions**: Claude Code looks for `CLAUDE.md`. The included `templates/compatibility/CLAUDE.md` provides a thin pointer directing the model to canonical `AGENTS.md`.

---

## 3. Invocation Protocol & Fallbacks

Clients handle slash commands differently. The canonical skill supports graceful degradation:

```text
Tier 1 (Native Slash Command):
  /engineering-workflow setup
  /engineering-workflow execute
  /engineering-workflow review
  /engineering-workflow ux-audit [focus]

Tier 2 (Codex Command Prefix):
  $engineering-workflow setup
  $engineering-workflow execute
  $engineering-workflow review
  $engineering-workflow ux-audit [focus]

Tier 3 (Universal Prompt Mention):
  "Use the engineering-workflow skill to [setup | execute | review | ux-audit] ..."
```

The router checks the incoming request for operation keywords (`setup`, `execute`, `review`, `ux-audit`) to ensure reliable dispatch regardless of how the client passes arguments.
