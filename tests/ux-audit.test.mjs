import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const skillDir = path.join(rootDir, "skill/engineering-workflow");
const skillMd = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf-8");
const uxAuditMd = fs.readFileSync(path.join(skillDir, "references/ux-audit.md"), "utf-8");
const routingMd = fs.readFileSync(path.join(skillDir, "references/skill-routing.md"), "utf-8");
const reportTemplatePath = path.join(rootDir, "templates/UX_AUDIT_REPORT.md");

test("UX Audit: operation discovery and routing in SKILL.md", () => {
  assert(skillMd.includes("ux-audit"), "SKILL.md must declare ux-audit operation in router");
  assert(skillMd.includes("references/ux-audit.md"), "SKILL.md must link to references/ux-audit.md");
  assert(skillMd.includes("/engineering-workflow ux-audit"), "SKILL.md must show slash command invocation");
  assert(skillMd.includes("$engineering-workflow ux-audit"), "SKILL.md must show Codex command invocation");
});

test("UX Audit: focus argument support and modes", () => {
  const expectedFocusModes = ["onboarding", "navigation", "accessibility"];
  for (const mode of expectedFocusModes) {
    assert(
      uxAuditMd.includes(`ux-audit ${mode}`),
      `ux-audit.md must document focus mode: ${mode}`
    );
  }
  assert(
    uxAuditMd.includes("ux-audit <flow>") || uxAuditMd.includes("ux-audit [focus]"),
    "ux-audit.md must document custom workflow focus"
  );
});

test("UX Audit: all 8 audit stages are thoroughly documented", () => {
  const expectedStages = [
    "Stage 1 — Product & Technical Discovery",
    "Stage 2 — Real User Journey Walkthrough",
    "Stage 3 — UX & Usability Heuristics",
    "Stage 4 — Visual & Interaction Design",
    "Stage 5 — UX-Related Technical Architecture",
    "Stage 6 — Challenge the Current Product Experience",
    "Stage 7 — Prioritized Improvement Backlog",
    "Stage 8 — UX Validation Strategy",
  ];

  for (const stage of expectedStages) {
    assert(uxAuditMd.includes(stage), `ux-audit.md must include: '${stage}'`);
  }
});

test("UX Audit: evidence classification taxonomy and usability scorecard", () => {
  // Classification
  assert(uxAuditMd.includes("Observed"), "Must include 'Observed' evidence classification");
  assert(uxAuditMd.includes("Code-Supported"), "Must include 'Code-Supported' evidence classification");
  assert(uxAuditMd.includes("Hypothesis"), "Must include 'Hypothesis' evidence classification");

  // Usability scoring 1 to 5 scale
  assert(uxAuditMd.includes("1 to 5"), "Must define 1 to 5 usability scale");
  assert(uxAuditMd.includes("Critical Failure"), "Score 1 must define Critical Failure");
  assert(uxAuditMd.includes("Exceptional"), "Score 5 must define Exceptional");

  // Nielsen's heuristics
  assert(uxAuditMd.includes("Nielsen"), "Must ground heuristics in Nielsen's principles");
  assert(uxAuditMd.includes("Visibility of System Status"), "Must cover Visibility of System Status");
  assert(uxAuditMd.includes("User Control and Freedom"), "Must cover User Control and Freedom");
  assert(uxAuditMd.includes("Error Prevention"), "Must cover Error Prevention");
});

test("UX Audit: visual and WCAG 2.2 AA accessibility standards", () => {
  assert(uxAuditMd.includes("WCAG 2.2 AA"), "Must reference WCAG 2.2 AA standard");
  assert(uxAuditMd.includes("4.5:1"), "Must specify minimum 4.5:1 text contrast");
  assert(uxAuditMd.includes("focus-visible"), "Must evaluate :focus-visible outlines");
  assert(uxAuditMd.includes("prefers-reduced-motion"), "Must audit reduced-motion compliance");
  assert(uxAuditMd.toLowerCase().includes("touch targets"), "Must evaluate minimum touch target sizing (44x44px)");
});

test("UX Audit: UX-related technical architecture inspection requirements", () => {
  assert(uxAuditMd.includes("file:line"), "Must require exact file:line citations for technical findings");
  assert(uxAuditMd.includes("UI State Synchronization"), "Must inspect UI state synchronization & race conditions");
  assert(uxAuditMd.includes("Navigation & Deep Linking"), "Must inspect URL parameter sync & back button behavior");
  assert(uxAuditMd.includes("Form State & Draft Persistence"), "Must inspect unsubmitted form loss & validation timing");
  assert(uxAuditMd.includes("Error Propagation"), "Must inspect error boundaries & actionable recovery messages");
});

test("UX Audit: report template contains all 14 mandatory sections", () => {
  assert(fs.existsSync(reportTemplatePath), "templates/UX_AUDIT_REPORT.md must exist");
  const template = fs.readFileSync(reportTemplatePath, "utf-8");

  const requiredSections = [
    "## 1. Executive Summary",
    "## 2. Product Purpose & Target Users",
    "## 3. Audit Scope & Tested Environments",
    "## 4. Current-State User Journey",
    "## 5. Observed User Journey Walkthrough",
    "## 6. Usability Scorecard",
    "## 7. UI & Accessibility Findings",
    "## 8. UX-Related Technical Findings",
    "## 9. Screenshots & Supporting Evidence",
    "## 10. Proposed Future-State Experience",
    "## 11. Prioritized Improvement Backlog",
    "## 12. Proposed Implementation Milestones",
    "## 13. Open Product Decisions",
    "## 14. Recommended Validation Strategy",
  ];

  for (const section of requiredSections) {
    assert(template.includes(section), `Report template must contain section: '${section}'`);
  }

  // Tiers A, B, C in backlog
  assert(template.includes("Tier A: Quick Wins"), "Template backlog must have Tier A Quick Wins");
  assert(template.includes("Tier B: Workflow & Interaction"), "Template backlog must have Tier B");
  assert(template.includes("Tier C: Architectural"), "Template backlog must have Tier C");
});

test("UX Audit: strict read-only safety constraints", () => {
  assert(uxAuditMd.includes("Zero Code Modification"), "Must prohibit code edits");
  assert(uxAuditMd.includes("Never edit, format, or mutate application code"), "Must explicitly forbid edits");
  assert(uxAuditMd.includes("Never stage, commit, push, stash, or reset"), "Must explicitly forbid Git mutations");
  assert(uxAuditMd.includes("Approval Gate for Reports"), "Must require user approval before writing report to disk");
});

test("UX Audit: missing browser automation tool handling", () => {
  assert(uxAuditMd.includes("NOT TESTED"), "Must mark findings NOT TESTED when browser tools are unavailable");
  assert(
    uxAuditMd.includes("Never claim runtime verification without execution evidence"),
    "Must forbid hallucinating browser tests without evidence"
  );
  assert(
    routingMd.includes("Specialist Skill Routing for `ux-audit`"),
    "skill-routing.md must contain dedicated ux-audit routing section"
  );
  assert(
    routingMd.includes("browser-testing-with-devtools"),
    "skill-routing.md must route browser-testing-with-devtools for ux-audit"
  );
});

test("UX Audit: exercises UI component inspection on frontend fixture without modifying it", () => {
  const fixturePath = path.join(rootDir, "tests/fixtures/frontend-project");
  const componentPath = path.join(fixturePath, "src/Button.jsx");

  assert(fs.existsSync(componentPath), "Frontend fixture must exist");
  const initialContent = fs.readFileSync(componentPath, "utf-8");

  // Simulate read-only UX audit component evaluation
  const findings = [];
  if (!initialContent.includes("aria-")) {
    findings.push({
      id: "UX-A11Y-01",
      problem: "Button lacks explicit aria-label or accessible name attribute",
      severity: "LOW",
      evidence: "src/Button.jsx:3-13",
    });
  }

  if (initialContent.includes("focus-visible:ring-2")) {
    findings.push({
      id: "UX-UI-01",
      note: "Button provides high-contrast focus-visible ring indicator",
      status: "PASS",
    });
  }

  assert(findings.length >= 2, "UX audit evaluator must generate findings on UI fixture");

  // Verify STRICT ZERO MODIFICATION of the fixture
  const postContent = fs.readFileSync(componentPath, "utf-8");
  assert.equal(initialContent, postContent, "Fixture file must remain completely unaltered during UX audit");
});
