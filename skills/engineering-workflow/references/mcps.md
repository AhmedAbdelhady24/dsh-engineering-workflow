# Model Context Protocol (MCP) Integration & Policy Reference

The Model Context Protocol (MCP) provides standard interfaces for AI agents to query external tools, databases, documentation services, and runtime environments.

This reference defines the universal MCP integration policy across **Google Antigravity**, **DeepSeek Harness (DSH)**, **OpenAI Codex**, and **Claude Code**.

---

## Universal MCP Principles

1. **Human Approval Gate**: All MCP installations, server registrations, network-connected tools, and credential configurations require explicit user review and approval before execution.
2. **Zero Embedded Secrets**: Never hardcode API keys, personal access tokens, database passwords, or OAuth secrets into configuration files, repositories, or prompts. Use environment variables.
3. **On-Demand Tool Usage**: Call MCP tools only when local codebase tools (reading files, executing tests, running linters) cannot satisfy the objective.
4. **Isolated Browser Profiles**: Browser-controlling MCPs must use an isolated testing profile to prevent session pollution, cache bleeding, or credential exposure.

---

## Baseline MCP Servers

### 1. Context7 (`upstash/context7`)

**Role**: Baseline live documentation provider. Prevents API hallucinations and outdated package usage by querying official, version-matched documentation.

- **When to Use**:
  - Unfamiliar third-party framework or SDK APIs.
  - Specific version migration paths (e.g., Next.js 13 -> 14, React 18 -> 19).
  - Accurate configuration schemas (Tailwind, Drizzle, Prisma, Vitest).
  - External cloud service SDK integration.
- **When NOT to Use**:
  - Familiar standard library methods (e.g., JavaScript `Array.prototype.map`, Python `os.path.join`).
  - Codebase-internal functions and existing project modules.
  - Purely algorithmic or offline coding tasks.

**Tools Exposed**:
- `resolve-library-id`: Search for a library by name to retrieve its canonical Context7 ID.
- `query-docs`: Query focused documentation and code examples for a resolved library.

---

### 2. Chrome DevTools MCP (`chrome-devtools-mcp`)

**Role**: Mandatory browser testing and runtime visual verification engine for browser-accessible web applications.

- **When to Use**:
  - Verifying rendered UI layout, typography, and spacing.
  - Capturing browser screenshots for visual regression checks.
  - Auditing console errors, unhandled exceptions, and runtime warnings.
  - Inspecting DOM accessibility trees and ARIA attributes.
  - Investigating network latency, failed HTTP requests, or CORS errors.
- **When NOT to Use**:
  - Non-UI projects (pure APIs, CLI tools, libraries, worker queues).

**Tools Exposed**:
- Browser navigation, click, fill, evaluate scripts, console logs, network inspection, screenshots.

---

### 3. Evaluated On-Demand MCPs

| Category | Recommended MCP | Trigger / Evaluation Criteria |
| :--- | :--- | :--- |
| **Code Collaboration** | `github-mcp` | Pull request creation, issue tracking, remote branch review. |
| **Database Inspection** | `postgres-mcp` / `sqlite-mcp` | Direct schema inspection, query profiling (read-only mode preferred). |
| **Design Handoff** | `figma-mcp` | Reading design tokens, vector nodes, and layout specs directly from Figma URLs. |
| **Filesystem / Workspace**| Native Host Tools | Always prefer the agent host's native file tools over redundant MCP filesystem servers. |

---

## Host Configuration Guide

### 1. Google Antigravity
Configured in `~/.gemini/antigravity/mcp/settings.json` or workspace settings:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--headless=true"]
    }
  }
}
```

### 2. DeepSeek Harness (DSH)
Registered in the user profile configuration (`~/.dsh/config.yml` or profile patch):

```yaml
plugins:
  - id: mcp-context7
    name: '@deepseek-ai/dsh-mcp'
    config:
      command: npx
      args: ['-y', '@upstash/context7-mcp']
      env:
        CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}'
  - id: mcp-chrome-devtools
    name: '@deepseek-ai/dsh-mcp'
    config:
      command: npx
      args: ['-y', 'chrome-devtools-mcp@latest', '--headless=true']
```

### 3. OpenAI Codex
Configured in `~/.codex/mcp.json` or project-local `.codex/mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--headless=true"]
    }
  }
}
```

### 4. Claude Code
Configured via the Claude CLI or `~/.claude/mcp.json`:

```bash
# Add Context7
claude mcp add context7 npx -y @upstash/context7-mcp

# Add Chrome DevTools
claude mcp add chrome-devtools npx -y chrome-devtools-mcp@latest -- --headless=true
```
Or in `~/.claude/mcp.json`:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--headless=true"]
    }
  }
}
```
