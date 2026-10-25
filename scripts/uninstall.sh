#!/usr/bin/env bash
# Universal Engineering Workflow Uninstaller / Rollback
# Safely removes the engineering-workflow skill without touching other skills.
set -euo pipefail

TARGET="all"
SCOPE="project"
PROJECT_DIR="$(pwd)"
DRY_RUN=false

usage() {
  cat <<EOF
Usage: $0 [options]

Options:
  --target <antigravity-ide|antigravity-cli|antigravity|dsh|codex|claude|all>
                               Target agent environment (default: all)
  --scope <project|global>     Removal scope (default: project)
  --path <dir>                 Target project directory (default: current working dir)
  --dry-run                    Preview paths without deleting
  -h, --help                   Show this help message

Global Directory Mapping:
  - Antigravity IDE: ~/.gemini/config/skills/
  - Antigravity CLI: ~/.gemini/antigravity-cli/skills/
  - DSH:             ~/.dsh/skills/
  - Codex:           ~/.agents/skills/
  - Claude Code:     ~/.claude/skills/
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --scope) SCOPE="$2"; shift 2 ;;
    --path) PROJECT_DIR="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

echo "🗑️  Rolling back 'engineering-workflow' skill..."
echo "   Target:  ${TARGET}"
echo "   Scope:   ${SCOPE}"

declare -a TARGET_PATHS=()

add_path() {
  local agent="$1"
  local p=""
  if [[ "${SCOPE}" == "global" ]]; then
    case "${agent}" in
      antigravity-ide) p="${HOME}/.gemini/config/skills/engineering-workflow" ;;
      antigravity-cli) p="${HOME}/.gemini/antigravity-cli/skills/engineering-workflow" ;;
      dsh)             p="${HOME}/.dsh/skills/engineering-workflow" ;;
      codex)           p="${HOME}/.agents/skills/engineering-workflow" ;;
      claude)          p="${HOME}/.claude/skills/engineering-workflow" ;;
    esac
  else
    case "${agent}" in
      antigravity-ide) p="${PROJECT_DIR}/.agents/skills/engineering-workflow" ;;
      antigravity-cli) p="${PROJECT_DIR}/.agents/skills/engineering-workflow" ;;
      dsh)             p="${PROJECT_DIR}/.dsh/skills/engineering-workflow" ;;
      codex)           p="${PROJECT_DIR}/.agents/skills/engineering-workflow" ;;
      claude)          p="${PROJECT_DIR}/.claude/skills/engineering-workflow" ;;
    esac
  fi

  if [[ ${#TARGET_PATHS[@]} -gt 0 ]]; then
    for existing in "${TARGET_PATHS[@]}"; do
      if [[ "${existing}" == "${p}" ]]; then
        return 0
      fi
    done
  fi
  TARGET_PATHS+=("${p}")
}

if [[ "${TARGET}" == "all" || "${TARGET}" == "antigravity" || "${TARGET}" == "antigravity-ide" ]]; then
  add_path "antigravity-ide"
fi
if [[ "${TARGET}" == "all" || "${TARGET}" == "antigravity" || "${TARGET}" == "antigravity-cli" ]]; then
  add_path "antigravity-cli"
fi
if [[ "${TARGET}" == "all" || "${TARGET}" == "dsh" ]]; then
  add_path "dsh"
fi
if [[ "${TARGET}" == "all" || "${TARGET}" == "codex" ]]; then
  add_path "codex"
fi
if [[ "${TARGET}" == "all" || "${TARGET}" == "claude" ]]; then
  add_path "claude"
fi

for p in "${TARGET_PATHS[@]}"; do
  if [[ -d "${p}" ]]; then
    echo "──► Found: ${p}"
    if [[ "${DRY_RUN}" == "true" ]]; then
      echo "    [Dry Run] Would remove ${p}"
    else
      rm -rf "${p}"
      echo "    ✓ Successfully removed ${p}"
    fi
  else
    echo "──► Not found: ${p} (Already clean)"
  fi
done

echo "✅ Rollback complete!"
