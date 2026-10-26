# UX Audit Operation Reference

The **`ux-audit`** operation conducts a comprehensive, evidence-based **product usability, visual design, accessibility, and UX-related technical architecture audit** for software projects with a user-facing interface.

While the **`review`** operation focuses on code quality, technical correctness, security, and repository maintainability from an engineering perspective, **`ux-audit`** evaluates the application from the **end user's perspective**—examining information architecture, cognitive load, visual hierarchy, interaction feedback, WCAG accessibility, and the underlying technical architecture that impacts the user experience.

---

## Invocation & Focus Modes

The `ux-audit` operation supports both comprehensive audits and targeted deep-dives via an optional focus argument:

```text
# Universal Invocation Syntax:
/engineering-workflow ux-audit [focus]           [Antigravity, DSH, Claude Code]
$engineering-workflow ux-audit [focus]           [OpenAI Codex]
@engineering-workflow ux-audit [focus]           [Explicit Prompt Mention]
```

### Supported Focus Modes

| Command | Focus Area | Scope & Depth |
| :--- | :--- | :--- |
| `/engineering-workflow ux-audit` | **Full Product Audit** | Comprehensive evaluation across all 8 audit stages, end-to-end user journeys, and full technical architecture. |
| `/engineering-workflow ux-audit onboarding` | **Onboarding & First-Run** | First-time user experience, welcome screens, signup/auth, initial data configuration, and time-to-first-value. |
| `/engineering-workflow ux-audit navigation` | **Information Architecture** | Menus, routing, breadcrumbs, search, orientation, deep-linking, and mental model alignment. |
| `/engineering-workflow ux-audit accessibility` | **Accessibility & WCAG** | WCAG 2.2 AA compliance, color contrast, keyboard tab order, screen-reader semantics, and responsive breakpoints. |
| `/engineering-workflow ux-audit <flow>` | **Targeted Workflow** | Deep-dive audit into a specific business process (e.g., `checkout`, `workspace-settings`, `search-palette`, `dashboard`). |

---

## Core Safety & Read-Only Governance

The `ux-audit` operation is strictly **read-only with respect to application implementation**:

1. **Zero Code Modification**:
   - Never edit, format, or mutate application code, styles, or configuration.
   - Never stage, commit, push, stash, or reset Git branches.
2. **Safe Diagnostics Only**:
   - Inspect source files, component trees, and test suites.
   - Run non-destructive development servers or diagnostic checks in isolated testing environments.
   - Use synthetic, mock, or disposable test data; never mutate real user data or production databases.
3. **Honest Runtime Reporting**:
   - If browser automation tools (Chrome DevTools MCP, Playwright) or local dev servers are unavailable, explicitly report the constraint and classify affected findings as **CODE-SUPPORTED** or **NOT TESTED**. Never claim runtime verification without execution evidence.
4. **Approval Gate for Reports**:
   - Draft findings in memory or a scratch buffer. Request user confirmation before writing the final [`UX_AUDIT_REPORT.md`](../../../templates/UX_AUDIT_REPORT.md) to the project repository.

---

## The 8 Audit Stages

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ux-audit Operational Pipeline                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────┬───────────────┼───────────────┬───────────────┐
    ▼               ▼               ▼               ▼               ▼
┌─────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│ Stage 1 │   │  Stage 2  │   │  Stage 3  │   │  Stage 4  │   │  Stage 5  │
│Discovery│──►│UserJourney│──►│Heuristics │──►│Visual&A11y│──►│ Technical │
└─────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
                                                                    │
                    ┌───────────────────────────────────────────────┘
                    ▼
              ┌───────────┐   ┌───────────┐   ┌───────────┐
              │  Stage 6  │   │  Stage 7  │   │  Stage 8  │
              │ Challenge │──►│ ActionPlan│──►│Validation │
              └───────────┘   └───────────┘   └───────────┘
```

---

### Stage 1 — Product & Technical Discovery

Ground the audit in the actual product reality rather than assumptions:

1. **Product Purpose & Audience**:
   - Who are the target users? What are their primary jobs-to-be-done (JTBD)?
   - What is the critical path to value? What constitutes task success?
2. **Technical Surface & Entry Points**:
   - Inspect package manifests, frontend routes, router configurations, and main application entry points.
   - Identify component libraries (Radix, Shadcn, MUI, Tailwind, custom UI primitives).
   - Trace client state management (React Context, Zustand, Redux, Pinia, Vuex) and server synchronization (TanStack Query, SWR, Apollo).
   - Review relevant backend APIs and data models backing user workflows.
3. **Existing Standards & Tests**:
   - Inspect existing design tokens, CSS variables, and documentation (`docs/UI_STANDARDS.md`, `README.md`).
   - Identify existing UI unit tests, Playwright/Cypress end-to-end tests, or Storybook stories.

---

### Stage 2 — Real User Journey Walkthrough

Experience the interface as a user would, using browser testing tools (e.g. Chrome DevTools MCP, Playwright):

1. **Scenario Selection**:
   - Formulate a concrete, end-to-end user scenario matching the target focus (e.g. "Create and configure a new tracking project from scratch").
   - Use synthetic, reproducible test inputs.
2. **Step-by-Step Observation**:
   - **Step 1: First-time onboarding** — Welcome messaging, empty states, orientation cues.
   - **Step 2: Primary task initiation** — Discoverability of call-to-actions, cognitive load before starting.
   - **Step 3: Navigation and orientation** — Can the user identify where they are, how to go back, and what is next?
   - **Step 4: Task progression** — Feedback during multi-step forms, progressive disclosure of complex settings.
   - **Step 5: User input and validation** — Inline validation timing, field error clarity, debounce behavior.
   - **Step 6: Error and recovery flows** — Graceful handling of invalid inputs, network drops, or canceled actions.
   - **Step 7: Task completion** — Clear confirmation, celebration of progress, next actionable steps.
   - **Step 8: Returning to unfinished work** — Draft persistence, session restore, breadcrumb clarity.
   - **Step 9: Export, sharing, or handoff** — Ease of extracting artifacts, links, or reports.
3. **Evidence Capture**:
   - Capture DOM snapshots, visual screenshots (desktop and mobile viewports), console errors, network latency, and failed requests.

---

### Stage 3 — UX & Usability Heuristics

Audit the observed interface against established design principles, including Jakob Nielsen's 10 Usability Heuristics:

1. **Visibility of System Status**: Are loading states, progress bars, and operation outcomes immediately visible?
2. **Match Between System and Real World**: Does terminology reflect user mental models rather than database schema names?
3. **User Control and Freedom**: Are there clear "emergency exits" (undo, cancel, dismiss)?
4. **Consistency and Standards**: Do identical actions produce identical results across different views?
5. **Error Prevention**: Does the design eliminate error-prone conditions or confirm before destructive actions?
6. **Recognition Rather Than Recall**: Are options and instructions visible or easily retrievable?
7. **Flexibility and Efficiency of Use**: Are there keyboard shortcuts, accelerators, or bulk actions for power users?
8. **Aesthetic and Minimalist Design**: Does every piece of content serve a purpose, or does noise distract from value?
9. **Help Users Recognize, Diagnose, and Recover from Errors**: Are error messages written in plain language with constructive fixes?
10. **Help and Documentation**: Is inline guidance or contextual tooltip help available where complex inputs are required?

#### Evidence Classification Taxonomy

For every heuristic evaluation, classify the evidence strictly:
- **`Observed`**: Verified through live runtime interaction, console logs, or browser screenshots.
- **`Code-Supported`**: Verified by inspecting JSX/HTML/CSS implementation, route guards, or store state.
- **`Hypothesis`**: Inferred design tension that requires dedicated qualitative user testing to confirm.
- **`NOT TESTED`**: Capability, responsive viewport, or user flow was not verified at runtime (e.g. browser automation tool missing, live backend unavailable, or flow requires third-party OAuth). Never guess or fabricate runtime results.

#### Usability Scorecard (1 to 5 Scale)
Rate each evaluated usability dimension:
- **1 - Critical Failure**: User cannot complete the task; severe blocker.
- **2 - Poor / High Friction**: Task can be completed, but causes confusion, errors, or frustration.
- **3 - Acceptable / Functional**: Works as expected, but exhibits visual or interaction rough edges.
- **4 - Good**: Clean, intuitive, consistent, with minor polish opportunities.
- **5 - Exceptional**: Delightful, frictionless, accessible, and self-guiding.

---

### Stage 4 — Visual & Interaction Design Audit

Audit the visual and tactile layers of the product, separating static analysis, runtime interaction testing, and accessibility verification:

> **Important — Accessibility Conformance Notice**:
> Automated accessibility passes (via automated linters or headless checks) catch only ~30–40% of WCAG issues. Passing automated checks does NOT equate to full WCAG 2.2 AA conformance. Verify keyboard navigation, focus traps, aria labels, and screen-reader semantics explicitly. Mark unverified criteria as `NOT TESTED`.

1. **Visual Hierarchy & Grid**:
   - Consistent spatial rhythm (4px/8px scale).
   - Clear contrast between primary page headings, section headers, card titles, and body prose.
2. **Typography**:
   - Typographic scale, line-height readability (1.4–1.6 for body copy), letter-spacing on uppercase elements.
   - Tabular numbers (`font-variant-numeric: tabular-nums`) in tables, stats, and timer displays.
3. **Color & Contrast (WCAG 2.2 AA)**:
   - Text contrast ratio: minimum 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt bold).
   - UI component contrast: minimum 3:1 for borders, active form inputs, and graphical indicators.
   - Reliance on color: Never convey status solely through color; pair with icons, text, or patterns.
4. **Interactive Component States**:
   - Audit every interactive element across 7 mandatory states:
     `Default` · `Hover` · `Active / Pressed` · `Focus-Visible` · `Disabled` · `Loading` · `Error`
   - Focus rings: Distinct, high-contrast `:focus-visible` outlines without clipping overflow.
5. **Surfaces, Dialogs & Overlays**:
   - Z-index layering hierarchy (dropdowns, sticky headers, modals, tooltips, toasts).
   - Dialog mechanics: focus trap, `Escape` key dismissal, backdrop click behavior, scroll lock on body.
6. **Micro-Interactions & Motion**:
   - Transition duration (150ms–250ms for micro-interactions; 300ms–400ms for larger surfaces).
   - Motion curve feel: ease-out on enters, ease-in on exits.
   - Respect `prefers-reduced-motion` media queries: provide instant transitions for sensitive users.
7. **Responsive Adaptability**:
   - Viewport testing: Mobile (375px), Tablet (768px), Desktop (1280px+).
   - Touch targets: minimum 44×44px for touch interfaces. No hover-dependent critical actions on mobile.

---

### Stage 5 — UX-Related Technical Architecture

Inspect underlying code implementations **strictly where they directly create UX issues**:

1. **UI State Synchronization**:
   - Race conditions in asynchronous fetch calls resulting in stale data flashes.
   - Optimistic UI updates that fail to roll back gracefully on server errors.
2. **Navigation & Deep Linking**:
   - Does changing filters or tabs update URL search parameters so views can be shared and refreshed?
   - Does the browser "Back" button return to the previous logical state rather than exiting the application?
3. **Form State & Draft Persistence**:
   - Form loss: Unsubmitted input erased on accidental page reloads, tab navigation, or auth timeouts.
   - Validation timing: Immediate validation on untouched fields causing premature error panic.
4. **Error Propagation**:
   - Swallowed API exceptions rendering indefinite spinner hangs.
   - Generic "Network Error" alerts instead of contextual recovery suggestions.
5. **Perceived Performance & Layout Stability**:
   - Cumulative Layout Shift (CLS) from late-loading images or dynamic banners pushing buttons.
   - Content flashes (Flash of Unstyled Text / FOUT, empty tables before skeletons render).
6. **Source Citations**:
   - Ground every technical finding with exact `file:line` references (e.g. `Sidebar.tsx:42-58` citing `src/components/Sidebar.tsx#L42-L58`).
   - Clearly distinguish between confirmed defects and architectural hypotheses.

---

### Stage 6 — Challenge the Current Product Experience

Step back from micro-details to question whether the overarching interaction model serves user mental models:

1. **Interaction Archetype Analysis**:
   - Does the product use the optimal design pattern?
     - *Guided Wizard / Workflow*: Step-by-step linear handholding for complex or infrequent tasks.
     - *Workspace-First*: Flexible multi-panel canvas for creative, exploratory, or repetitive work.
     - *Dashboard-Centered*: High-level metrics with drill-down views for monitoring and operational triage.
     - *Conversational / AI-Assisted*: Intent-driven, natural language input paired with structured outputs.
     - *Hybrid*: Blended paradigms tailored to distinct user personas.
2. **Current-State vs. Proposed Experience Diagrams**:
   - Model the current user friction flow using Mermaid.
   - Model the proposed, streamlined journey showing removed friction points and guided progression.

---

### Stage 7 — Prioritized Improvement Backlog

Structure all audit findings into three actionable tiers:

#### A. Quick Wins (Low Effort, High Immediate Impact)
- Ambiguous or misleading button labels.
- Missing empty states or default placeholder text.
- Missing focus rings or low-contrast text.
- Form inputs lacking explicit input types (`type="email"`, `inputmode="numeric"`).

#### B. Workflow & Interaction Improvements (Medium Effort)
- Redesigning confusing onboarding tours into contextual inline guides.
- Streamlining multi-step checkout or creation forms with auto-save drafts.
- Replacing abrupt modals with non-blocking slide-out drawers or inline sheets.
- Adding undo toast notifications for destructive deletions.

#### C. Architectural Improvements (High Effort, Foundational Value)
- Migrating local component state to URL query sync for shareable views.
- Implementing optimistic mutations with automatic rollback for high-frequency actions.
- Redesigning backend API endpoints to eliminate N+1 roundtrips causing spinner cascades.

#### Action Item Schema
Every backlog item must specify:
```markdown
### [UX-01] Finding Title
- **Problem**: Concise description of user friction or failure.
- **Evidence**: `[Observed | Code-Supported | Hypothesis]` with screenshot or file:line citation.
- **Affected User Goal**: What user journey or JTBD is blocked or degraded.
- **Severity**: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW` | `NIT`
- **Recommended Improvement**: Concrete, actionable design/engineering solution.
- **Expected Benefit**: Measurable usability improvement.
- **Effort Estimate**: `S` (< half day) | `M` (1-2 days) | `L` (3+ days)
- **Technical Dependencies**: Required components, stores, or API updates.
- **Acceptance Criteria**: Verifiable conditions that confirm the issue is resolved.
- **Verification Approach**: How to test (browser test, keyboard walkthrough, automated assertion).
```

---

### Stage 8 — UX Validation Strategy

Define a measurable validation framework to prove that subsequent engineering changes actually improve the user experience:

1. **Task-Based Usability Scenarios**:
   - Formulate 2–3 standardized tasks given to test participants.
2. **Target Usability Metrics**:
   - **Time to First Useful Outcome (TTFUO)**: Seconds from first page visit to primary action completed.
   - **Task Completion Rate**: Percentage of users who finish the scenario without assistance.
   - **Navigation Detour Count**: Number of unintended clicks or back-button presses.
   - **Error Rate & Abandonment**: Percentage of users who abandon form inputs or encounter blocking errors.
   - **Subjective Confidence**: Post-task usability rating (e.g. Single Ease Question / SEQ 1–7).
3. **Empirical Verification Baseline**:
   - Explicitly separate metrics already measured during the audit from target benchmarks to be validated in future releases.

---

## Output Contract: The UX Audit Report

Upon completion of the audit, generate a complete report using the [`templates/UX_AUDIT_REPORT.md`](../../../templates/UX_AUDIT_REPORT.md) template.

Ensure every section is populated with concrete project facts. Avoid generic design platitudes or unsubstantiated claims. Provide clear, actionable guidance that product managers, designers, and frontend engineers can immediately execute.
