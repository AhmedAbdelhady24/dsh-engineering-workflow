# ADR 0003: Comprehensive UX & Usability Audit Framework

## Status
Accepted

## Context
Standard agent workflows focus almost exclusively on code-level correctness: passing unit tests, type checking, and linting. However, a codebase can pass all CI checks while delivering a broken, inaccessible, or confusing user experience (clipped layouts on mobile, trapped focus in modal dialogs, missing empty states, or high cognitive load).

Code-review alone is insufficient because it inspects code syntax and implementation semantics rather than product behavior from a user's perspective.

## Decision
We introduce `ux-audit` as a first-class operation alongside `setup`, `execute`, and `review`:

1. **User Perspective**: Evaluates usability, visual hierarchy, interaction design, accessibility, and UX-affecting architecture.
2. **Live Runtime Walkthrough**: Requires live browser automation (Playwright or Chrome DevTools MCP) to walk genuine user journeys with synthetic test data.
3. **Structured Heuristic Evaluation**: Assesses products against established usability principles, including Nielsen's 10 usability heuristics, scored 1–5 with verified evidence.
4. **WCAG 2.2 AA Compliance**: Evaluates color contrast, responsive breakpoints, focus management, keyboard navigation, and screen reader announcements.
5. **Read-Only Non-Destructive**: The operation produces actionable reports and proposed fixes without mutating production code or user data directly.

## Consequences
- Bridges the gap between technical correctness and real-world product quality.
- Surfaces interaction defects before deployment.
- Provides verifiable before-and-after usability benchmarks.
