import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const setupMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/setup.md"), "utf-8");
const executeMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/execute.md"), "utf-8");
const reviewMd = fs.readFileSync(path.join(rootDir, "skill/engineering-workflow/references/review.md"), "utf-8");

test("Operation contract: setup terminates strictly at an Approval Gate", () => {
  assert(setupMd.includes("Approval Gate"), "setup.md must define an explicit Approval Gate");
  assert(setupMd.includes("HALT AND REQUEST EXPLICIT APPROVAL"), "setup.md must halt before mutating repository");
  assert(setupMd.includes("Capability Readiness Report"), "setup.md must produce a Capability Readiness Report");
  assert(setupMd.includes("Never overwrite existing instructions blindly"), "setup.md must protect existing project instructions");
  assert(setupMd.includes("Phase 7: Post-Approval Initialization"), "setup.md must place file generation strictly post-approval");
  assert(setupMd.includes("Only after the user explicitly signs off at the Approval Gate"), "setup.md must forbid writing files prior to approval");
});

test("Operation contract: execute enforces proportional planning, TDD, and max 3 review cycles", () => {
  assert(executeMd.includes("Pre-Flight Inspection"), "execute.md must require git status inspection");
  assert(executeMd.includes("Single Writer"), "execute.md must enforce single-writer rule");
  assert(executeMd.includes("Smallest Complete Slice"), "execute.md must require minimal complete changes");
  assert(executeMd.includes("Maximum of 3 correction cycles"), "execute.md must bound correction cycles to at most 3");
  assert(executeMd.includes("Acceptance Gate & Completion Report"), "execute.md must terminate with verifiable completion evidence");
});

test("Operation contract: review is strictly read-only and uses formal severity taxonomy", () => {
  assert(reviewMd.includes("Strictly Read-Only"), "review.md must enforce read-only role");
  assert(reviewMd.includes("NEVER modifies files"), "review.md must forbid modifying code");

  const requiredSeverities = ["BLOCKER", "HIGH", "MEDIUM", "LOW", "NIT"];
  for (const sev of requiredSeverities) {
    assert(reviewMd.includes(sev), `review.md must include severity level: ${sev}`);
  }

  assert(reviewMd.includes("Sequential review pass (same context); independent isolation was unavailable."),
    "review.md must disclose when independent subagent isolation was unavailable");
});
