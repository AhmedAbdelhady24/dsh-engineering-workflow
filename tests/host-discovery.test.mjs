import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";

// Simulated discovery resolver based on verified host conventions
function resolveSkillPaths(agent, scope, projectDir, homeDir = os.homedir()) {
  const paths = [];
  if (scope === "project") {
    switch (agent) {
      case "antigravity-ide":
      case "antigravity":
        paths.push(
          path.join(projectDir, ".agents", "skills", "engineering-workflow", "SKILL.md"),
          path.join(projectDir, ".gemini", "config", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
      case "antigravity-cli":
        paths.push(
          path.join(projectDir, ".agents", "skills", "engineering-workflow", "SKILL.md"),
          path.join(projectDir, ".gemini", "antigravity-cli", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
      case "dsh":
        paths.push(
          path.join(projectDir, ".dsh", "skills", "engineering-workflow", "SKILL.md"),
          path.join(projectDir, ".agents", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
      case "codex":
        paths.push(
          path.join(projectDir, ".agents", "skills", "engineering-workflow", "SKILL.md"),
          path.join(projectDir, ".codex", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
      case "claude":
        paths.push(
          path.join(projectDir, ".claude", "skills", "engineering-workflow", "SKILL.md"),
          path.join(projectDir, ".agents", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
    }
  } else {
    // global
    switch (agent) {
      case "antigravity-ide":
        paths.push(
          path.join(homeDir, ".gemini", "config", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
      case "antigravity-cli":
        paths.push(
          path.join(homeDir, ".gemini", "antigravity-cli", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
      case "antigravity":
        paths.push(
          path.join(homeDir, ".gemini", "config", "skills", "engineering-workflow", "SKILL.md"),
          path.join(homeDir, ".gemini", "antigravity-cli", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
      case "dsh":
        paths.push(
          path.join(homeDir, ".dsh", "skills", "engineering-workflow", "SKILL.md"),
          path.join(homeDir, ".agents", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
      case "codex":
        paths.push(
          path.join(homeDir, ".agents", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
      case "claude":
        paths.push(
          path.join(homeDir, ".claude", "skills", "engineering-workflow", "SKILL.md"),
          path.join(homeDir, ".agents", "skills", "engineering-workflow", "SKILL.md")
        );
        break;
    }
  }
  return paths;
}

test("Host discovery: global skill directories match verified target specs", () => {
  const dummyHome = "/mock/home/user";

  const idePaths = resolveSkillPaths("antigravity-ide", "global", "/tmp", dummyHome);
  assert(
    idePaths.includes(path.join(dummyHome, ".gemini", "config", "skills", "engineering-workflow", "SKILL.md")),
    "Antigravity IDE global path must be ~/.gemini/config/skills/"
  );

  const cliPaths = resolveSkillPaths("antigravity-cli", "global", "/tmp", dummyHome);
  assert(
    cliPaths.includes(path.join(dummyHome, ".gemini", "antigravity-cli", "skills", "engineering-workflow", "SKILL.md")),
    "Antigravity CLI global path must be ~/.gemini/antigravity-cli/skills/"
  );

  const dshPaths = resolveSkillPaths("dsh", "global", "/tmp", dummyHome);
  assert(
    dshPaths.includes(path.join(dummyHome, ".dsh", "skills", "engineering-workflow", "SKILL.md")),
    "DSH global path must be ~/.dsh/skills/"
  );

  const codexPaths = resolveSkillPaths("codex", "global", "/tmp", dummyHome);
  assert(
    codexPaths.includes(path.join(dummyHome, ".agents", "skills", "engineering-workflow", "SKILL.md")),
    "Codex global path must be ~/.agents/skills/"
  );

  const claudePaths = resolveSkillPaths("claude", "global", "/tmp", dummyHome);
  assert(
    claudePaths.includes(path.join(dummyHome, ".claude", "skills", "engineering-workflow", "SKILL.md")),
    "Claude Code global path must be ~/.claude/skills/"
  );
});

test("Host discovery: project-local .agents/skills is universally discoverable", () => {
  const dummyProject = "/mock/workspace/project";
  const sharedPath = path.join(dummyProject, ".agents", "skills", "engineering-workflow", "SKILL.md");

  const hosts = ["antigravity-ide", "antigravity-cli", "dsh", "codex", "claude"];
  for (const host of hosts) {
    const candidatePaths = resolveSkillPaths(host, "project", dummyProject);
    assert(
      candidatePaths.includes(sharedPath),
      `Host '${host}' must support the open standard path '.agents/skills/engineering-workflow/SKILL.md'`
    );
  }
});

test("Host discovery: native host-specific fallback directories are preserved", () => {
  const dummyProject = "/mock/workspace/project";
  assert(resolveSkillPaths("claude", "project", dummyProject).some((p) => p.includes(".claude")));
  assert(resolveSkillPaths("dsh", "project", dummyProject).some((p) => p.includes(".dsh")));
  assert(resolveSkillPaths("antigravity-ide", "project", dummyProject).some((p) => p.includes(".gemini")));
  assert(resolveSkillPaths("antigravity-cli", "project", dummyProject).some((p) => p.includes(".gemini")));
});
