import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Discovery classifier matching setup.md and skill-routing.md logic
function classifyProjectArchetype(projectPath) {
  const files = fs.readdirSync(projectPath);

  // 1. Greenfield / Empty
  if (files.length === 0 || (files.length === 1 && files[0] === ".git")) {
    return {
      archetype: "GREENFIELD_EMPTY",
      isUI: false,
      isMonorepo: false,
      recommendedAction: "Initialize package manifests, test runner, and AGENTS.md baseline",
    };
  }

  // 2. Monorepo detection
  const isPnpmMonorepo = fs.existsSync(path.join(projectPath, "pnpm-workspace.yaml"));
  const isLerna = fs.existsSync(path.join(projectPath, "lerna.json"));
  const isTurbo = fs.existsSync(path.join(projectPath, "turbo.json"));

  let isPackageJsonMonorepo = false;
  const pkgPath = path.join(projectPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.workspaces) isPackageJsonMonorepo = true;
    } catch {}
  }

  const isMonorepo = isPnpmMonorepo || isLerna || isTurbo || isPackageJsonMonorepo;

  // 3. UI detection
  let isUI = false;
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      isUI = Boolean(
        allDeps.react ||
        allDeps["react-dom"] ||
        allDeps.vue ||
        allDeps.svelte ||
        allDeps.next ||
        allDeps.nuxt ||
        allDeps["@angular/core"]
      );
    } catch {}
  }

  // Check HTML/DOM entrypoints
  if (!isUI) {
    const hasHtml = fs.existsSync(path.join(projectPath, "index.html")) || fs.existsSync(path.join(projectPath, "public/index.html"));
    if (hasHtml) isUI = true;
  }

  return {
    archetype: isMonorepo ? "MONOREPO" : isUI ? "FRONTEND_APPLICATION" : "BACKEND_SERVICE",
    isUI,
    isMonorepo,
    recommendedAction: isUI ? "Activate UI/UX capabilities and browser testing" : "Mark UI capabilities NOT APPLICABLE",
  };
}

test("Project classification: empty project identified as greenfield", () => {
  const tempEmpty = fs.mkdtempSync(path.join(os.tmpdir(), "uew-empty-"));
  try {
    const classification = classifyProjectArchetype(tempEmpty);
    assert.equal(classification.archetype, "GREENFIELD_EMPTY");
    assert.equal(classification.isUI, false);
    assert(classification.recommendedAction.includes("Initialize package manifests"));
  } finally {
    fs.rmSync(tempEmpty, { recursive: true, force: true });
  }
});

test("Project classification: backend fixture classified with UI NOT APPLICABLE", () => {
  const backendFixture = path.join(rootDir, "tests/fixtures/backend-project");
  const classification = classifyProjectArchetype(backendFixture);

  assert.equal(classification.archetype, "BACKEND_SERVICE");
  assert.equal(classification.isUI, false);
  assert.equal(classification.isMonorepo, false);
  assert(classification.recommendedAction.includes("NOT APPLICABLE"));
});

test("Project classification: frontend fixture activates UI capabilities", () => {
  const frontendFixture = path.join(rootDir, "tests/fixtures/frontend-project");
  const classification = classifyProjectArchetype(frontendFixture);

  assert.equal(classification.archetype, "FRONTEND_APPLICATION");
  assert.equal(classification.isUI, true);
  assert(classification.recommendedAction.includes("Activate UI/UX capabilities"));
});

test("Project classification: monorepo fixture detected with workspace boundaries", () => {
  const monorepoFixture = path.join(rootDir, "tests/fixtures/monorepo");
  const classification = classifyProjectArchetype(monorepoFixture);

  assert.equal(classification.archetype, "MONOREPO");
  assert.equal(classification.isMonorepo, true);
});
