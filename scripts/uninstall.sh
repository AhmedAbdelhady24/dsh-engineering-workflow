#!/usr/bin/env bash
# Universal Engineering Workflow Uninstaller / Rollback
# Safely removes the engineering-workflow skill without touching other skills or user files.
set -euo pipefail

TARGET="all"
SCOPE="project"
PROJECT_DIR="$(pwd)"
DRY_RUN=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOCK_SOURCE="${SCRIPT_DIR}/../skill/engineering-workflow"

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
  if [[ -L "${p}" ]]; then
    echo "──► Found symlink: ${p}"
    # Never delete arbitrary symlinks! Verify target does not belong to another skill or project
    if [[ -d "${p}" && -f "${p}/SKILL.md" ]] && ! grep -q "name: engineering-workflow" "${p}/SKILL.md" 2>/dev/null; then
      echo "    ⚠️ Skipping symlink ${p}: Points to an unowned skill (different name in SKILL.md)."
      continue
    fi
    if [[ -d "${p}" && -f "${p}/package.json" ]] && ! grep -q '"engineering-workflow"' "${p}/package.json" 2>/dev/null; then
      echo "    ⚠️ Skipping symlink ${p}: Points to an arbitrary project directory."
      continue
    fi

    if [[ "${DRY_RUN}" == "true" ]]; then
      echo "    [Dry Run] Would remove verified symlink ${p}"
    else
      rm -f "${p}"
      echo "    ✓ Successfully removed symlink ${p}"
    fi
  elif [[ -d "${p}" ]]; then
    echo "──► Found: ${p}"
    # Positive ownership verification: SKILL.md must exist and explicitly declare name: engineering-workflow
    if [[ ! -f "${p}/SKILL.md" ]] || ! grep -q "name: engineering-workflow" "${p}/SKILL.md" 2>/dev/null; then
      echo "    ⚠️ Skipping ${p}: Destination does not contain a verified engineering-workflow skill (unowned directory)."
      continue
    fi

    manifest="${p}/.install-manifest.json"
    if [[ -f "${manifest}" ]]; then
      # Manifest-guided uninstallation:
      # Removes only unmodified files recorded in the manifest; preserves user-added and modified files.
      node -e "
        const fs = require('fs');
        const path = require('path');
        const crypto = require('crypto');

        const targetDir = process.argv[1];
        const dryRun = process.argv[2] === 'true';
        const manifestPath = path.join(targetDir, '.install-manifest.json');

        let manifest;
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        } catch (e) {
          manifest = { files: {} };
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
              // Never traverse symlink targets
              results.push({ rel: relPath.split(path.sep).join('/'), isSymlink: true, fullPath });
            } else if (stat.isDirectory()) {
              results = results.concat(getDiskFiles(fullPath, relPath));
            } else if (stat.isFile()) {
              results.push({ rel: relPath.split(path.sep).join('/'), isSymlink: false, fullPath });
            }
          }
          return results;
        }

        const diskFiles = getDiskFiles(targetDir);
        const manifestFiles = manifest.files || {};
        const removedFiles = [];
        const preservedFiles = [];

        for (const item of diskFiles) {
          const rel = item.rel;
          const full = item.fullPath;
          const isSymlink = item.isSymlink;
          if (rel in manifestFiles) {
            const expected = manifestFiles[rel];
            if (isSymlink) {
              const actualTarget = 'symlink:' + fs.readlinkSync(full);
              if (actualTarget === expected) {
                removedFiles.push(rel);
                if (!dryRun) {
                  fs.unlinkSync(full);
                }
              } else {
                preservedFiles.push(rel + ' (modified symlink target)');
              }
            } else {
              const actualHash = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
              if (actualHash === expected) {
                removedFiles.push(rel);
                if (!dryRun) {
                  fs.unlinkSync(full);
                }
              } else {
                preservedFiles.push(rel + ' (modified by user)');
              }
            }
          } else {
            preservedFiles.push(rel + (isSymlink ? ' (user-added symlink)' : ' (user-added file)'));
          }
        }

        if (!dryRun) {
          if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);

          function cleanEmptyDirs(dir) {
            const entries = fs.readdirSync(dir);
            for (const entry of entries) {
              const full = path.join(dir, entry);
              const stat = fs.lstatSync(full);
              if (stat.isDirectory() && !stat.isSymbolicLink()) {
                cleanEmptyDirs(full);
              }
            }
            if (fs.readdirSync(dir).length === 0 && dir !== targetDir) {
              fs.rmdirSync(dir);
            }
          }
          cleanEmptyDirs(targetDir);

          if (fs.readdirSync(targetDir).length === 0) {
            fs.rmdirSync(targetDir);
            console.log('    ✓ Completely removed ' + targetDir);
          } else {
            console.log('    ⚠️ Preserved user content in ' + targetDir + ':');
            for (const p of preservedFiles) {
              console.log('       - ' + p);
            }
            console.log('    ✓ Cleaned up unmodified skill files while preserving user content.');
          }
        } else {
          console.log('    [Dry Run] Would remove ' + removedFiles.length + ' unmodified files.');
          if (preservedFiles.length > 0) {
            console.log('    [Dry Run] Would preserve ' + preservedFiles.length + ' user files.');
          }
        }
      " "${p}" "${DRY_RUN}"
    else
      # Safe verification and migration process for legacy unmanifested installations
      echo "    ℹ️ Legacy unmanifested installation detected. Running safe verification & migration..."
      node -e "
        const fs = require('fs');
        const path = require('path');
        const crypto = require('crypto');

        const targetDir = process.argv[1];
        const dryRun = process.argv[2] === 'true';
        const stockDir = process.argv[3];

        // Known standard skill files (relative paths)
        const standardFiles = new Set([
          'SKILL.md',
          'skill-registry.json',
          'references/setup.md',
          'references/execute.md',
          'references/review.md',
          'references/ux-audit.md',
          'references/skill-routing.md',
          'references/mcps.md',
          'references/context-recovery.md',
          'references/agent-compatibility.md'
        ]);

        let trustedHashes = {};
        if (stockDir && fs.existsSync(stockDir)) {
          for (const rel of standardFiles) {
            const stockPath = path.join(stockDir, ...rel.split('/'));
            if (fs.existsSync(stockPath) && fs.lstatSync(stockPath).isFile()) {
              trustedHashes[rel] = crypto.createHash('sha256').update(fs.readFileSync(stockPath)).digest('hex');
            }
          }
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
              // Never traverse symlink targets
              results.push({ rel: relPath.split(path.sep).join('/'), isSymlink: true, fullPath });
            } else if (stat.isDirectory()) {
              results = results.concat(getDiskFiles(fullPath, relPath));
            } else if (stat.isFile()) {
              results.push({ rel: relPath.split(path.sep).join('/'), isSymlink: false, fullPath });
            }
          }
          return results;
        }

        const diskFiles = getDiskFiles(targetDir);
        const removedFiles = [];
        const preservedFiles = [];

        for (const item of diskFiles) {
          if (standardFiles.has(item.rel) && !item.isSymlink) {
            if (item.rel in trustedHashes) {
              const diskHash = crypto.createHash('sha256').update(fs.readFileSync(item.fullPath)).digest('hex');
              if (diskHash === trustedHashes[item.rel]) {
                removedFiles.push(item.rel);
                if (!dryRun) {
                  fs.unlinkSync(item.fullPath);
                }
                continue;
              } else {
                preservedFiles.push(item.rel + ' (customized standard file - preserved for manual migration)');
                continue;
              }
            } else {
              // Cannot verify hash against trusted stock source; preserve file!
              preservedFiles.push(item.rel + ' (unverified standard file - preserved for manual migration)');
              continue;
            }
          }
          preservedFiles.push(item.rel + (item.isSymlink ? ' (user-added symlink)' : ' (user-added file)'));
        }

        if (!dryRun) {
          function cleanEmptyDirs(dir) {
            const entries = fs.readdirSync(dir);
            for (const entry of entries) {
              const full = path.join(dir, entry);
              const stat = fs.lstatSync(full);
              if (stat.isDirectory() && !stat.isSymbolicLink()) {
                cleanEmptyDirs(full);
              }
            }
            if (fs.readdirSync(dir).length === 0 && dir !== targetDir) {
              fs.rmdirSync(dir);
            }
          }
          cleanEmptyDirs(targetDir);

          if (fs.readdirSync(targetDir).length === 0) {
            fs.rmdirSync(targetDir);
            console.log('    ✓ Completely removed legacy installation at ' + targetDir);
          } else {
            console.log('    ⚠️ Preserved user content in ' + targetDir + ':');
            for (const p of preservedFiles) {
              console.log('       - ' + p);
            }
            console.log('    ✓ Cleaned up unmodified standard skill files while preserving customized files.');
            console.log('');
            console.log('    📋 Manual Migration Steps:');
            console.log('       1. Review preserved customized files in: ' + targetDir);
            console.log('       2. Back up your customized instructions or configurations.');
            console.log('       3. To reinstall cleanly with an ownership manifest, run: bash scripts/install.sh --force');
          }
        } else {
          console.log('    [Dry Run] Would remove ' + removedFiles.length + ' standard files.');
          if (preservedFiles.length > 0) {
            console.log('    [Dry Run] Would preserve ' + preservedFiles.length + ' user files.');
          }
        }
      " "${p}" "${DRY_RUN}" "${STOCK_SOURCE}"
    fi
  else
    echo "──► Not found: ${p} (Already clean)"
  fi
done

echo "✅ Rollback complete!"
