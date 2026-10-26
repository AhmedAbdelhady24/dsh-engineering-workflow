#!/usr/bin/env bash
# Universal Engineering Workflow Installer
# Supports Google Antigravity IDE, Antigravity CLI, DeepSeek Harness (DSH), OpenAI Codex, and Claude Code.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-${0}}")" 2>/dev/null && pwd || echo "")"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." 2>/dev/null && pwd || echo "")"

SKILL_SOURCE=""
BOOTSTRAP_DIR=""

if [[ -n "${ROOT_DIR}" && -d "${ROOT_DIR}/skill/engineering-workflow" && -f "${ROOT_DIR}/skill/engineering-workflow/SKILL.md" ]]; then
  SKILL_SOURCE="${ROOT_DIR}/skill/engineering-workflow"
elif [[ -n "${ROOT_DIR}" && -d "${ROOT_DIR}/skills/engineering-workflow" && -f "${ROOT_DIR}/skills/engineering-workflow/SKILL.md" ]]; then
  SKILL_SOURCE="${ROOT_DIR}/skills/engineering-workflow"
elif [[ -d "$(pwd)/skill/engineering-workflow" && -f "$(pwd)/skill/engineering-workflow/SKILL.md" ]]; then
  SKILL_SOURCE="$(pwd)/skill/engineering-workflow"
elif [[ -d "$(pwd)/skills/engineering-workflow" && -f "$(pwd)/skills/engineering-workflow/SKILL.md" ]]; then
  SKILL_SOURCE="$(pwd)/skills/engineering-workflow"
else
  # Piped execution (curl | bash) or standalone invocation: bootstrap from remote repo
  echo "ℹ️ Local skill source not found. Bootstrapping repository archive from GitHub..."
  BOOTSTRAP_DIR="$(mktemp -d -t uew-bootstrap-XXXXXX 2>/dev/null || mktemp -d)"
  if command -v git >/dev/null 2>&1; then
    git clone --depth 1 -q https://github.com/AhmedAbdelhady24/engineering-workflow.git "${BOOTSTRAP_DIR}/repo" 2>/dev/null || true
    if [[ -d "${BOOTSTRAP_DIR}/repo/skill/engineering-workflow" ]]; then
      SKILL_SOURCE="${BOOTSTRAP_DIR}/repo/skill/engineering-workflow"
    fi
  fi

  if [[ -z "${SKILL_SOURCE}" ]] && command -v curl >/dev/null 2>&1 && command -v tar >/dev/null 2>&1; then
    mkdir -p "${BOOTSTRAP_DIR}/repo"
    if curl -fsSL https://github.com/AhmedAbdelhady24/engineering-workflow/archive/refs/heads/master.tar.gz | tar -xz -C "${BOOTSTRAP_DIR}/repo" --strip-components=1 2>/dev/null; then
      if [[ -d "${BOOTSTRAP_DIR}/repo/skill/engineering-workflow" ]]; then
        SKILL_SOURCE="${BOOTSTRAP_DIR}/repo/skill/engineering-workflow"
      fi
    fi
  fi

  if [[ -z "${SKILL_SOURCE}" || ! -f "${SKILL_SOURCE}/SKILL.md" ]]; then
    echo "❌ Error: Could not locate local skill source, and automated bootstrap failed." >&2
    echo "   Please clone the repository first: git clone https://github.com/AhmedAbdelhady24/engineering-workflow.git" >&2
    if [[ -d "${BOOTSTRAP_DIR}" ]]; then
      rm -rf "${BOOTSTRAP_DIR}"
    fi
    exit 1
  fi
fi

TARGET="all"
SCOPE="project"
PROJECT_DIR="$(pwd)"
USE_SKILLS_CLI=false
FORCE=false
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
  -f, --force                  Overwrite unowned directories or user-modified files
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
    -f|--force)
      FORCE=true
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
  if [[ "${TARGET}" == "dsh" || "${TARGET}" == "antigravity-cli" ]]; then
    echo "❌ Error: --skills-cli does not support target '${TARGET}'. Use direct installation for ${TARGET} or choose target 'all', 'claude', 'codex', or 'antigravity'." >&2
    exit 1
  fi

  if command -v npx >/dev/null 2>&1; then
    echo "⚙️  Invoking Skills CLI (npx skills add)..."
    declare -a CLI_CMD=("npx" "--yes" "skills" "add" "${SKILL_SOURCE}" "-y")
    if [[ "${SCOPE}" == "global" ]]; then
      CLI_CMD+=("-g")
    else
      CLI_CMD+=("-p")
    fi

    case "${TARGET}" in
      claude)                      CLI_CMD+=("-a" "claude-code") ;;
      codex)                       CLI_CMD+=("-a" "codex") ;;
      antigravity|antigravity-ide) CLI_CMD+=("-a" "antigravity") ;;
      all)                         CLI_CMD+=("-a" "*") ;;
      *)
        echo "❌ Error: --skills-cli does not support target '${TARGET}'. Use direct installation for ${TARGET} or choose target 'all', 'claude', 'codex', or 'antigravity'." >&2
        exit 1
        ;;
    esac

    if [[ "${DRY_RUN}" == "true" ]]; then
      echo "    [Dry Run] Would execute: (cd \"${PROJECT_DIR}\" && ${CLI_CMD[*]})"
      exit 0
    else
      if (cd "${PROJECT_DIR}" && "${CLI_CMD[@]}"); then
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

# Tracking arrays for transactional rollback
SUCCESS=false
declare -a INSTALLED_DESTS=()
declare -a BACKED_UP_DESTS=()

cleanup_backups() {
  if [[ ${#BACKED_UP_DESTS[@]} -gt 0 ]]; then
    for bak in "${BACKED_UP_DESTS[@]}"; do
      if [[ -L "${bak}" || -d "${bak}" ]]; then
        rm -rf "${bak}"
      fi
    done
  fi
}

rollback() {
  echo "❌ Installation failed! Rolling back changes..." >&2
  # 1. Restore backed-up destinations
  if [[ ${#BACKED_UP_DESTS[@]} -gt 0 ]]; then
    for bak in "${BACKED_UP_DESTS[@]}"; do
      local orig="${bak%.bak.*}"
      if [[ -L "${bak}" || -d "${bak}" ]]; then
        rm -rf "${orig}"
        mv "${bak}" "${orig}"
        echo "    ✓ Restored backup for ${orig}" >&2
      fi
    done
  fi
  # 2. Remove newly installed destinations without prior backup
  if [[ ${#INSTALLED_DESTS[@]} -gt 0 ]]; then
    for installed in "${INSTALLED_DESTS[@]}"; do
      if [[ -L "${installed}" || -d "${installed}" ]]; then
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
  # 3. Clean up staging paths
  if [[ ${#DESTINATIONS[@]} -gt 0 ]]; then
    for dest in "${DESTINATIONS[@]}"; do
      local tmp_path="${dest}.tmp.$$"
      if [[ -d "${tmp_path}" ]]; then
        rm -rf "${tmp_path}"
      fi
    done
  fi
}

on_exit() {
  local exit_code=$?
  if [[ "${SUCCESS}" != "true" && ${exit_code} -ne 0 ]]; then
    rollback
  else
    cleanup_backups
  fi
  if [[ -n "${BOOTSTRAP_DIR}" && -d "${BOOTSTRAP_DIR}" ]]; then
    rm -rf "${BOOTSTRAP_DIR}"
  fi
}

trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

# Function to generate an installation ownership manifest
generate_install_manifest() {
  local target_dir="$1"
  node -e "
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');

    const targetDir = process.argv[1];

    function getFiles(dir, base = '') {
      let results = [];
      const entries = fs.readdirSync(dir);
      for (const name of entries) {
        if (name === '.install-manifest.json' || name.includes('.bak.') || name.includes('.tmp.')) continue;
        const fullPath = path.join(dir, name);
        const relPath = base ? path.join(base, name) : name;
        const stat = fs.lstatSync(fullPath);
        if (stat.isSymbolicLink()) {
          const linkTarget = fs.readlinkSync(fullPath);
          results.push([relPath.split(path.sep).join('/'), 'symlink:' + linkTarget]);
        } else if (stat.isDirectory()) {
          results = results.concat(getFiles(fullPath, relPath));
        } else if (stat.isFile()) {
          const content = fs.readFileSync(fullPath);
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          results.push([relPath.split(path.sep).join('/'), hash]);
        }
      }
      return results;
    }

    const filesMap = {};
    for (const [rel, hash] of getFiles(targetDir)) {
      filesMap[rel] = hash;
    }

    const manifest = {
      manifestVersion: '1.0.0',
      name: 'engineering-workflow',
      installedAt: new Date().toISOString(),
      files: filesMap
    };

    fs.writeFileSync(path.join(targetDir, '.install-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  " "${target_dir}"
}

# Function to verify whether an existing destination has been modified by user
check_existing_destination() {
  local dest="$1"
  local source_dir="$2"
  local force="$3"

  # 1. Ownership check: Must contain SKILL.md with name: engineering-workflow
  if [[ ! -f "${dest}/SKILL.md" ]] || ! grep -q "name: engineering-workflow" "${dest}/SKILL.md" 2>/dev/null; then
    if [[ "${force}" != "true" ]]; then
      echo "❌ Error: Destination ${dest} exists and is not an engineering-workflow skill (unowned directory). Refusing to overwrite without --force." >&2
      return 1
    fi
    return 0
  fi

  if [[ "${force}" == "true" ]]; then
    return 0
  fi

  # 2. Manifest check: If .install-manifest.json exists, check for user modifications
  local manifest="${dest}/.install-manifest.json"
  if [[ -f "${manifest}" ]]; then
    local check_result
    check_result=$(node -e "
      const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');

      const dest = process.argv[1];
      const manifestPath = path.join(dest, '.install-manifest.json');
      let manifest;
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch (e) {
        console.log('CORRUPT_MANIFEST');
        process.exit(0);
      }

      function getDiskFiles(dir, base = '') {
        let results = [];
        const entries = fs.readdirSync(dir);
        for (const name of entries) {
          if (name === '.install-manifest.json' || name.includes('.bak.') || name.includes('.tmp.')) continue;
          const fullPath = path.join(dir, name);
          const relPath = base ? path.join(base, name) : name;
          const stat = fs.lstatSync(fullPath);
          if (stat.isSymbolicLink()) {
            results.push({ rel: relPath.split(path.sep).join('/'), isSymlink: true, fullPath });
          } else if (stat.isDirectory()) {
            results = results.concat(getDiskFiles(fullPath, relPath));
          } else if (stat.isFile()) {
            results.push({ rel: relPath.split(path.sep).join('/'), isSymlink: false, fullPath });
          }
        }
        return results;
      }

      const diskFiles = getDiskFiles(dest);
      const manifestFiles = manifest.files || {};

      for (const [rel, expectedHash] of Object.entries(manifestFiles)) {
        const full = path.join(dest, ...rel.split('/'));
        let stat;
        try {
          stat = fs.lstatSync(full);
        } catch {
          console.log('MODIFIED: deleted ' + rel);
          process.exit(0);
        }

        if (stat.isSymbolicLink()) {
          const actualTarget = 'symlink:' + fs.readlinkSync(full);
          if (actualTarget !== expectedHash) {
            console.log('MODIFIED: changed symlink target ' + rel);
            process.exit(0);
          }
        } else if (stat.isFile()) {
          const actualHash = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
          if (actualHash !== expectedHash) {
            console.log('MODIFIED: changed ' + rel);
            process.exit(0);
          }
        }
      }

      for (const item of diskFiles) {
        if (!(item.rel in manifestFiles)) {
          console.log('EXTRA: ' + item.rel + (item.isSymlink ? ' (user-added symlink)' : ''));
          process.exit(0);
        }
      }

      console.log('CLEAN');
    " "${dest}")

    if [[ "${check_result}" == "CLEAN" ]]; then
      echo "    ℹ️ Clean previous installation detected. Upgrading to new version..."
      return 0
    else
      echo "❌ Error: Destination ${dest} contains user-modified content (${check_result}). Refusing to overwrite without --force." >&2
      return 1
    fi
  else
    # Legacy install without manifest: fallback to diff check against SKILL_SOURCE
    if ! diff -r -q -x "*.bak.*" -x "*.tmp.*" "${dest}" "${source_dir}" >/dev/null 2>&1; then
      echo "❌ Error: Destination ${dest} contains user-modified content. Refusing to overwrite without --force." >&2
      return 1
    fi
    return 0
  fi
}

for dest in "${DESTINATIONS[@]}"; do
  echo "──► Destination: ${dest}"
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "    [Dry Run] Would copy ${SKILL_SOURCE} -> ${dest}"
    continue
  fi

  # Ownership & modification verification before modifying existing destination
  if [[ -e "${dest}" || -L "${dest}" ]]; then
    if [[ -L "${dest}" ]]; then
      # Existing destination is a symbolic link
      if [[ "${FORCE}" != "true" ]]; then
        if [[ ! -f "${dest}/SKILL.md" ]] || ! grep -q "name: engineering-workflow" "${dest}/SKILL.md" 2>/dev/null; then
          echo "❌ Error: Destination ${dest} is a symlink to an unowned target. Pass --force to overwrite." >&2
          exit 1
        fi
      fi
      bak_path="${dest}.bak.$$"
      mv "${dest}" "${bak_path}"
      BACKED_UP_DESTS+=("${bak_path}")
    elif [[ -d "${dest}" ]]; then
      # Existing destination is a directory
      if ! check_existing_destination "${dest}" "${SKILL_SOURCE}" "${FORCE}"; then
        exit 1
      fi

      # Back up existing destination for rollback safety
      bak_path="${dest}.bak.$$"
      mv "${dest}" "${bak_path}"
      BACKED_UP_DESTS+=("${bak_path}")
    fi
  fi

  parent_dir="$(dirname "${dest}")"
  mkdir -p "${parent_dir}"

  # Atomic staging
  tmp_path="${dest}.tmp.$$"
  rm -rf "${tmp_path}"

  if ! cp -R "${SKILL_SOURCE}" "${tmp_path}"; then
    rm -rf "${tmp_path}"
    exit 1
  fi

  # Verify staging integrity
  if [[ ! -f "${tmp_path}/SKILL.md" ]]; then
    echo "❌ Staged skill verification failed at ${tmp_path}" >&2
    rm -rf "${tmp_path}"
    exit 1
  fi

  # Generate installation ownership manifest in staging directory
  generate_install_manifest "${tmp_path}"

  # Atomic move into final location
  if ! mv "${tmp_path}" "${dest}"; then
    exit 1
  fi

  INSTALLED_DESTS+=("${dest}")
  echo "    ✓ Successfully installed to ${dest}"
done

# Verification check
if [[ "${DRY_RUN}" != "true" ]]; then
  echo ""
  echo "🔍 Verifying installed destinations..."
  for dest in "${DESTINATIONS[@]}"; do
    if [[ -f "${dest}/SKILL.md" && -d "${dest}/references" && -f "${dest}/.install-manifest.json" ]]; then
      echo "    ✓ ${dest}/SKILL.md (OK)"
    else
      echo "    ❌ Verification failed: ${dest}/SKILL.md, references/, or .install-manifest.json missing!" >&2
      exit 1
    fi
  done
  SUCCESS=true
  echo "✅ Installation complete and verified!"
fi
