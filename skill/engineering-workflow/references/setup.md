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
│ 3. Architecture Analysis│  (Module boundaries, entry points, data flows)
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
└─────────────────────────┘
```

---

## Phase 1: Repository Inspection

1. **Git State Verification**:
   - Check current branch: `git branch --show-current`
   - Check working tree cleanliness: `git status --short`
   - Check recent commit history: `git log -n 5 --oneline`
   - If dirty uncommitted changes exist, document them and strictly avoid touching modified files.

2. **Ecosystem & Toolchain Detection**:
   - Detect project manifests:
     - Node / TypeScript: `package.json`, `pnpm-lock.yaml`, `package-lock.json`, `tsconfig.json`
     - Python: `pyproject.toml`, `requirements.txt`, `poetry.lock`
     - Rust: `Cargo.toml`, `Cargo.lock`
     - Go: `go.mod`, `go.sum`
   - Identify existing build, lint, and test commands from manifests.

3. **Existing Instructions Audit**:
   - Check for existing instruction files: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `README.md`.
   - **Never overwrite existing instructions blindly**. Merge non-conflicting improvements and preserve user-defined domain rules.

---

## Phase 2: Capability & MCP Verification

Audit the active agent environment against project requirements:

1. **Core Skills Check**:
   - Inspect loaded skills for core capabilities: `test-driven-development`, `systematic-debugging`, `code-review`, `implementation-planning`, `visual-communication`.
   - If missing, note installation command (e.g., `npx skills add <source>`).

2. **UI Capabilities Check**:
   - Determine if the project is a user-facing frontend (web, mobile, desktop).
   - If **NO UI** (pure backend, CLI, SDK, library): classify all UI capabilities as **NOT APPLICABLE**.
   - If **UI project**: check for `frontend-ui-engineering`, `frontend-design`, `make-interfaces-feel-better`, and `ui-audit`.

3. **MCP Verification**:
   - **Context7 MCP**: Verify availability for live documentation lookups. If unavailable, provide connection instructions.
   - **Chrome DevTools MCP**: Verify availability if browser-accessible UI exists. If unavailable, provide connection instructions.

---

## Phase 3: Architecture & Product Discovery

1. Identify system archetype:
   - Client-server web application (SPA + API)
   - Fullstack framework (Next.js, Remix, Nuxt)
   - Microservice / REST / GraphQL backend
   - CLI tool / Library / SDK
2. Identify primary entry points (e.g., `src/index.ts`, `src/app/layout.tsx`, `main.go`).
3. Document data storage layers, external integrations, and persistence mechanisms.

---

## Phase 4: Engineering Standards Proposal

Draft an actionable standards baseline covering:
- **Language & Framework Idioms**: Strict typing, modern runtime features, error modeling.
- **Testing Requirements**: Unit test framework (Vitest, Jest, pytest, go test), test coverage expectations, TDD approach.
- **Git Hygiene**: Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`), no force pushes, branch naming conventions.
- **Single-Writer Rule**: Only one active writer per file/worktree; separate concurrent work into distinct branches.

---

## Phase 5: Initial Implementation Plan

1. Break the target objective into ordered, thin vertical slices.
2. Define clear acceptance criteria and exit gates for each milestone.
3. Identify potential regression risks and dependency bottlenecks.

---

## Phase 6: The Approval Gate

Before writing any new files, generating templates, installing dependencies, or modifying configuration:

1. Generate a **Capability Readiness Report** summarizing:
   - Detected repository state & toolchains
   - Available vs. missing skills and MCPs
   - Proposed project documentation files (`AGENTS.md`, `docs/ENGINEERING_STANDARDS.md`, `docs/ARCHITECTURE.md`)
   - Proposed initial implementation steps
2. Present the report clearly to the user.
3. **HALT AND REQUEST EXPLICIT APPROVAL**:
   - Ask the user to confirm the proposed architecture, documentation templates, and next steps before proceeding to execution.
