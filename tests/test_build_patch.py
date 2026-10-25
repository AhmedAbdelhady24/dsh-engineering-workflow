#!/usr/bin/env python3
"""Regression tests for the version-adaptive preset generator.

The shipped DSH 0.2.1-rc.3 standard preset has no `config:` block on either
`compaction-basic` or `skill-filesystem`. The generator must add those blocks
instead of aborting, while preserving every standard plugin row.
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def fixture(compaction_config: bool, skill_config: bool) -> str:
    """Build a minimal standard-like patch with optional config blocks."""
    compaction_config_block = ""
    if compaction_config:
        compaction_config_block = textwrap.dedent(
            """\
            config:
              thresholdRatio: 0.8
            """
        )

    skill_config_block = ""
    if skill_config:
        skill_config_block = textwrap.dedent(
            """\
            config:
              customSkillDirs:
                - /existing/project-skills
            """
        )

    compaction_lines = "".join(
        f"                {line}\n" if line else "\n"
        for line in compaction_config_block.rstrip("\n").splitlines()
    )
    skill_lines = "".join(
        f"              {line}\n" if line else "\n"
        for line in skill_config_block.rstrip("\n").splitlines()
    )

    return textwrap.dedent(
        f"""\
        - insert:
            - id: preset-standard
              name: '@deepseek-ai/dsh-agent-preset'
              config:
                id: standard
                order: 1
                plugins:
                  - id: persona
                    name: '@deepseek-ai/dsh-persona'
                    config:
                      prefix: You are a coding agent powered by the {{{{model}}}} model.
                  - id: agent-instructions
                    name: '@deepseek-ai/dsh-agent-instructions'
                    config:
                      maxBytes: 65536
                  - id: compaction
                    name: cordis:group
                    group: true
                    config:
                      - id: compaction-basic
                        name: '@deepseek-ai/dsh-compaction-basic'
        {compaction_lines}              - id: command-compact
                        name: '@deepseek-ai/dsh-command-compact'
                  - id: skill-filesystem
                    name: '@deepseek-ai/dsh-skill-filesystem'
        {skill_lines}              - id: tool-bash
                    name: '@deepseek-ai/dsh-tool-bash'
        """
    )


class BuildPatchTests(unittest.TestCase):
    def _run(self, source_text: str) -> str:
        with tempfile.TemporaryDirectory() as tmp:
            package = Path(tmp) / "package"
            shutil.copytree(
                ROOT,
                package,
                ignore=shutil.ignore_patterns("tests", "__pycache__", "*.pyc"),
            )
            source = Path(tmp) / "standard.patch.yml"
            source.write_text(source_text, encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(package / "tools/build-patch.py"), str(source)],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(
                result.returncode,
                0,
                msg=f"generator failed:\nstdout={result.stdout}\nstderr={result.stderr}",
            )
            output = package / "cordis.patch.yml"
            self.assertTrue(output.is_file(), "generator did not write cordis.patch.yml")
            return output.read_text(encoding="utf-8")

    def test_missing_compaction_config_is_generated(self) -> None:
        output = self._run(fixture(compaction_config=False, skill_config=True))
        self.assertIn("thresholdRatio: 0.5", output)
        self.assertIn("maxOverflowRetries: 1", output)
        self.assertIn("auto: true", output)
        self.assertIn("customSkillDirs:", output)

    def test_missing_skill_config_is_generated(self) -> None:
        output = self._run(fixture(compaction_config=True, skill_config=False))
        self.assertIn("thresholdRatio: 0.5", output)
        self.assertIn("customSkillDirs:", output)
        self.assertIn("createRequire(baseUrl).resolve('@local/dsh-engineering-workflow/package.json')", output)

    def test_both_missing_configs_are_generated(self) -> None:
        output = self._run(fixture(compaction_config=False, skill_config=False))
        self.assertIn("preset-engineering-workflow", output)
        self.assertIn("id: engineering-workflow", output)
        self.assertIn("thresholdRatio: 0.5", output)
        self.assertIn("customSkillDirs:", output)
        self.assertIn("tool-bash", output)
        self.assertIn("engineering-recovery", output)
        self.assertIn("enabled: false", output)
        self.assertNotIn("No config block", output)
        self.assertNotIn("No skill-filesystem config", output)

    def test_final_patch_preserves_standard_plugin_ids(self) -> None:
        final = (ROOT / "cordis.patch.yml").read_text(encoding="utf-8")
        expected = [
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
        for plugin_id in expected:
            self.assertRegex(
                final,
                rf"(?m)^\s*- id: {re.escape(plugin_id)}\s*$",
                msg=f"missing standard plugin row: {plugin_id}",
            )
        self.assertRegex(final, r"(?m)^\s*- id: engineering-recovery\s*$")
        self.assertEqual(final.count("- id: preset-engineering-workflow"), 1)
        self.assertIn("thresholdRatio: 0.5", final)
        self.assertIn("customSkillDirs:", final)


if __name__ == "__main__":
    unittest.main()
