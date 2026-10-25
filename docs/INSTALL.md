# Controlled installation test

Target: DSH 0.2.1-rc.3. This procedure is opt-in and must not change the
Desktop profile or its active sessions.

## Preflight

- Back up `~/.dsh/profiles/desktop/cordis.patch.yml`.
- Back up `~/.dsh/.agent-presets/scopewell-50/` if it exists.
- Do not remove the legacy preset yet.
- Do not change the Desktop profile's `selectedDefault`.

## Build

```bash
cd "$HOME/Downloads/dsh-engineering-workflow"
python3 -m unittest discover -s tests -v
python3 tools/build-patch.py /absolute/path/to/standard.patch.yml
```

`standard.patch.yml` must come from the installed DSH 0.2.1-rc.3 web-app
bundle (`@deepseek-ai/dsh-web-app/presets/standard.patch.yml`). On Desktop it is
inside `app.asar`; use DSH's own inspection/read path rather than a shell copy.

The generator must retain all 22 standard plugin rows. The regression tests
cover the missing `config` blocks currently present in the standard preset.

## Create an isolated profile

Use a separate profile; never install into `desktop` for this test.

```bash
dsh --profile engineering-workflow-test \
  --from-default-profile web \
  --dump-config
```

This creates/replaces the custom test profile from the shipped `web` template.
It does not touch the Desktop profile or active sessions.

## Install into the isolated profile

```bash
dsh plugin --profile engineering-workflow-test \
  add "$HOME/Downloads/dsh-engineering-workflow"
```

This is the installation step. It modifies only the isolated profile and
requires explicit approval and Full access.

## Select the preset for the test profile only

Edit the test profile's patch:

```yaml
- id: agent-preset-registry
  name: "@deepseek-ai/dsh-agent-preset-registry"
  config:
    default: standard
    selectedDefault: engineering-workflow
```

Do not edit the Desktop profile's default.

## Test-only recovery opt-in

The v0.2 recovery row ships with `enabled: false`. For the isolated acceptance
test only, start the test profile with:

```bash
DSH_ENGINEERING_RECOVERY_TEST=1 dsh --profile engineering-workflow-test --no-open --port 0
```

Do not use this environment override in the Desktop profile.

## Verify

```bash
dsh --profile engineering-workflow-test --dump-config
```

Then start a fresh test session in the isolated profile and verify:

- `preset-engineering-workflow` is present and healthy.
- `engineering-workflow` and `visual-communication` resolve.
- Standard shell/filesystem/search/subagent/approval tools are present.
- Project `AGENTS.md` and `.dsh/skills/` are loaded.
- A long noncritical task produces a compaction/summary event near the configured threshold.
- `/compact` works.
- Context-overflow recovery remains registered.
- No duplicate compaction service or skill-provider errors.

## Rollback

1. Select `standard` for the test profile.
2. Remove the test profile if no session needs it.
3. Restore any backed-up profile patch.
4. Do not delete the legacy Desktop preset until the migration and rollback have both been verified.
