# Package & Upstream Dependency Update Policy

This document establishes the review cadence, pinning standards, and verification protocols for external MCP servers, tool packages, and specialist agent skills integrated into the Universal Engineering Workflow.

---

## 1. Pinning Standard

To ensure deterministic, reproducible agent execution across heterogeneous host environments, all external tool installations must be explicitly pinned:

1. **MCP Packages (npm)**:
   - Must use exact semantic versions (e.g., `@upstash/context7-mcp@4.4.4`, `chrome-devtools-mcp@1.12.0`).
   - Floating tags (`@latest`, `@next`) and unbounded ranges (`^`, `~`) are strictly prohibited in [`skill-registry.json`](../skill/engineering-workflow/skill-registry.json) and installation commands.
2. **Specialist Skills (Git Repositories)**:
   - Upstream git repositories must record a verified 40-character commit revision (`revision`) and verification timestamp (`verifiedAt`).
   - Installation commands must specify the verified repository path and skill identifier.

---

## 2. Review Cadence

External packages and upstream skills undergo scheduled and event-driven review:

| Review Type | Frequency | Scope | Action |
| :--- | :--- | :--- | :--- |
| **Scheduled Cadence** | Monthly (First week of each calendar month) | Audit upstream releases, changelogs, breaking API changes, and deprecation notices for all 21 registered capabilities. | Update source metadata and test pins in an isolated development branch. |
| **Security Out-of-Band** | Within 24 hours of notification | Common Vulnerabilities and Exposures (CVEs), supply-chain advisories, or critical integrity defects in upstream packages. | Expedited security patch: bump pinned version, run security verification, and release. |

---

## 3. Bump & Verification Protocol

Before updating any pinned package version or commit revision in `skill-registry.json`:

1. **Verify Integrity**:
   - For npm packages: Inspect package contents, verify signatures, and confirm clean audit (`npm audit`).
   - For git repositories: Verify commit signature and run `git ls-remote` to ensure the SHA exists on the upstream repository.
2. **Execute Full Test Suite**:
   - Run `npm test` across supported Node.js versions (Node 20 & Node 22).
   - Run `npm run validate` to confirm specification compliance.
   - Run `node scripts/validate-skill.mjs` and schema validation against `registry.schema.json`.
3. **Host Verification**:
   - Run available host execution checks (`npm run test:host-e2e`) to verify that the upgraded package or skill functions without regression.
4. **Document Update**:
   - Update `source.revision` or `source.version` and `source.verifiedAt` in `skill-registry.json`.
   - Update `docs/VERIFICATION_EVIDENCE.md` with the new commit and CI run link.
