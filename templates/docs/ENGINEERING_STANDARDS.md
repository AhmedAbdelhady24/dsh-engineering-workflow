# Engineering Standards: {{PROJECT_NAME}}

This document defines the technical quality gates, testing practices, error modeling, and development standards for {{PROJECT_NAME}}.

---

## 1. Architectural Philosophy

1. **Deep Modules**: Prefer modules with simple, compact interfaces that encapsulate substantial internal complexity. Avoid shallow wrapper classes that merely pass data without value.
2. **Explicit Over Implicit**: Make state transformations, dependencies, and side effects explicit. Avoid magical reflection or hidden global state.
3. **Fail Fast & Explicitly**: Validate inputs at boundary layers (HTTP handlers, CLI entry points, queue consumers) using schemas (Zod, Pydantic, etc.). Do not propagate corrupted state.

---

## 2. Type Safety & Code Quality

- **Strict Mode**: Maintain maximum compiler strictness (`strict: true` in TypeScript, `--strict` in Python mypy).
- **No Unchecked Types**: Avoid `any`, `unknown` without type guards, or unchecked type casts (`as any`).
- **Immutability by Default**: Prefer `const`, `readonly`, and immutable collections where supported to prevent unexpected mutations.
- **Documentation Preservation**: Keep existing docstrings and explanatory comments intact when editing code.

---

## 3. Testing Standards

All features and bug fixes must be accompanied by automated tests:

### 3.1 Test-Driven Development (TDD)
1. **Red**: Write a failing test specifying the desired behavioral outcome.
2. **Green**: Write the minimal implementation code to pass the test.
3. **Refactor**: Clean up the code while keeping all tests passing.

### 3.2 Test Hierarchy
- **Unit Tests**: Test pure business logic, calculations, and domain entities in complete isolation. Must run in milliseconds.
- **Integration Tests**: Test interactions between components, database queries, and API route handlers using disposable test databases or containers.
- **E2E / Browser Tests**: Test critical user journeys end-to-end. Keep focused and resilient to minor DOM changes.

---

## 4. Error Handling & Observability

- **Typed Errors**: Define domain-specific error classes or error unions. Avoid generic string errors.
- **No Silent Swallowing**: Never catch an error with an empty handler (`catch (e) {}`). Log the error with contextual metadata or rethrow.
- **Structured Logging**: Emit logs in JSON or structured key-value formats containing request IDs, user context, and operational timestamps.

---

## 5. Git & Collaboration Hygiene

- **Conventional Commits**: Format commit messages as `<type>(<scope>): <short description>`.
  - `feat`: New user-facing or public capability
  - `fix`: Bug resolution
  - `refactor`: Code reorganization without behavioral change
  - `test`: Adding or updating test suites
  - `docs`: Documentation updates
- **Atomic Commits**: Each commit represents one logical, self-contained change with passing tests.
- **Non-Destructive Operations**: Never force-push (`git push --force`) to shared branches or reset history without team consensus.
