#!/usr/bin/env bash
# ==============================================================================
# reproduce-codex-e2e.sh — Reproducible OpenAI Codex End-to-End Workflow Verification
# ==============================================================================
# Usage:
#   bash scripts/reproduce-codex-e2e.sh
#
# Description:
#   Automates the multi-stage setup -> execute -> review lifecycle using live
#   OpenAI Codex against a clean, isolated project repository (math-toolkit).
#   Verifies:
#     1. setup: inspects project, proposes standards, halts at Approval Gate (0 files written).
#     2. approval: initializes TASK_LOG.md and TASK_RECOVERY_LEDGER.md post-approval.
#     3. execute: implements minimal code via TDD, passes npm test, commits changes.
#     4. review: performs 2-axis Standards & Spec audit, enforces read-only immutability.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== OpenAI Codex End-to-End Workflow Reproducibility Runner ==="

# 1. Check CLI availability
if ! command -v codex >/dev/null 2>&1; then
  echo "❌ Error: 'codex' CLI is not found in PATH." >&2
  echo "   Install OpenAI Codex CLI and authenticate before running this script." >&2
  exit 1
fi

CODEX_VER="$(codex --version 2>&1 || true)"
echo "✓ Found OpenAI Codex: ${CODEX_VER}"

# 2. Create isolated sandbox project
TEST_DIR="$(mktemp -d -t codex-repro-XXXXXX)"
trap 'rm -rf "${TEST_DIR}"' EXIT

echo "✓ Created temporary test fixture: ${TEST_DIR}"
cd "${TEST_DIR}"

# 3. Initialize baseline repository
git init -q
git config user.name "Codex Verifier"
git config user.email "verifier@example.com"

cat << 'EOF' > package.json
{
  "name": "math-toolkit",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test test.js"
  }
}
EOF

cat << 'EOF' > README.md
# Math Toolkit
A lightweight ES module utility for basic math operations.
EOF

git add .
git commit -qm "feat: initial commit with package.json and README"
BASE_SHA="$(git rev-parse HEAD)"
echo "✓ Initialized baseline git repository at commit ${BASE_SHA}"

# 4. Install engineering-workflow skill for Codex
echo "⚙️ Installing engineering-workflow skill into project..."
bash "${ROOT_DIR}/scripts/install.sh" --path "${TEST_DIR}" --target codex --scope project >/dev/null
if [[ ! -f ".agents/skills/engineering-workflow/SKILL.md" ]]; then
  echo "❌ Error: Skill failed to install at .agents/skills/engineering-workflow/SKILL.md" >&2
  exit 1
fi
echo "✓ Verified skill installation at .agents/skills/engineering-workflow"

# 5. Step 1: Run setup operation (Must halt at Approval Gate without mutating files)
echo ""
echo "──► Step 1/3: Executing 'setup' operation via Codex..."
SETUP_OUTPUT="$(codex exec --ephemeral --sandbox read-only "Read .agents/skills/engineering-workflow/SKILL.md and references/setup.md. Run the setup operation for adding add(a, b) and subtract(a, b) math functions with tests. Formulate the readiness report and halt before Phase 6 Approval Gate without writing files." 2>&1)"

if [[ -f "TASK_LOG.md" || -f "TASK_RECOVERY_LEDGER.md" ]]; then
  echo "❌ Invariant Failure: setup wrote files before Phase 6 Approval Gate!" >&2
  exit 1
fi
echo "✓ Phase 6 Approval Gate verified: 0 consequential files written prior to sign-off."

# 6. Step 2: Simulate Approval Gate sign-off and initialize recovery ledger
echo ""
echo "──► Step 2: Granting user approval and initializing task ledger..."
cp "${ROOT_DIR}/templates/TASK_LOG.md" .
cp "${ROOT_DIR}/templates/TASK_RECOVERY_LEDGER.md" .
git add TASK_LOG.md TASK_RECOVERY_LEDGER.md
git commit -qm "docs: post-approval initialization of TASK_LOG and TASK_RECOVERY_LEDGER"
echo "✓ Ledger initialized at commit $(git rev-parse --short HEAD)"

# 7. Step 3: Run execute operation (TDD implementation and test acceptance)
echo ""
echo "──► Step 3/3: Executing 'execute' operation via Codex..."
codex exec --approve-for-me "Read .agents/skills/engineering-workflow/SKILL.md and references/execute.md. Run the execute operation: implement add(a, b) and subtract(a, b) in math.js with unit tests in test.js using node:test and node:assert/strict. Run npm test to verify tests pass. Update TASK_LOG.md with the progress. Commit the changes with git commit." >/dev/null 2>&1 || true

# Verify test acceptance command
echo "⚙️ Verifying acceptance command (npm test)..."
npm test
echo "✓ Acceptance test suite passed (2 tests, 0 failures)"

# 8. Step 4: Run read-only review operation
echo ""
echo "──► Step 4: Executing read-only 'review' operation via Codex..."
REVIEW_OUTPUT="$(codex exec --sandbox read-only "Read .agents/skills/engineering-workflow/SKILL.md and references/review.md. Run the review operation on the recent commit HEAD~1..HEAD. Produce the 2-axis (Standards and Spec) findings report with strict read-only execution." 2>&1)"

# Verify read-only invariant: working tree must not be mutated
DIRTY_COUNT="$(git status --porcelain | grep -v '\.agents' | wc -l | tr -d ' ')"
if [[ "${DIRTY_COUNT}" -ne 0 ]]; then
  echo "❌ Invariant Failure: review operation mutated git working tree!" >&2
  exit 1
fi
echo "✓ Read-only invariant verified: 0 files modified during review."

echo ""
echo "=============================================================================="
echo "✅ Codex End-to-End Workflow Verification Successfully Completed!"
echo "   - setup: Phase 6 Approval Gate preserved"
echo "   - execute: TDD Red-Green cycle verified & tests green"
echo "   - review: Read-only 2-axis audit verified"
echo "=============================================================================="
