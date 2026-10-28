---
"engineering-workflow": minor
---

Migrate `skill-registry.json` schema to Draft 2020-12 (`registry.schema.json`) with structured installation, upstream source revisions, and evidence-based hosts metadata.

### Migration Guide
The machine-readable `skill-registry.json` catalog introduces a breaking schema evolution to prevent unverified claims and support multi-host installation routing:
- The flat `installCommand` string is replaced by an `installation` object defining `strategy` (`skills-cli` or `mcp-server`), a canonical `command`, and optional host-specific overrides (`hosts`).
- The unverified `supportedHosts` array is replaced by an evidence-based `hosts` object separating `compatible` platforms, `installable` hosts verified by installer tests, and `verifiedExecuted` hosts backed by automated execution proof.
- All entries now require explicit `source` metadata (`repository`, 40-character git `revision` or npm `package`/`version`, and `verifiedAt`).
Consumers reading `skill-registry.json` should update accessors from `skill.installCommand` to `skill.installation.command` (checking `skill.installation.hosts[host]` for overrides) and from `skill.supportedHosts` to `skill.hosts.compatible` or `skill.hosts.installable`.
