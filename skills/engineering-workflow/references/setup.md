# Setup Operation Reference: Onboarding & Readiness Audit

The **`setup`** operation establishes engineering clarity for a new or existing repository. It inspects the codebase, verifies required skills and MCPs, proposes idiomatic engineering standards, drafts an implementation plan, and halts at an **Approval Gate** before any file is written or modified.

---

## Workflow Phases

```text
┌─────────────────────────┐
│ 1. Repository Inspection│  (Git state, manifests, dependencies, test scripts)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 2. Capability Audit     │  (Verify skills, Context7, Chrome DevTools MCP)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 3. Architecture Analysis│  (Archetype, monorepo boundaries, entry points)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 4. Standards Proposal   │  (Language idioms, test runner, linting, git rules)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 5. Initial Plan Draft   │  (Milestones, thin slices, risk assessment)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 6. Approval Gate        │  (Present Capability Readiness Report; HALT)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 7. Post-Approval Init   │  (Write TASK_LOG.md, TASK_RECOVERY_LEDGER.md)
└─────────────────────────┘
```

---

## Phase 1: Non-Blocking Repository Inspection

All discovery steps in Phase 1 and 2 are **strictly read-only** and must proceed without interrupting or blocking the user:

1. **Git State Verification**:
   - Check current branch: `git branch --show-current`
   - Check working tree cleanliness: `git status --short`
   - Check recent commit history: `git log -n 5 --oneline`
   - If dirty uncommitted changes exist, document them and strictly avoid touching modified files.

2. **Project Archetype & Manifest Detection**:
   - **Greenfield**: Empty directory or minimal repo. Prepare recommended toolchain, initial test framework, and baseline config.
   - **Brownfield / Existing**: Detect existing package managers and manifests:
     - Node / TypeScript: `package.json`, `pnpm-lock.yaml`, `package-lock.json`, `tsconfig.json`
     - Python: `pyproject.toml`, `requirements.txt`, `poetry.lock`
     - Rust: `Cargo.toml`, `Cargo.lock`
     - Go: `go.mod`, `go.sum`
   - **Monorepo Detection**: Check for `pnpm-workspace.yaml`, npm/yarn `workspaces`, `lerna.json`, `turbo.json`, or Cargo workspaces. Identify package boundaries and root vs. package scripts.
   - Identify existing build, lint, and test commands from manifests.

3. **Existing Instructions Audit**:
   - Check for existing instruction files: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `README.md`.
   - **Never overwrite existing instructions blindly**. Merge non-conflicting improvements and preserve user-defined domain rules.

---

## Phase 2: Capability & MCP Verification

Audit the active agent environment against project requirements:

1. **Core Skills Check**:
   - Inspect loaded skills for core capabilities: `test-driven-development` (or `tdd`), `systematic-debugging` (or `diagnosing-bugs`), `code-review`, `implementation-planning`, `ponytail`.
   - If missing, note installation command (e.g., `npx skills add <source>`).

2. **Project Domain & UI Capabilities Check**:
   - Determine if the project has user-facing interfaces (web, mobile, desktop).
   - If **NO UI** (pure backend, CLI, SDK, library, microservice):
     - **Explicitly classify all UI capabilities as NOT APPLICABLE.**
   - If **UI project**: check for `ui-ux-pro-max`, `frontend-design`, `make-interfaces-feel-better`, and `browser-testing-with-devtools`.

3. **MCP Verification**:
   - **Context7 MCP**: Verify availability for live documentation lookups. If unavailable, provide connection instructions.
   - **Chrome DevTools MCP**: Verify availability if browser-accessible UI exists. If unavailable, provide connection instructions.

---

## Phase 3: Architecture & System Discovery

1. Classify the system architecture:
   - Fullstack application (Next.js, Nuxt, SvelteKit, Remix)
   - Single Page Application (React, Vue, Vite) + API backend
   - Monorepo with shared internal packages
   - Microservice / REST / GraphQL backend
   - CLI tool / Library / SDK
2. Identify primary entry points (e.g., `src/index.ts`, `src/app/layout.tsx`, `cmd/main.go`).
3. Document data storage layers, database ORMs, external integrations, and persistence mechanisms.

---

## Phase 4: Engineering Standards Proposal

Draft an actionable standards baseline tailored to the project type:
- **Language & Framework Idioms**: Strict typing, modern runtime features, error modeling.
- **Testing Requirements**: Detected test runner (Vitest, Jest, pytest, go test), test coverage expectations, TDD approach.
- **Git Hygiene**: Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`), no force pushes, branch naming conventions.
- **Single-Writer Rule**: Only one active writer per file/worktree; separate concurrent work into distinct branches.

---

## Phase 5: Initial Implementation Plan

1. Break the target objective into ordered, thin vertical slices.
2. Define clear acceptance criteria and exit gates for each milestone.
3. Identify potential regression risks and dependency bottlenecks.

---

## Phase 6: The Approval Gate

Consequential operations **require explicit human approval** before proceeding:
- Installing new dependencies or global packages
- Modifying existing repository instructions or configuration files
- Running database migrations or altering external services
- Generating new files on disk

1. Generate a concise **Capability Readiness Report** summarizing:
   - Detected repository state, archetypes & toolchains
   - Available vs. missing skills and MCPs
   - Proposed project documentation files (`AGENTS.md`, `docs/ENGINEERING_STANDARDS.md`, `docs/ARCHITECTURE.md`)
   - Proposed initial implementation steps
2. Present the report clearly to the user.
3. **HALT AND REQUEST EXPLICIT APPROVAL**:
   - Ask the user to confirm the proposed architecture, documentation templates, and next steps before proceeding to execution.

---

## Phase 7: Post-Approval Initialization

Only after the user explicitly signs off at the Approval Gate:
1. Initialize the project execution log: write [`TASK_LOG.md`](../../../templates/TASK_LOG.md) to the repository root.
2. Initialize the task recovery ledger: write [`TASK_RECOVERY_LEDGER.md`](../../../templates/TASK_RECOVERY_LEDGER.md).
3. If approved, write the proposed project standards baseline ([`AGENTS.md`](../../../templates/AGENTS.md) or `docs/ENGINEERING_STANDARDS.md`).
4. Record the initial baseline commit SHA in the ledger and ready the environment for `/engineering-workflow execute`.

