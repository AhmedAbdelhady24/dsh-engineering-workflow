import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function findMdFiles(dir) {
  let results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === "node_modules" || item.name === ".git") continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(findMdFiles(full));
    } else if (item.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

test("Links validation: all markdown files contain valid, resolvable local links", () => {
  const mdFiles = findMdFiles(rootDir);
  assert(mdFiles.length >= 20, `Must inspect all markdown files in repo (found ${mdFiles.length})`);

  const brokenLinks = [];

  for (const file of mdFiles) {
    const content = fs.readFileSync(file, "utf8");
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const rawTarget = match[2].trim();
      // Skip external links, anchors, and email links
      if (
        rawTarget.startsWith("http://") ||
        rawTarget.startsWith("https://") ||
        rawTarget.startsWith("mailto:") ||
        rawTarget.startsWith("#")
      ) {
        continue;
      }

      // Remove anchor or query strings
      const cleanTarget = rawTarget.split("#")[0].split("?")[0];
      if (!cleanTarget) continue;

      const resolved = path.resolve(path.dirname(file), cleanTarget);
      if (!fs.existsSync(resolved)) {
        brokenLinks.push({
          sourceFile: path.relative(rootDir, file),
          linkText: match[1],
          rawTarget,
          resolvedPath: path.relative(rootDir, resolved),
        });
      }
    }
  }

  assert.equal(
    brokenLinks.length,
    0,
    `Found broken local markdown links: ${JSON.stringify(brokenLinks, null, 2)}`
  );
});
