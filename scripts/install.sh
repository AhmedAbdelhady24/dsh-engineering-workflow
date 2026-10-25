#!/usr/bin/env bash
# Universal Engineering Workflow Installer
# Supports Google Antigravity IDE, Antigravity CLI, DeepSeek Harness (DSH), OpenAI Codex, and Claude Code.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
if [[ -d "${ROOT_DIR}/skill/engineering-workflow" ]]; then
  SKILL_SOURCE="${ROOT_DIR}/skill/engineering-workflow"
elif [[ -d "${ROOT_DIR}/skills/engineering-workflow" ]]; then
  SKILL_SOURCE="${ROOT_DIR}/skills/engineering-workflow"
else
  SKILL_SOURCE="${ROOT_DIR}/skill/engineering-workflow"
fi

TARGET="all"
SCOPE="project"
PROJECT_DIR="$(pwd)"
USE_SKILLS_CLI=false
DRY_RUN=false

usage() {
  cat <<EOF
Usage: $0 [options]

Options:
  --target <antigravity-ide|antigravity-cli|antigravity|dsh|codex|claude|all>
                               Target agent environment (default: all)
  --scope <project|global>     Installation scope (default: project)
  --path <dir>                 Target project directory (default: current working dir)
  --skills-cli                 Use 'npx skills add' where supported
  --dry-run                    Preview target paths without copying files
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
    --skills-cli) USE_SKILLS_CLI=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -d "${SKILL_SOURCE}" ]]; then
  echo "❌ Error: Source skill directory not found at ${SKILL_SOURCE}" >&2
  exit 1
fi

echo "📦 Installing 'engineering-workflow' skill..."
echo "   Target:  ${TARGET}"
echo "   Scope:   ${SCOPE}"
echo "   Source:  ${SKILL_SOURCE}"

# Resolve target destination directories based on agent and scope
declare -a DESTINATIONS=()

add_destination() {
  local agent="$1"
  local dest=""
  if [[ "${SCOPE}" == "global" ]]; then
    case "${agent}" in
      antigravity-ide) dest="${HOME}/.gemini/config/skills/engineering-workflow" ;;
      antigravity-cli) dest="${HOME}/.gemini/antigravity-cli/skills/engineering-workflow" ;;
      dsh)             dest="${HOME}/.dsh/skills/engineering-workflow" ;;
      codex)           dest="${HOME}/.agents/skills/engineering-workflow" ;;
      claude)          dest="${HOME}/.claude/skills/engineering-workflow" ;;
    esac
  else
    case "${agent}" in
      antigravity-ide) dest="${PROJECT_DIR}/.agents/skills/engineering-workflow" ;;
      antigravity-cli) dest="${PROJECT_DIR}/.agents/skills/engineering-workflow" ;;
      dsh)             dest="${PROJECT_DIR}/.dsh/skills/engineering-workflow" ;;
      codex)           dest="${PROJECT_DIR}/.agents/skills/engineering-workflow" ;;
      claude)          dest="${PROJECT_DIR}/.claude/skills/engineering-workflow" ;;
    esac
  fi

  # Avoid duplicate destinations if .agents/skills is shared
  if [[ ${#DESTINATIONS[@]} -gt 0 ]]; then
    for existing in "${DESTINATIONS[@]}"; do
      if [[ "${existing}" == "${dest}" ]]; then
        return 0
      fi
    done
  fi
  DESTINATIONS+=("${dest}")
}

if [[ "${TARGET}" == "all" || "${TARGET}" == "antigravity" || "${TARGET}" == "antigravity-ide" ]]; then
  add_destination "antigravity-ide"
fi
if [[ "${TARGET}" == "all" || "${TARGET}" == "antigravity" || "${TARGET}" == "antigravity-cli" ]]; then
  add_destination "antigravity-cli"
fi
if [[ "${TARGET}" == "all" || "${TARGET}" == "dsh" ]]; then
  add_destination "dsh"
fi
if [[ "${TARGET}" == "all" || "${TARGET}" == "codex" ]]; then
  add_destination "codex"
fi
if [[ "${TARGET}" == "all" || "${TARGET}" == "claude" ]]; then
  add_destination "claude"
fi

for dest in "${DESTINATIONS[@]}"; do
  echo "──► Destination: ${dest}"
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "    [Dry Run] Would copy ${SKILL_SOURCE} -> ${dest}"
  else
    mkdir -p "$(dirname "${dest}")"
    rm -rf "${dest}"
    cp -R "${SKILL_SOURCE}" "${dest}"
    echo "    ✓ Successfully installed to ${dest}"
  fi
done

# Verification check
if [[ "${DRY_RUN}" != "true" ]]; then
  echo ""
  echo "🔍 Verifying installed destinations..."
  for dest in "${DESTINATIONS[@]}"; do
    if [[ -f "${dest}/SKILL.md" ]]; then
      echo "    ✓ ${dest}/SKILL.md (OK)"
    else
      echo "    ❌ Verification failed: ${dest}/SKILL.md missing!" >&2
      exit 1
    fi
  done
  echo "✅ Installation complete and verified!"
fi
