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

test("Installer: rejects invalid target and scope with informative error and exit code 1", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-invalid-"));
  try {
    // Invalid target
    assert.throws(
      () => execSync(`bash "${installScript}" --path "${tempProject}" --target non-existent-target`, { stdio: "pipe" }),
      (err) => err.status === 1 && err.stderr.toString().includes("Invalid target 'non-existent-target'"),
      "Must reject invalid target with exit code 1"
    );

    // Invalid scope
    assert.throws(
      () => execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope invalid-scope`, { stdio: "pipe" }),
      (err) => err.status === 1 && err.stderr.toString().includes("Invalid scope 'invalid-scope'"),
      "Must reject invalid scope with exit code 1"
    );

    // Uninstaller invalid target
    assert.throws(
      () => execSync(`bash "${uninstallScript}" --path "${tempProject}" --target non-existent-target`, { stdio: "pipe" }),
      (err) => err.status === 1 && err.stderr.toString().includes("Invalid target 'non-existent-target'"),
      "Uninstaller must reject invalid target"
    );
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: repeated installation is safe, idempotent, and updates existing files cleanly", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-idempotent-"));
  try {
    // First installation
    const run1 = execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });
    assert(run1.includes("Installation complete and verified!"), "First install must succeed");

    const installedFile = path.join(tempProject, ".agents/skills/engineering-workflow/SKILL.md");
    assert(fs.existsSync(installedFile), "Installed skill must exist");

    // Second installation (repeat)
    const run2 = execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });
    assert(run2.includes("Installation complete and verified!"), "Repeat install must succeed idempotently");
    assert(fs.existsSync(installedFile), "Skill must remain intact after repeat install");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: uninstaller verifies skill ownership and protects unowned directories", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-ownership-"));
  try {
    // Create an unowned directory with a custom SKILL.md
    const targetDir = path.join(tempProject, ".agents/skills/engineering-workflow");
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, "SKILL.md"),
      "---\nname: other-unrelated-skill\ndescription: Custom user skill\n---\n# Other Skill"
    );

    // Run uninstaller
    const uninstallOutput = execSync(`bash "${uninstallScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    assert(
      uninstallOutput.includes("Skipping") && uninstallOutput.includes("unowned directory"),
      "Uninstaller must detect unowned directory and skip deletion"
    );
    assert(fs.existsSync(path.join(targetDir, "SKILL.md")), "Unowned skill directory must not be deleted");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: safely handles and removes symlinks without traversing targets", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-symlink-"));
  const realStorage = fs.mkdtempSync(path.join(os.tmpdir(), "uew-realstorage-"));
  try {
    const symlinkDest = path.join(tempProject, ".claude/skills/engineering-workflow");
    fs.mkdirSync(path.dirname(symlinkDest), { recursive: true });
    fs.symlinkSync(realStorage, symlinkDest);

    assert(fs.lstatSync(symlinkDest).isSymbolicLink(), "Destination must be a symbolic link");

    // Run uninstaller
    const output = execSync(`bash "${uninstallScript}" --path "${tempProject}" --target claude --scope project`, {
      encoding: "utf-8",
    });

    assert(output.includes("Found symlink"), "Uninstaller must detect symlink");
    assert(!fs.existsSync(symlinkDest), "Symlink itself must be removed");
    assert(fs.existsSync(realStorage), "Target directory referenced by symlink must NOT be deleted");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
    fs.rmSync(realStorage, { recursive: true, force: true });
  }
});

test("Installer: --skills-cli flag support and dry-run execution", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-cli-"));
  try {
    const output = execSync(`bash "${installScript}" --path "${tempProject}" --target codex --skills-cli --dry-run`, {
      encoding: "utf-8",
    });
    assert(
      output.includes("Skills CLI") || output.includes("skills add"),
      "Installer must support --skills-cli flag"
    );
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: refuses to replace unowned directory without --force", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-unowned-neg-"));
  try {
    const unownedDir = path.join(tempProject, ".agents/skills/engineering-workflow");
    fs.mkdirSync(unownedDir, { recursive: true });
    fs.writeFileSync(path.join(unownedDir, "user-secret.txt"), "valuable user data");

    // Attempt installation without --force
    assert.throws(
      () =>
        execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
          stdio: "pipe",
        }),
      (err) => {
        const stderr = err.stderr.toString();
        return (
          err.status === 1 &&
          stderr.includes("unowned directory") &&
          stderr.includes("Refusing to overwrite without --force")
        );
      },
      "Installer must refuse to replace unowned directory without --force"
    );

    // Verify existing user file remains intact
    assert(fs.existsSync(path.join(unownedDir, "user-secret.txt")), "User file must remain intact");
    assert.equal(
      fs.readFileSync(path.join(unownedDir, "user-secret.txt"), "utf-8"),
      "valuable user data",
      "User file contents must not be altered"
    );

    // Now test with --force
    const forceOutput = execSync(
      `bash "${installScript}" --path "${tempProject}" --target codex --scope project --force`,
      { encoding: "utf-8" }
    );
    assert(forceOutput.includes("Installation complete and verified!"), "Install with --force must succeed");
    assert(fs.existsSync(path.join(unownedDir, "SKILL.md")), "SKILL.md must be installed after --force");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: refuses to replace user-modified skill directory without --force", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-modified-neg-"));
  try {
    // Initial install
    execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    const skillDir = path.join(tempProject, ".agents/skills/engineering-workflow");
    const userNotePath = path.join(skillDir, "CUSTOM_USER_NOTE.md");
    fs.writeFileSync(userNotePath, "# Important user customizations");

    // Attempt repeat install without --force
    assert.throws(
      () =>
        execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
          stdio: "pipe",
        }),
      (err) => {
        const stderr = err.stderr.toString();
        return (
          err.status === 1 &&
          stderr.includes("user-modified content") &&
          stderr.includes("Refusing to overwrite without --force")
        );
      },
      "Installer must refuse to overwrite modified content without --force"
    );

    assert(fs.existsSync(userNotePath), "User note must remain untouched");

    // Repeat install with --force must succeed
    const forceRun = execSync(
      `bash "${installScript}" --path "${tempProject}" --target codex --scope project --force`,
      { encoding: "utf-8" }
    );
    assert(forceRun.includes("Installation complete and verified!"), "Force install must succeed");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: uninstaller refuses to delete directory without SKILL.md", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-unowned-uninstall-"));
  try {
    const unownedDir = path.join(tempProject, ".agents/skills/engineering-workflow");
    fs.mkdirSync(unownedDir, { recursive: true });
    fs.writeFileSync(path.join(unownedDir, "unowned_data.json"), '{"important": true}');

    const uninstallOutput = execSync(`bash "${uninstallScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    assert(
      uninstallOutput.includes("Skipping") && uninstallOutput.includes("unowned directory"),
      "Uninstaller must report skipping unowned directory"
    );
    assert(fs.existsSync(path.join(unownedDir, "unowned_data.json")), "Unowned directory contents must NOT be deleted");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: rejects unsupported target combination with --skills-cli", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-skills-cli-unsupported-"));
  try {
    assert.throws(
      () =>
        execSync(`bash "${installScript}" --path "${tempProject}" --target dsh --skills-cli`, {
          stdio: "pipe",
        }),
      (err) => {
        const stderr = err.stderr.toString();
        return err.status === 1 && stderr.includes("--skills-cli does not support target 'dsh'");
      },
      "Installer must reject unsupported target combination with --skills-cli"
    );
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

