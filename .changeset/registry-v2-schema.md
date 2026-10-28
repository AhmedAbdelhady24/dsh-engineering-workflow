---
"engineering-workflow": minor
---

Migrate `skill-registry.json` schema to Draft 2020-12 (`registry.schema.json`) with structured installation, upstream source revisions, and evidence-based hosts metadata.

### Justification for Minor Bump
Although removing `installCommand` and `supportedHosts` from `skill-registry.json` alters its machine-readable shape, a `minor` bump is maintained rather than `major` because `skill-registry.json` is an internal routing catalog referenced solely within this skill package (`references/skill-routing.md`). The public runtime interface of `engineering-workflow`—its `SKILL.md` specification, CLI arguments, and operational contracts (`setup`, `execute`, `review`, `ux-audit`)—remains strictly backward-compatible. If external tooling begins consuming the registry directly, subsequent shape evolutions will follow standard SemVer breaking release cycles.

### Migration Guide
The machine-readable `skill-registry.json` catalog introduces a breaking schema evolution to prevent unverified claims and support multi-host installation routing:
- The flat `installCommand` string is replaced by an `installation` object defining `strategy` (`skills-cli` or `mcp-server`), a canonical `command`, and optional host-specific overrides (`hosts`).
- The unverified `supportedHosts` array is replaced by an evidence-based `hosts` object separating `compatible` platforms, `installable` hosts verified by installer tests, an explicit `evidence` marker (`none`, `installer-test`, or `host-e2e`), and `verifiedExecuted` hosts backed by automated execution proof.
- All host arrays (`compatible`, `installable`, `verifiedExecuted`) strictly restrict values to host identifiers (`claude`, `codex`, `antigravity`, `dsh`). When installer test coverage does not yet exist for a capability (such as MCP tools), `installable` remains empty (`[]`) with `evidence: "none"` rather than mixing status markers into host lists.
- All entries now require explicit `source` metadata (`repository`, 40-character git `revision` or npm `package`/`version`, and `verifiedAt`).
Consumers reading `skill-registry.json` should update accessors from `skill.installCommand` to `skill.installation.command` (checking `skill.installation.hosts[host]` for overrides) and from `skill.supportedHosts` to `skill.hosts.compatible` or `skill.hosts.installable`.
