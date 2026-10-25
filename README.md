# DSH Engineering Workflow

A reusable, opt-in **DSH agent preset bundle**, targeting a verified DSH 0.2.1-rc.3-style installation. It is not installed globally by this package. **The release-specific `cordis.patch.yml` must be generated from the current installed `standard.patch.yml`**; shipping a guessed static plugin list risks dropping tools. The bundle keeps the default coding tools and changes only preset identity, compaction threshold, skills root and persona.

## Install from GitHub

This is a GitHub-distributed bundle, not an npm-published package. Clone it and
add it to the DSH profile you want to use:

```bash
git clone https://github.com/AhmedAbdelhady24/dsh-engineering-workflow.git
dsh plugin --profile <profile> add \
  "$PWD/dsh-engineering-workflow"

dsh --profile <profile> --dump-config \
  | grep -A3 -B2 'preset-engineering-workflow'
```

Select **Engineering Workflow** in the new-session preset picker only after the
preset appears in the roster. Recovery ships disabled. See
[docs/INSTALL.md](docs/INSTALL.md) for the backed-up, reversible installation
procedure.

### Skills: what is included

The bundle contains two original skills:

- `engineering-workflow`
- `visual-communication`

When the Engineering Workflow preset is active, DSH's `skill-filesystem`
discovers these from the installed package's `skills/` directory. They do not
require a network download, a separate installer, or a first-run setup step.

Optional skills such as Ponytail, Matt Pocock, Archify and `find-skills` are
**not bundled and not installed automatically**. Install those separately only
when you want them.

## v0.2.2 recovery plugin

`recovery/index.js` observes successful `compaction/end` session events and adds one advisory recovery message at the next `agent/pre-step`. It is **disabled by default** in `cordis.patch.yml`.

v0.2.2 adds:

- root-only delivery using the live DSH Agent registry (`ctx.agents.roots()`);
- subagent exclusion;
- restart reconstruction from the native session log;
- durable acknowledgement via the recovery `user/message` source;
- partial/interrupted compaction handling that ignores a successful start/summary without a successful end.

The integration harness can opt in with `DSH_ENGINEERING_RECOVERY_TEST=1`; never use that override in the active Desktop profile.

The immutable v0.1.0, v0.2.0 and v0.2.1 package snapshots and hashes are under `baseline/` for rollback.

## Regression tests

The generator has tests for the two configurations the shipped standard preset uses
without a `config:` block:

```bash
npm test
```

This runs the Python generator tests, the Node recovery-controller tests, and
`tools/check-compat.py` (22 standard rows, 50% compaction, bundle skill root,
disabled recovery row, v0.2 package version).

Tests use only the Python standard library and copy the generator into a temporary
package so the final `cordis.patch.yml` is not overwritten.

## Build

1. Locate the installed **standard** preset patch using `Config.listConfigs` (`preset-standard` packageDir), DSH package source, or a matching checked-out version. On Desktop it may be inside `app.asar`; use DSH's native inspection rather than inventing a filesystem path.
2. Save/copy `standard.patch.yml` outside your project into an empty working directory.
3. Run `python3 tools/build-patch.py /absolute/path/to/standard.patch.yml`.
4. Inspect generated `cordis.patch.yml` in full; validate correct `engineering-workflow` preset declaration, all original coding tool rows, exactly one compaction group, native overflow recovery, `thresholdRatio: 0.5`, and accessible bundled skills root.
5. Ask DSH to install this **local bundle** with `plugin_manager` action `install_bundle` and this bundle's absolute path. Installation modifies the DSH profile; use explicit approval. Restart/select Engineering Workflow in a **test profile/session** first.

**Do not** simply set `selectedDefault: engineering-workflow` before confirming the preset appears in the roster. Existing `scopewell-50` is a legacy nonregistered preset: correct the invalid selected default only after successful new preset installation. Never delete legacy assets before verified rollback.

## Smoke tests

- Preset appears in roster and is selectable in a fresh session.
- Existing bash/filesystem/search/subagent/approval tools remain available.
- Both `engineering-workflow` and `visual-communication` skills load and can be invoked.
- Project `AGENTS.md` and `.dsh/skills/` still work, with project-specific instructions honored.
- Context compacts near 50% at the configured engine's step boundary; verify with a long noncritical task and engine logs, **not just YAML inspection**.
- `/compact` and overflow recovery remain available.
- Fresh session has no duplicate compaction service or skill-provider failures.
- Test a disposable worktree with passing verification and handoff.

## Boundaries

- **50% is a step-boundary compaction threshold**, not guaranteed immediate mid-request or strictly after task idle.
- A Markdown skill cannot run an automatic post-compaction hook. Native compaction summary + recovery instructions provide **next-step recovery**, not guaranteed event-driven callback. A future Cordis plugin subscribing to `compaction/end` is needed for mandatory on-event processing; inspect and test actual event API before implementing.
- The `find-skills`, Ponytail and Matt Pocock skills are **optional external dependencies**, not redistributed. They are used only when installed and approved.
- Existing five project skills remain project-local; not bundled, owing to pending ownership/provenance review. This bundle contains original `engineering-workflow` and `visual-communication` skills only.
- Not a security boundary: leave workspace sandbox, approvals, source-control safety and project gates enforced by DSH and repo policies.

## Rollback

Switch default preset back to `standard` in DSH settings. Uninstall this local bundle through the DSH plugin manager **only after confirming no active session relies on it**. Restore profile patch from a backup if installer mutation fails. Preserve project files, Git index and running sessions.

## License

MIT. See [LICENSE](LICENSE).
