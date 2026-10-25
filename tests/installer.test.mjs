import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const installScript = path.join(rootDir, "scripts", "install.sh");
const uninstallScript = path.join(rootDir, "scripts", "uninstall.sh");

test("Installer: dry-run prints destinations without modifying filesystem", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-dryrun-"));
  try {
    const output = execSync(`bash "${installScript}" --path "${tempProject}" --target all --dry-run`, {
      encoding: "utf-8",
    });
    assert(output.includes("[Dry Run] Would copy"), "Dry run must announce intended copies");
    assert(!fs.existsSync(path.join(tempProject, ".agents")), "Dry run must not create directories");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: installs and verifies project-local scope across agent targets", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-proj-"));
  try {
    const output = execSync(`bash "${installScript}" --path "${tempProject}" --target all --scope project`, {
      encoding: "utf-8",
    });
    assert(output.includes("Installation complete and verified!"), "Installer must report verified completion");

    const expectedSkillDirs = [
      path.join(tempProject, ".agents", "skills", "engineering-workflow"),
      path.join(tempProject, ".dsh", "skills", "engineering-workflow"),
      path.join(tempProject, ".claude", "skills", "engineering-workflow"),
    ];

    for (const dir of expectedSkillDirs) {
      assert(fs.existsSync(dir), `Installed directory must exist: ${dir}`);
      assert(fs.existsSync(path.join(dir, "SKILL.md")), `SKILL.md must exist in: ${dir}`);
      assert(fs.existsSync(path.join(dir, "references", "setup.md")), `references/setup.md must exist in: ${dir}`);
      assert(fs.existsSync(path.join(dir, "references", "execute.md")), `references/execute.md must exist in: ${dir}`);
      assert(fs.existsSync(path.join(dir, "references", "review.md")), `references/review.md must exist in: ${dir}`);
    }

    // Test uninstaller
    const uninstallOutput = execSync(`bash "${uninstallScript}" --path "${tempProject}" --target all --scope project`, {
      encoding: "utf-8",
    });
    assert(uninstallOutput.includes("Rollback complete!"), "Uninstaller must report rollback completion");

    for (const dir of expectedSkillDirs) {
      assert(!fs.existsSync(dir), `Directory should be removed after rollback: ${dir}`);
    }
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: installs and verifies global scope with distinct agent directories", () => {
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "uew-home-"));
  try {
    const env = { ...process.env, HOME: fakeHome };

    const output = execSync(`bash "${installScript}" --target all --scope global`, {
      encoding: "utf-8",
      env,
    });
    assert(output.includes("Installation complete and verified!"), "Global install must succeed");

    const expectedGlobalDirs = [
      path.join(fakeHome, ".gemini", "config", "skills", "engineering-workflow"),
      path.join(fakeHome, ".gemini", "antigravity-cli", "skills", "engineering-workflow"),
      path.join(fakeHome, ".dsh", "skills", "engineering-workflow"),
      path.join(fakeHome, ".agents", "skills", "engineering-workflow"),
      path.join(fakeHome, ".claude", "skills", "engineering-workflow"),
    ];

    for (const dir of expectedGlobalDirs) {
      assert(fs.existsSync(dir), `Expected global directory must exist: ${dir}`);
      assert(fs.existsSync(path.join(dir, "SKILL.md")), `SKILL.md must exist in: ${dir}`);
    }

    // Test global rollback
    const uninstallOutput = execSync(`bash "${uninstallScript}" --target all --scope global`, {
      encoding: "utf-8",
      env,
    });
    assert(uninstallOutput.includes("Rollback complete!"), "Global rollback must succeed");

    for (const dir of expectedGlobalDirs) {
      assert(!fs.existsSync(dir), `Global directory should be removed after rollback: ${dir}`);
    }
  } finally {
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});
