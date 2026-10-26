# Skill Routing & Capability Matrix Reference

The `engineering-workflow` orchestrator selects specialist skills **on demand** based on task requirements, complexity, and project archetype. It does not preload the full catalog into context for every prompt, nor does it vendor third-party skill implementations.

A complete machine-readable version of this matrix is available in [`skill-registry.json`](../skill-registry.json).

---

## Dynamic Specialist Skill Capability Matrix

### 1. Core Engineering & Architecture Capabilities

| Capability / Skill | Verified Canonical Name | Upstream Repository | Invocation Policy | Purpose & Primary Triggers | Applicable Projects | Verified Install Command | Fallback Policy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Socratic Interrogation** | `grilling` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | `model-invocable` | Adversarial cross-examination resolving all branches of a design tree. | Unclear requirements, high-stakes decisions. | `npx skills add mattpocock/skills --skill grilling` | Built-in Socratic questions in plan. |
| **Docs-Grounded Interrogation** | `grill-with-docs` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | `user-only` | Socratic challenge against official docs, ADR creation, glossary building. | Framework migrations, public API redesigns. | `npx skills add mattpocock/skills --skill grill-with-docs` | Use model-invocable `grilling` primitive + local ADR. |
| **Domain Modeling** | `domain-modeling` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | `model-invocable` | Ubiquitous language, entity modeling, and dictionary updates. | Domain logic, data models, entity relationships. | `npx skills add mattpocock/skills --skill domain-modeling` | Document entity terms and contracts inline. |
| **Deep Module Design** | `codebase-design` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | `model-invocable` | Deep modules with small interfaces hiding extensive complexity at clean seams. | Public APIs, new module boundaries, service seams. | `npx skills add mattpocock/skills --skill codebase-design` | Apply Ousterhout deep module principles directly. |
| **Pragmatic Minimalism** | `ponytail` | [`DietrichGebert/ponytail`](https://github.com/DietrichGebert/ponytail) | `model-invocable` | 7-Rung Decision Ladder: YAGNI -> reuse -> stdlib -> platform -> dependency -> one line -> minimum code. | All implementation tasks & simple changes. | `npx skills add https://github.com/DietrichGebert/ponytail --skill ponytail` | Apply 7-Rung ladder principles directly without claiming skill was invoked. |
| **Implementation Planning** | `planning-and-task-breakdown` / `implementation-planning` | [`obra/superpowers`](https://github.com/obra/superpowers) / open standard | `model-invocable` | Decomposing objectives into thin, verifiable task slices. | Medium and complex tasks. | Open Agent Skills standard / `npx skills add vercel-labs/skills` | Built-in milestone decomposition. |
| **Context Handoff** | `handoff` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | `user-only` / `host-dependent` | Packaging structured context and recovery packages for peer agents. | Multi-agent boundaries and milestone shifts. | `npx skills add mattpocock/skills --skill handoff` | Built-in `TASK_RECOVERY_LEDGER.md`. |
| **Architecture Evolution** | `improve-codebase-architecture` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | `user-only` | Systematic decoupling, inversion of control, dependency hygiene. | Monolith refactoring and legacy modernization. | `npx skills add mattpocock/skills --skill improve-codebase-architecture` | Apply modular decoupling in plan. |

### 2. Testing & Debugging Capabilities (Select One Primary)

When addressing code changes or bug fixes, choose **one primary testing or debugging capability** to avoid cognitive overhead and conflicting protocols:

| Capability / Skill | Verified Canonical Name | Upstream Repository | Invocation Policy | Purpose & Primary Triggers | Verified Install Command | Fallback Policy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Test-Driven Development (Pocock)** | `tdd` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | `model-invocable` | Strict red-green-refactor loop: failing test first, verify failure, implement, verify pass. | `npx skills add mattpocock/skills --skill tdd` | Built-in workflow TDD discipline. |
| **Test-Driven Development (Superpowers)** | `test-driven-development` | [`obra/superpowers`](https://github.com/obra/superpowers) | `model-invocable` | Behavioral TDD methodology enforcing red-green cycles. | `claude plugin install superpowers@superpowers-marketplace` | Built-in workflow TDD discipline. |
| **Systematic Diagnosis (Pocock)** | `diagnosing-bugs` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | `model-invocable` | Systematic bug isolation: build red loop -> minimise -> hypothesise -> instrument -> fix. | `npx skills add mattpocock/skills --skill diagnosing-bugs` | Built-in reproduction protocol. |
| **Systematic Debugging (Superpowers)** | `systematic-debugging` | [`obra/superpowers`](https://github.com/obra/superpowers) | `model-invocable` | Hypothesis-driven root-cause isolation. | `claude plugin install superpowers@superpowers-marketplace` | Built-in reproduction protocol. |
| **Two-Axis Code Review** | `code-review` | [`mattpocock/skills`](https://github.com/mattpocock/skills) | `model-invocable` | Two-axis review: Standards compliance + Spec fulfillment. | `npx skills add mattpocock/skills --skill code-review` | Built-in `references/review.md` checklist. |

> **Built-In Test Discipline**: The universal engineering workflow does **NOT** require an external TDD skill merely to run tests. When specialized TDD skills are absent, the orchestrator applies its own native red-green-refactor loop directly.

### 3. UI & Frontend Capabilities (Proportional Loading)

Activate UI skills **strictly on demand** for user-facing applications. Routine frontend edits should not load all UI skills at once.

| Capability / Skill | Verified Canonical Name | Upstream Repository | Invocation Policy | Purpose & When to Route | Applicability Policy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UI/UX Intelligence** | `ui-ux-pro-max` | AhmedAbdelhady24 / Open | `model-invocable` | Usability heuristics, design systems, font pairings, 1-5 scorecard. | **UI Projects Only**. Route during `ux-audit` Stage 3. Pure backend: **NOT APPLICABLE**. |
| **Frontend Design** | `frontend-design` | AhmedAbdelhady24 / Open | `model-invocable` | Visual hierarchy, typography scales, contrast ratios, and styling. | **UI Projects Only**. Route during visual overhauls. Pure backend: **NOT APPLICABLE**. |
| **Frontend Engineering** | `frontend-ui-engineering` | AhmedAbdelhady24 / Open | `model-invocable` | Production-grade React/Next.js/Vue/HTML/CSS implementation. | **UI Projects Only**. Route during complex UI state/store changes. |
| **Interface Polish** | `make-interfaces-feel-better` | AhmedAbdelhady24 / Open | `model-invocable` | Micro-interactions, transition physics, focus rings, optical alignment. | **UI Projects Only**. Route during polish & interaction tuning. |
| **UI Stress Testing** | `break-ui` | AhmedAbdelhady24 / Open | `model-invocable` | Feeding worst-case data (extreme lengths, empty states, huge numbers). | **UI Projects Only**. Route during edge-case form/table testing. |
| **Browser DevTools** | `browser-testing-with-devtools` | Official Chrome DevTools MCP | `model-invocable` | Real browser walkthrough, console error monitoring, screenshots. | **UI Projects Only** (requires Chrome DevTools MCP or CDP). If missing: Mark **NOT TESTED**. |

---

## Skill Execution Contract

The orchestrator enforces a strict boundary between **listing skills in routing tables** and **actually invoking those skills during execution**:

> **Rule — Skill Execution Contract**:
> Before performing a task, identify the relevant specialist skills, verify that they are installed and invocable, and explicitly load or invoke them through the host's supported mechanism.
> 
> **Do not treat mentioning a skill in the routing documentation as execution.**
> If a required skill is unavailable, report the blocker clearly with its verified installation command. Never silently downgrade quality gates.
> At completion, identify the skills actually invoked and distinguish them from skills merely considered.

```text
┌─────────────────────────────────┐
│ 1. Identify Candidate Skills    │
│ (Task-to-Skill Matrix)          │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ 2. Verify Host Availability     │
│ (Inspect active host catalog)   │
└────────┬───────────────┬────────┘
         │               │
  [Installed]      [Not Found]
         │               │
         ▼               ▼
┌────────────────┐   ┌────────────────────────┐
│ 3. Explicit    │   │ 3. Fallback & Report   │
│    Invocation  │   │ - Apply native rule    │
│                │   │ - Never claim external │
│                │   │   skill invocation     │
└────────┬───────┘   └───────────┬────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
┌────────────────────────────────────────┐
│ 4. Completion Reporting                │
│ - Skills Considered                    │
│ - Skills Actually Invoked (Evidence)   │
│ - Skills Missing / Blocked (Fallback)  │
└────────────────────────────────────────┘
```

---

## Task Archetype to Specialist Skill Matrix

| Task Archetype | Specialist Skills Considered | Primary Purpose & Execution Intent |
| :--- | :--- | :--- |
| **New feature with unclear requirements** | `grilling` (or `grill-with-docs`), `domain-modeling` | Socratic challenge, clarifying models and entities before writing code. |
| **Architecture planning** | `codebase-design`, `implementation-planning` | Deep module boundaries, small interfaces hiding complexity, vertical slices. |
| **Feature implementation** | `implement`, `ponytail`, `test-driven-development` (or `tdd`) | Guided plan execution, minimal/focused changes without bloat, TDD loop. |
| **Bug fixing** | `systematic-debugging` (or `diagnosing-bugs`), `test-driven-development` | Root-cause reproduction before mutation, failing regression tests, verifying fixes. |
| **Engineering handoff** | `handoff` | Packaging structured context packages and recovery ledgers for peer agents. |
| **UX audit** | `ui-ux-pro-max`, `frontend-design`, `make-interfaces-feel-better`, `browser-testing-with-devtools`, `break-ui` | Usability heuristics, visual design, micro-interactions, WCAG 2.2 AA testing. |
| **Simple change** | `ponytail` principles, focused verification | Minimal complete diff, zero speculative abstractions, focused unit testing. |

---

## Specialist Skill Routing for `ux-audit`

When running the **`ux-audit`** operation on an application with a user interface, the orchestrator dynamically activates the following specialist capabilities:

| Stage | Activated Specialist Skills | Role in UX Audit | Fallback Policy if Missing |
| :--- | :--- | :--- | :--- |
| **Stage 1 & 6 (Discovery & Challenge)** | `codebase-design`, `domain-modeling` | Identifying core domain entities, interaction seams, and architectural models. | Inspect route definitions and state stores directly. |
| **Stage 2 (Runtime Walkthrough)** | `browser-testing-with-devtools` | Launching browser sessions, inspecting DOM, capturing screenshots, recording console/network errors. | If Chrome DevTools MCP is unavailable: Mark browser tests `NOT TESTED` and fallback to code-supported analysis. |
| **Stage 3 (Usability Heuristics)** | `ui-ux-pro-max` | Auditing against Nielsen's 10 heuristics, cognitive load, progressive disclosure, and user mental models. | Built-in heuristic scorecard guidelines in `references/ux-audit.md`. |
| **Stage 4 (Visual & Interaction Design)** | `frontend-design`, `make-interfaces-feel-better` | Evaluating visual hierarchy, 4/8px spacing rhythm, WCAG contrast, typography, and micro-interactions. | Standard WCAG 2.2 AA rules and CSS inspections. |
| **Stage 5 (Technical UX Architecture)** | `frontend-ui-engineering`, `codebase-design` | Tracing UI state synchronization, race conditions, form persistence, and error boundary handling. | Direct AST/source code inspection with file:line citations. |

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
   - If an engineering task strictly requires an unavailable specialist capability:
     - **Do NOT silently downgrade standards.**
     - **Do NOT hallucinate that the skill was executed.**
     - Report the gap clearly to the user:
       ```text
       ⚠️ Missing Capability: [skill-name]
       This task requires [capability description] to ensure quality gates.
       To install it, run:
         npx skills add [verified-source]
       Proceed with native workflow fallback? [Requires user approval]
       ```

4. **Zero Bundling & Redistribution**:
   - The universal engineering workflow does not copy or vendor third-party skill markdown into its own repository.
   - All external capabilities are referenced strictly by canonical name and installed via official distribution channels.
