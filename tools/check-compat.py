#!/usr/bin/env python3
"""Cheap, dependency-free compatibility checks for the generated v0.2 bundle."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_STANDARD = [
    "persona",
    "agent-instructions",
    "time-context",
    "tool-bash",
    "tool-pwsh",
    "tool-fs",
    "tool-fs-search",
    "tool-jobs",
    "tool-schedule",
    "skill-filesystem",
    "tool-skill",
    "command-goal",
    "tool-goal",
    "planning",
    "compaction",
    "delegation",
    "tool-ask-user",
    "tool-todo",
    "tool-web",
    "present",
    "tool-plugin-manager",
    "tool-plugin-market",
]


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    patch = (ROOT / "cordis.patch.yml").read_text(encoding="utf-8")
    package = (ROOT / "package.json").read_text(encoding="utf-8")
    if '"version": "0.2.2"' not in package:
        fail("package version is not 0.2.2")
    if "@local/dsh-engineering-workflow/recovery" not in patch:
        fail("recovery plugin subpath missing")
    if not re.search(r"(?m)^\s*- id: engineering-recovery\s*$", patch):
        fail("engineering-recovery row missing")
    if not re.search(r"(?m)^\s*enabled: false\s*$", patch):
        fail("recovery row is not disabled by default")
    if patch.count("- id: preset-engineering-workflow") != 1:
        fail("expected exactly one engineering-workflow preset declaration")
    if "thresholdRatio: 0.5" not in patch:
        fail("50% compaction policy missing")
    if "customSkillDirs:" not in patch:
        fail("bundled skill root missing")
    for plugin_id in EXPECTED_STANDARD:
        if not re.search(rf"(?m)^\s*- id: {re.escape(plugin_id)}\s*$", patch):
            fail(f"standard plugin row missing: {plugin_id}")
    print("OK: DSH 0.2.1-rc.3-compatible preset shape, 22 standard rows, 50% compaction, recovery disabled")


if __name__ == "__main__":
    main()
