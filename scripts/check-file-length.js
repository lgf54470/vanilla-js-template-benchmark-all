#!/usr/bin/env -S deno run --allow-read

const ROOT = new URL("../", import.meta.url).pathname;
const MAX_LINES = 500;

// Whitelisted files/directories exempted from the 500-line rule
const WHITELIST_PATTERNS = [
  /\/packages\/lib\//,
  /\/dist\//,
  /\.git\//,
  /\.data\//,
  /\/public\/icons\.svg$/,
  /\/shared\/styles\/themes\/palettes-base\.css$/,
  /\/shared\/ui\/sidebar\/sidebar\.js$/,
];

async function scanFiles(dir, results = []) {
  for await (const entry of Deno.readDir(dir)) {
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === "dist" ||
        entry.name === ".data" ||
        entry.name === "docs"
      ) {
        continue;
      }
      await scanFiles(fullPath, results);
    } else if (entry.isFile) {
      const ext = entry.name.split(".").pop();
      // Source code files only
      if (["js", "css", "html", "sql"].includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const files = await scanFiles(ROOT);
let hasError = false;

for (const file of files) {
  const isWhitelisted = WHITELIST_PATTERNS.some((p) => p.test(file));
  if (isWhitelisted) continue;

  const content = await Deno.readTextFile(file);
  const lineCount = content.split(/\r?\n/).length;

  if (lineCount > MAX_LINES) {
    console.error(
      `[check-file-length] File exceeds ${MAX_LINES} lines: ${file} (${lineCount} lines)`,
    );
    hasError = true;
  }
}

if (hasError) {
  console.error(`[check-file-length] Failed: Some files exceeded ${MAX_LINES} lines.`);
  Deno.exit(1);
} else {
  console.log(
    `[check-file-length] Passed: All source files conform to <= ${MAX_LINES} lines limit.`,
  );
  Deno.exit(0);
}
