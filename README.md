# Engineering Workflow

![Engineering Workflow overview](docs/visuals/engineering-workflow-overview.svg)

An opt-in preset for **DeepSeek Harness** that keeps long coding sessions on track.

It keeps the normal coding tools, adds a focused engineering workflow, and uses
DSH's native compaction near 50% context pressure. An optional recovery reminder
helps the agent continue from the right unfinished step after compaction.

- Target DSH: **0.2.1-rc.3**
- Current version: **0.2.2**
- Distributed from GitHub, not npm
- Recovery is **off by default**
- MIT licensed

## What it does

- Keeps all **22 standard DSH tools**.
- Adds the **Engineering Workflow** preset.
- Enables native compaction near **50%** pressure.
- Includes two skills: `engineering-workflow` and `visual-communication`.
- Sends at most **one recovery reminder per successful compaction**, if enabled.
- Keeps delegated subagents isolated from root recovery reminders.

## Install

Back up your DSH profile first. See [docs/INSTALL.md](docs/INSTALL.md) for the
full reversible procedure.

```bash
git clone https://github.com/AhmedAbdelhady24/dsh-engineering-workflow.git

dsh plugin --profile <profile> add \
  "$PWD/dsh-engineering-workflow"

dsh --profile <profile> --dump-config \
  | grep -A3 -B2 'preset-engineering-workflow'
```

Then restart DSH, start a new session, and select **Engineering Workflow**.

## Skills

The two bundled skills are discovered automatically when the preset is active.
There is no download or first-run setup.

Optional skills such as Ponytail, Matt Pocock, Archify and `find-skills` are
**not included and never installed automatically**. The agent may recommend one
and ask for approval first.

## Recovery

Recovery ships disabled:

```yaml
- id: engineering-recovery
  config:
    enabled: false
```

Enable it only after you are comfortable with the preset. Do not use
`DSH_ENGINEERING_RECOVERY_TEST=1` in normal sessions; that is test-only.

## Limits

- Compaction happens at a step boundary, not mid-request.
- Manual `/compact` does not use the tool-result pruner; automatic pressure and
  overflow recovery do.
- Recovery reminders wait for the next safe step. If the session ends first,
  they wait for the next turn.
- Recovery applies only to the root agent.
- This preset is not a security boundary. Keep DSH sandbox, approval and Git
  rules in place.
- Re-run compatibility tests after upgrading DSH.

## Rollback

1. Stop DSH.
2. Restore your backed-up profile.
3. Restart DSH and select the original preset.

Old package snapshots are in [`baseline/`](baseline/):
v0.1.0, v0.2.0 and v0.2.1.

## Development

```bash
npm test
```

This runs the generator tests, recovery-controller tests and DSH compatibility
checks. Editable diagram sources are in [`docs/visuals/`](docs/visuals/).

## License

MIT. See [LICENSE](LICENSE).
