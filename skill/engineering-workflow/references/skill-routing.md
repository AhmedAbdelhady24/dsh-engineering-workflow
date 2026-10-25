# Skill Routing & Capability Matrix Reference

The `engineering-workflow` orchestrator selects specialist skills **on demand** based on task requirements and project archetype. It does not preload the full catalog into context for every prompt, nor does it bundle third-party skill implementations.

---

## Dynamic Skill Capability Matrix

### 1. Core Engineering Capabilities

| Capability / Skill | Verified Canonical Name | Purpose & Primary Triggers | Applicable Projects | Verified Source / Install |
| :--- | :--- | :--- | :--- | :--- |
| **Visual Communication** | `visual-communication` | Architecture, state flow, and data diagrams (Mermaid, SVG, HTML). | All projects requiring visual explanation. | Bundled or open standard (`npx skills add vercel-labs/skills`) |
| **Implementation Planning** | `planning-and-task-breakdown` / `implementation-planning` | Decomposing objectives into thin, verifiable task slices. | Medium/Complex tasks across all projects. | Open Agent Skills standard / `npx skills add vercel-labs/skills` |
| **Systematic Debugging** | `debugging-and-error-recovery` / `diagnosing-bugs` | Root-cause diagnosis, reproduction before mutation, post-mortem. | All bug fixing, test failures, and regressions. | Open Agent Skills standard / `npx skills add vercel-labs/skills` |
| **Test-Driven Development** | `test-driven-development` / `tdd` | Red-green-refactor loop, behavioral specifications, integration tests. | All projects with test frameworks. | Open Agent Skills standard / `npx skills add vercel-labs/skills` |
| **Code Review** | `code-review-and-quality` / `code-review` | Standards compliance, spec alignment, security checks. | All code changes prior to completion. | Open Agent Skills standard / `npx skills add vercel-labs/skills` |
| **Verification Gate** | `verification-before-completion` / `hermes-executor-verification` | Enforcing actual terminal command execution before claiming done. | All tasks. | Core invariant or open standard |
| **Skill Discovery** | `find-skills` | Discovering and installing missing specialist agent capabilities. | When a needed specialist skill is absent. | Built-in or `npx skills add vercel-labs/skills` |
| **Ponytail** | `ponytail` | Long-term memory and procedural pattern refinement. | Projects with Ponytail configured. | User-installed local skill (`~/.agents/skills/ponytail`) |

### 2. Matt Pocock Engineering Skills

| Capability / Skill | Verified Canonical Name | Purpose & When to Route | Applicability |
| :--- | :--- | :--- | :--- |
| **Socratic Challenge** | `grilling` | Adversarial cross-examination of design decisions and edge cases. | High-stakes architecture or irreversible decisions. |
| **Docs-Grounded Challenge** | `grill-with-docs` | Stress-testing architectural plans against authoritative documentation. | Framework migrations and public API design. |
| **Domain Modeling** | `domain-modeling` | Formulating ubiquitous language, domain dictionaries, and ADRs. | Domain-driven designs, data entities, glossaries. |
| **Deep Module Design** | `codebase-design` | Deep modules with small interfaces hiding extensive complexity. | Interface boundaries, SDKs, refactoring seams. |
| **Clean Implementation** | `implement` | Focused execution following pre-aligned domain models. | Core logic implementation slices. |
| **Handoff Artifacts** | `handoff` | Structured context packages for peer agents or session resets. | Multi-agent boundaries and milestone shifts. |
| **Architecture Evolution** | `improve-codebase-architecture` | Systematic decoupling, inversion of control, dependency hygiene. | Monolith refactoring and legacy modernization. |

### 3. UI & Frontend Capabilities

| Capability / Skill | Verified Canonical Name | Purpose & Primary Triggers | Applicability Policy |
| :--- | :--- | :--- | :--- |
| **UI/UX Intelligence** | `ui-ux-pro-max` | Design system profiles, font pairings, layout guidelines, micro-interactions. | **UI Projects Only**. If pure backend/CLI: **NOT APPLICABLE**. |
| **Frontend Design** | `frontend-design` | Distinctive visual styling, typography, spacing, and brand feel. | **UI Projects Only**. If pure backend/CLI: **NOT APPLICABLE**. |
| **Frontend Engineering** | `frontend-ui-engineering` | Production-grade React/Next.js/Vue/HTML/CSS implementation. | **UI Projects Only**. If pure backend/CLI: **NOT APPLICABLE**. |
| **Interface Polish** | `make-interfaces-feel-better` / `emil-design-eng` | Micro-interactions, transition physics, visual rhythm, optical alignment. | **UI Projects Only**. If pure backend/CLI: **NOT APPLICABLE**. |
| **UI Stress Testing** | `break-ui` / `ui-audit` | Feeding worst-case data (extreme lengths, empty states, edge inputs). | **UI Projects Only**. If pure backend/CLI: **NOT APPLICABLE**. |
| **Browser DevTools** | `browser-testing-with-devtools` | Real browser testing, console log audits, DOM inspection via MCP. | **UI Projects Only** (requires Chrome DevTools MCP). |
| **Visual Architecture** | `archify` | Standalone interactive SVG/HTML architecture diagrams. | Visual documentation (when approved and installed). |

---

## On-Demand Routing Rules

1. **Classify Project Type**:
   - Inspect package manifests and source trees.
   - If the codebase has no DOM, HTML, mobile screens, or web frontend (e.g., Node CLI, Python data pipeline, Go backend):
     - **Explicitly mark all UI capabilities as NOT APPLICABLE.**
     - Never recommend or attempt to install UI skills on pure backend codebases.

2. **Check Availability Before Invocation**:
   - Query the agent host's loaded skills before attempting to invoke a specialist capability.
   - If a specialist skill is already present in the workspace or user-global directory: route to it seamlessly.

3. **Handle Missing Mandatory Capabilities**:
   - If an engineering task strictly requires an unavailable specialist capability (e.g., TDD runner or browser testing):
     - **Do NOT silently downgrade standards.**
     - **Do NOT hallucinate that the skill was executed.**
     - Report the gap clearly to the user:
       ```text
       ⚠️ Missing Capability: [skill-name]
       This task requires [capability description] to ensure quality gates.
       To install it, run:
         npx skills add [verified-source]
       Proceed with manual verification fallback? [Requires user approval]
       ```

4. **Zero Bundling & Redistribution**:
   - The universal engineering workflow does not copy or vendor third-party skill markdown into its own repository.
   - All external capabilities are referenced strictly by canonical name and installed via official distribution channels.

---

## Specialist Skill Routing for `ux-audit`

When running the **`ux-audit`** operation on an application with a user interface, the orchestrator dynamically activates the following specialist capabilities:

| Stage | Activated Specialist Skills | Role in UX Audit | Fallback Policy if Missing |
| :--- | :--- | :--- | :--- |
| **Stage 1 & 6 (Discovery & Challenge)** | `codebase-design`, `domain-modeling` | Identifying core domain entities, interaction seams, and architectural models. | Inspect route definitions and state stores directly. |
| **Stage 2 (Runtime Walkthrough)** | `browser-testing-with-devtools` | Launching browser sessions, inspecting DOM, capturing screenshots, recording console/network errors. | If Chrome DevTools MCP is unavailable: Mark browser tests `NOT TESTED` and fallback to code-supported analysis. |
| **Stage 3 (Usability Heuristics)** | `ui-ux-pro-max`, `ui-audit` | Auditing against Nielsen's 10 heuristics, cognitive load, progressive disclosure, and user mental models. | Built-in heuristic scorecard guidelines in `references/ux-audit.md`. |
| **Stage 4 (Visual & Interaction Design)** | `frontend-design`, `make-interfaces-feel-better`, `emil-design-eng` | Evaluating visual hierarchy, 4/8px spacing rhythm, WCAG contrast, typography, and micro-interactions. | Standard WCAG 2.2 AA rules and CSS inspections. |
| **Stage 5 (Technical UX Architecture)** | `frontend-ui-engineering`, `codebase-design` | Tracing UI state synchronization, race conditions, form persistence, and error boundary handling. | Direct AST/source code inspection with file:line citations. |
| **Stage 6 & 7 (Journey Modeling)** | `visual-communication`, `archify` (if available) | Generating Mermaid current-state and proposed future-state user journey flowcharts. | Built-in Mermaid flowchart syntax. |
| **Standards & Docs Grounding** | Context7 MCP | Live official documentation for WCAG 2.2, accessibility APIs, or modern UI framework patterns. | Use local documentation or report unverified standards. |

> **Important**: For non-UI codebases (CLI utilities, background workers, backend APIs), invoking `ux-audit` immediately informs the user that the project has no user-facing interface, classifying UI skills as **NOT APPLICABLE**.
