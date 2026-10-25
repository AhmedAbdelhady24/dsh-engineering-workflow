# Review Operation Reference: Multi-Axis Independent Audit

The **`review`** operation conducts an objective, read-only audit of uncommitted changes, a pull request, or a specific branch. It inspects diffs against task requirements, security baselines, and engineering standards without altering any source code.

---

## Review Principles

1. **Strictly Read-Only**: The reviewer NEVER modifies files, stages commits, or applies patches directly.
2. **Evidence-Based Findings**: Every finding must cite the exact file path, line numbers, observed issue, and concrete recommended remedy.
3. **No False Confidence**: Never mark a check as passed if tests were not actually executed or evidence was not observed.
4. **Honest Isolation Reporting**: If executed in the same conversational context as the implementation (rather than a separate subagent), disclose: *"Sequential review pass (same context); independent isolation was unavailable."*

---

## Multi-Axis Review Checklist

### 1. Correctness & Behavioral Regression
- Does the implementation satisfy all stated acceptance criteria?
- Are edge cases handled (empty lists, null/undefined, extreme inputs, unexpected API responses)?
- Are there race conditions, async deadlocks, or unhandled promise rejections?
- Does error handling gracefully recover without leaking internal exceptions or crashing the process?

### 2. Security & Hardening
- **Secrets & Credentials**: Are API keys, tokens, or credentials hardcoded or committed into fixtures?
- **Injection & Sanitization**: Are user inputs parameterized in SQL, shell executions, and HTML rendering?
- **Authentication & Authorization**: Are access controls enforced at route/action boundaries?
- **Dependencies**: Are any newly added dependencies unverified, pinned insecurely, or subject to supply-chain confusion?

### 3. Performance & Resource Hygiene
- Are there N+1 database queries or unindexed lookups?
- Are background timers, event listeners, or WebSocket subscriptions properly cleaned up to prevent memory leaks?
- Are large arrays or payloads processed without unnecessary intermediate allocations or deep copies?

### 4. Accessibility & UI Quality (When UI is Present)
- Are interactive elements accessible via keyboard (`tabIndex`, enter/space keys)?
- Do form controls possess linked `<label>` elements and accessible names?
- Is color contrast compliant with WCAG AA standards?
- Are layout shifts (CLS) prevented during image/font loading?

### 5. Maintainability & Test Coverage
- Are tests asserting meaningful behaviors rather than implementation trivialities?
- Are existing docstrings and comments preserved?
- Are type annotations comprehensive without unnecessary `any` or `as unknown` casts?
- Is dead or unreachable code left behind?

---

## Severity Taxonomy

| Severity | Definition | Action Required |
| :--- | :--- | :--- |
| **`BLOCKER`** | Data loss, security vulnerability, test breakage, or severe regression. | Must be fixed before any merge or deployment. |
| **`HIGH`** | Violates key acceptance criteria, missing core error handling, or high crash risk. | Fix required during current task cycle. |
| **`MEDIUM`** | Unhandled edge case, performance inefficiency, or partial a11y defect. | Recommended fix before completion. |
| **`LOW`** | Code style inconsistency, minor type looseness, or suboptimal naming. | Can be addressed optionally. |
| **`NIT`** | Minor cosmetic improvement, typo in comment, or optional suggestion. | Informational only. |

---

## Structured Review Report Format

When completing the review, present findings using this markdown structure:

```markdown
# Engineering Review Report

## Summary
- **Target Branch / Diff**: [Branch or commit range]
- **Review Mode**: [Isolated Subagent | Sequential Pass]
- **Overall Verdict**: [APPROVED | CHANGES REQUESTED | BLOCKED]

## Findings Matrix

### [SEVERITY] Finding Title
- **File**: `path/to/file.ext` (Line XX-YY)
- **Observed Issue**: Exact description of the defect or vulnerability.
- **Impact**: Potential consequences if unaddressed.
- **Recommended Remedy**:
  ```language
  // Concrete code example showing recommended fix
  ```

## Verification Checks
- [x] Unit test suite: [Pass / Fail / Unrun]
- [x] Typecheck & Linter: [Pass / Fail / Unrun]
- [x] Security review: [Verified clean / Vulnerabilities identified]
- [x] Accessibility review: [Compliant / N/A]
```
