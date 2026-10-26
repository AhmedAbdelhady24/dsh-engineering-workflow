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

test("Installer: upgrades between legitimate skill versions without --force when files are unmodified", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-upgrade-clean-"));
  try {
    // 1. Initial install
    const firstRun = execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });
    assert(firstRun.includes("Installation complete and verified!"), "First install must succeed");

    const installedSkill = path.join(tempProject, ".agents/skills/engineering-workflow");
    const manifestPath = path.join(installedSkill, ".install-manifest.json");
    assert(fs.existsSync(manifestPath), "Manifest must be generated on install");

    // 2. Repeat install without --force (clean upgrade / update)
    const upgradeRun = execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });
    assert(
      upgradeRun.includes("Clean previous installation detected") || upgradeRun.includes("Installation complete and verified!"),
      "Clean upgrade without --force must succeed"
    );
    assert(fs.existsSync(manifestPath), "Manifest must exist after upgrade");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: uninstaller preserves user-added extra files using installation manifest", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-uninst-extra-"));
  try {
    // 1. Install
    execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    const targetDir = path.join(tempProject, ".agents/skills/engineering-workflow");
    const userFile = path.join(targetDir, "custom_user_workflow.md");
    fs.writeFileSync(userFile, "# Custom User Content\nDo not delete me!");

    // 2. Run uninstaller
    const uninstallOutput = execSync(`bash "${uninstallScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    assert(uninstallOutput.includes("Preserved user content"), "Uninstaller must announce preserved user content");
    assert(fs.existsSync(userFile), "User-added file must be preserved");
    assert.equal(fs.readFileSync(userFile, "utf-8"), "# Custom User Content\nDo not delete me!");

    // Stock files should be removed
    assert(!fs.existsSync(path.join(targetDir, "references", "execute.md")), "Stock files must be removed");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: uninstaller preserves user-modified files using installation manifest", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-uninst-mod-"));
  try {
    // 1. Install
    execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    const targetDir = path.join(tempProject, ".agents/skills/engineering-workflow");
    const skillMd = path.join(targetDir, "SKILL.md");
    fs.appendFileSync(skillMd, "\n# User Custom Instructions Added Here\n");

    // 2. Run uninstaller
    const uninstallOutput = execSync(`bash "${uninstallScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    assert(uninstallOutput.includes("Preserved user content"), "Uninstaller must announce preserved modified files");
    assert(fs.existsSync(skillMd), "Modified SKILL.md must be preserved on disk");
    assert(fs.readFileSync(skillMd, "utf-8").includes("User Custom Instructions"), "User custom edits must be intact");

    // Unmodified stock files should be cleaned up
    assert(!fs.existsSync(path.join(targetDir, "references", "review.md")), "Unmodified files must be removed");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
  }
});

test("Installer: uninstaller refuses to delete arbitrary symlinks pointing to unowned skills", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-symlink-unowned-"));
  const otherSkill = fs.mkdtempSync(path.join(os.tmpdir(), "uew-other-skill-"));
  try {
    fs.writeFileSync(
      path.join(otherSkill, "SKILL.md"),
      "---\nname: completely-different-skill\ndescription: Unrelated\n---\n# Other Skill"
    );

    const symlinkDest = path.join(tempProject, ".claude/skills/engineering-workflow");
    fs.mkdirSync(path.dirname(symlinkDest), { recursive: true });
    fs.symlinkSync(otherSkill, symlinkDest);

    const output = execSync(`bash "${uninstallScript}" --path "${tempProject}" --target claude --scope project`, {
      encoding: "utf-8",
    });

    assert(output.includes("Skipping symlink") && output.includes("unowned skill"), "Uninstaller must skip unowned symlink");
    assert(fs.lstatSync(symlinkDest).isSymbolicLink(), "Unowned symlink must remain untouched");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
    fs.rmSync(otherSkill, { recursive: true, force: true });
  }
});

test("Installer: symlinks pointing to external directories cannot cause external files or directories to be modified or deleted during uninstall", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-symlink-cleanup-"));
  const externalCanary = fs.mkdtempSync(path.join(os.tmpdir(), "uew-external-canary-"));
  try {
    // 1. Create external canary directory with files and subdirectories
    const canaryFile = path.join(externalCanary, "secret-data.txt");
    fs.writeFileSync(canaryFile, "IMPORTANT_USER_SECRET_DO_NOT_DELETE");
    const subCanaryDir = path.join(externalCanary, "sub-dir");
    fs.mkdirSync(subCanaryDir, { recursive: true });
    const subCanaryFile = path.join(subCanaryDir, "sub-data.txt");
    fs.writeFileSync(subCanaryFile, "SUB_CANARY_PAYLOAD");

    // 2. Install skill
    execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    const targetDir = path.join(tempProject, ".agents/skills/engineering-workflow");

    // 3. Add user symlink pointing to external directory and another to external file
    const symlinkDir = path.join(targetDir, "user-external-dir-link");
    const symlinkFile = path.join(targetDir, "user-external-file-link");
    fs.symlinkSync(externalCanary, symlinkDir);
    fs.symlinkSync(canaryFile, symlinkFile);

    // 4. Run uninstaller
    const uninstallOutput = execSync(`bash "${uninstallScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    // 5. Invariant verifications:
    // Uninstaller must announce preserved user symlink
    assert(uninstallOutput.includes("user-added symlink"), "Uninstaller must detect and preserve user-added symlinks");

    // External canary directory and contents MUST NOT be deleted or modified!
    assert(fs.existsSync(externalCanary), "External directory must not be deleted");
    assert(fs.existsSync(canaryFile), "External file must not be deleted");
    assert.equal(
      fs.readFileSync(canaryFile, "utf-8"),
      "IMPORTANT_USER_SECRET_DO_NOT_DELETE",
      "External file content must remain completely unchanged"
    );
    assert(fs.existsSync(subCanaryFile), "External sub-file must not be deleted");
    assert.equal(
      fs.readFileSync(subCanaryFile, "utf-8"),
      "SUB_CANARY_PAYLOAD",
      "External sub-file content must remain unchanged"
    );

    // User symlink itself inside install directory is preserved
    assert(fs.lstatSync(symlinkDir).isSymbolicLink(), "User symlink must remain intact");

    // Stock skill files must be removed
    assert(!fs.existsSync(path.join(targetDir, "references", "setup.md")), "Stock files must be removed");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
    fs.rmSync(externalCanary, { recursive: true, force: true });
  }
});

test("Installer: installation ownership manifest detects user-added symlinks and refuses upgrade without --force", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-symlink-upgrade-"));
  const externalDir = fs.mkdtempSync(path.join(os.tmpdir(), "uew-upgrade-canary-"));
  try {
    fs.writeFileSync(path.join(externalDir, "config.json"), '{"external": true}');

    // 1. Initial install
    execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    const targetDir = path.join(tempProject, ".agents/skills/engineering-workflow");

    // 2. Add user symlink
    fs.symlinkSync(externalDir, path.join(targetDir, "external-symlink"));

    // 3. Attempt upgrade without --force -> MUST FAIL
    let failed = false;
    let errOutput = "";
    try {
      execSync(`bash "${installScript}" --path "${tempProject}" --target codex --scope project`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
    } catch (err) {
      failed = true;
      errOutput = (err.stderr || "").toString() + (err.stdout || "").toString();
    }

    assert(failed, "Upgrade must fail when user-added symlink exists without --force");
    assert(
      errOutput.includes("user-modified content") && errOutput.includes("external-symlink"),
      "Error must identify user-added symlink and refuse overwrite"
    );

    // External target must remain untouched
    assert.equal(fs.readFileSync(path.join(externalDir, "config.json"), "utf-8"), '{"external": true}');
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
    fs.rmSync(externalDir, { recursive: true, force: true });
  }
});

test("Installer: legacy unmanifested uninstaller safely preserves user files and symlinks without destructive rm -rf", () => {
  const tempProject = fs.mkdtempSync(path.join(os.tmpdir(), "uew-legacy-unmanifest-"));
  const externalDir = fs.mkdtempSync(path.join(os.tmpdir(), "uew-legacy-external-"));
  try {
    fs.writeFileSync(path.join(externalDir, "safe.txt"), "EXTERNAL_SAFE_CONTENT");

    const targetDir = path.join(tempProject, ".agents/skills/engineering-workflow");
    fs.mkdirSync(path.join(targetDir, "references"), { recursive: true });

    // Populate standard skill files mimicking an old unmanifested v1.0 install
    fs.writeFileSync(
      path.join(targetDir, "SKILL.md"),
      "---\nname: engineering-workflow\ndescription: Legacy\n---\n# Legacy Skill"
    );
    fs.writeFileSync(path.join(targetDir, "references", "setup.md"), "# Setup Reference");

    // Add user custom file and user symlink
    const customUserFile = path.join(targetDir, "user-custom-rule.md");
    fs.writeFileSync(customUserFile, "# My Custom Rule\nNever delete!");
    const userSymlink = path.join(targetDir, "user-ext-link");
    fs.symlinkSync(externalDir, userSymlink);

    // Run uninstaller on legacy unmanifested install
    const output = execSync(`bash "${uninstallScript}" --path "${tempProject}" --target codex --scope project`, {
      encoding: "utf-8",
    });

    assert(output.includes("Legacy unmanifested installation detected"), "Must announce legacy detection");
    assert(output.includes("Preserved user content"), "Must announce preserved user content");

    // Invariants:
    // Custom user file preserved
    assert(fs.existsSync(customUserFile), "Custom user file in legacy install must be preserved");
    // User symlink preserved
    assert(fs.lstatSync(userSymlink).isSymbolicLink(), "User symlink in legacy install must be preserved");
    // External directory completely untouched
    assert.equal(fs.readFileSync(path.join(externalDir, "safe.txt"), "utf-8"), "EXTERNAL_SAFE_CONTENT");
    // Standard files unlinked
    assert(!fs.existsSync(path.join(targetDir, "references", "setup.md")), "Standard setup.md must be unlinked");
  } finally {
    fs.rmSync(tempProject, { recursive: true, force: true });
    fs.rmSync(externalDir, { recursive: true, force: true });
  }
});


