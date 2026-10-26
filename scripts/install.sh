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
  echo "❌ Error: Could not locate source skill directory in ${ROOT_DIR}/skill or ${ROOT_DIR}/skills" >&2
  exit 1
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
    --target)
      TARGET="$2"
      shift 2
      ;;
    --scope)
      SCOPE="$2"
      shift 2
      ;;
    --path)
      PROJECT_DIR="$2"
      shift 2
      ;;
    --skills-cli)
      USE_SKILLS_CLI=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "❌ Error: Unknown option '$1'" >&2
      usage
      ;;
  esac
done

# Validate --target
VALID_TARGETS=("antigravity-ide" "antigravity-cli" "antigravity" "dsh" "codex" "claude" "all")
TARGET_VALID=false
for valid in "${VALID_TARGETS[@]}"; do
  if [[ "${TARGET}" == "${valid}" ]]; then
    TARGET_VALID=true
    break
  fi
done
if [[ "${TARGET_VALID}" != "true" ]]; then
  echo "❌ Error: Invalid target '${TARGET}'. Must be one of: ${VALID_TARGETS[*]}" >&2
  exit 1
fi

# Validate --scope
if [[ "${SCOPE}" != "project" && "${SCOPE}" != "global" ]]; then
  echo "❌ Error: Invalid scope '${SCOPE}'. Must be 'project' or 'global'." >&2
  exit 1
fi

if [[ ! -d "${SKILL_SOURCE}" || ! -f "${SKILL_SOURCE}/SKILL.md" ]]; then
  echo "❌ Error: Invalid source skill at ${SKILL_SOURCE} (missing SKILL.md)" >&2
  exit 1
fi

echo "📦 Installing 'engineering-workflow' skill..."
echo "   Target:  ${TARGET}"
echo "   Scope:   ${SCOPE}"
echo "   Source:  ${SKILL_SOURCE}"

# Handle --skills-cli if requested
if [[ "${USE_SKILLS_CLI}" == "true" ]]; then
  if command -v npx >/dev/null 2>&1; then
    echo "⚙️  Invoking Skills CLI (npx skills add)..."
    if [[ "${DRY_RUN}" == "true" ]]; then
      echo "    [Dry Run] Would execute: npx skills add \"${SKILL_SOURCE}\""
      exit 0
    else
      if npx --yes skills add "${SKILL_SOURCE}" 2>/dev/null; then
        echo "    ✓ Successfully installed via Skills CLI"
        exit 0
      else
        echo "    ⚠️ Skills CLI installation encountered a problem; falling back to direct installation."
      fi
    fi
  else
    echo "    ⚠️ 'npx' not found in PATH; falling back to direct directory copy."
  fi
fi

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

# Array to track installed destinations for rollback on partial failure
declare -a INSTALLED_DESTS=()
declare -a BACKED_UP_DESTS=()

cleanup_backups() {
  if [[ ${#BACKED_UP_DESTS[@]} -gt 0 ]]; then
    for bak in "${BACKED_UP_DESTS[@]}"; do
      if [[ -d "${bak}" ]]; then
        rm -rf "${bak}"
      fi
    done
  fi
}

rollback() {
  echo "❌ Installation failed! Rolling back changes..." >&2
  if [[ ${#BACKED_UP_DESTS[@]} -gt 0 ]]; then
    for bak in "${BACKED_UP_DESTS[@]}"; do
      local orig="${bak%.bak.*}"
      if [[ -d "${bak}" ]]; then
        rm -rf "${orig}"
        mv "${bak}" "${orig}"
        echo "    ✓ Restored backup for ${orig}" >&2
      fi
    done
  fi
  if [[ ${#INSTALLED_DESTS[@]} -gt 0 ]]; then
    for installed in "${INSTALLED_DESTS[@]}"; do
      if [[ -d "${installed}" ]]; then
        # If no backup existed, remove the newly created directory
        local bak_found=false
        if [[ ${#BACKED_UP_DESTS[@]} -gt 0 ]]; then
          for bak in "${BACKED_UP_DESTS[@]}"; do
            if [[ "${bak}" == "${installed}.bak."* ]]; then
              bak_found=true
              break
            fi
          done
        fi
        if [[ "${bak_found}" != "true" ]]; then
          rm -rf "${installed}"
          echo "    ✓ Removed partial install at ${installed}" >&2
        fi
      fi
    done
  fi
  exit 1
}

trap cleanup_backups EXIT

for dest in "${DESTINATIONS[@]}"; do
  echo "──► Destination: ${dest}"
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "    [Dry Run] Would copy ${SKILL_SOURCE} -> ${dest}"
    continue
  fi

  parent_dir="$(dirname "${dest}")"
  mkdir -p "${parent_dir}"

  # Ownership check if destination already exists
  if [[ -e "${dest}" ]]; then
    if [[ -L "${dest}" ]]; then
      # If symlink, safely remove symlink without removing target contents
      rm -f "${dest}"
    elif [[ -f "${dest}/SKILL.md" ]]; then
      # Verify it is an engineering-workflow installation
      if ! grep -q "name: engineering-workflow" "${dest}/SKILL.md" 2>/dev/null; then
        echo "⚠️ Warning: Target directory ${dest} does not appear to be an engineering-workflow skill. Overwriting after backup."
      fi
      # Back up existing for rollback safety
      bak_path="${dest}.bak.$$"
      mv "${dest}" "${bak_path}"
      BACKED_UP_DESTS+=("${bak_path}")
    else
      # Directory exists without SKILL.md
      bak_path="${dest}.bak.$$"
      mv "${dest}" "${bak_path}"
      BACKED_UP_DESTS+=("${bak_path}")
    fi
  fi

  # Atomic staging
  tmp_path="${dest}.tmp.$$"
  rm -rf "${tmp_path}"

  if ! cp -R "${SKILL_SOURCE}" "${tmp_path}"; then
    rm -rf "${tmp_path}"
    rollback
  fi

  # Verify staging integrity
  if [[ ! -f "${tmp_path}/SKILL.md" ]]; then
    echo "❌ Staged skill verification failed at ${tmp_path}" >&2
    rm -rf "${tmp_path}"
    rollback
  fi

  # Atomic move into final location
  if ! mv "${tmp_path}" "${dest}"; then
    rollback
  fi

  INSTALLED_DESTS+=("${dest}")
  echo "    ✓ Successfully installed to ${dest}"
done

# Verification check
if [[ "${DRY_RUN}" != "true" ]]; then
  echo ""
  echo "🔍 Verifying installed destinations..."
  for dest in "${DESTINATIONS[@]}"; do
    if [[ -f "${dest}/SKILL.md" && -d "${dest}/references" ]]; then
      echo "    ✓ ${dest}/SKILL.md (OK)"
    else
      echo "    ❌ Verification failed: ${dest}/SKILL.md or references/ missing!" >&2
      rollback
    fi
  done
  echo "✅ Installation complete and verified!"
fi
