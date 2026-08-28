#!/usr/bin/env -S deno run --allow-read

const ROOT = new URL("../", import.meta.url).pathname;

// Whitelisted files that are allowed to define raw colors/tokens
const WHITELIST_PATTERNS = [
  /\/tokens\//,
  /\/themes\//,
  /\/base\/reset\.css$/,
  /\/packages\/lib\//,
  /\.svg$/,
  /\/preview-icons\.js$/,
  /\/tests\//,
];

async function scanDir(dir, results = []) {
  for await (const entry of Deno.readDir(dir)) {
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === "dist" ||
        entry.name === ".data"
      ) {
        continue;
      }
      await scanDir(fullPath, results);
    } else if (entry.isFile && (entry.name.endsWith(".css") || entry.name.endsWith(".js"))) {
      results.push(fullPath);
    }
  }
  return results;
}

let hasError = false;
const files = await scanDir(ROOT);

// Regex for hardcoded colors
const colorRegex = /(#[0-9a-fA-F]{3,8}\b|rgb\([^)]+\)|hsl\([^)]+\)|oklch\([^)]+\))/g;

for (const file of files) {
  const isWhitelisted = WHITELIST_PATTERNS.some((p) => p.test(file));
  if (isWhitelisted) continue;

  const content = await Deno.readTextFile(file);
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments and imports
    const trimmed = line.trim();
    if (trimmed.startsWith("/*") || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    // Check for raw colors
    const colorMatches = line.match(colorRegex);
    if (colorMatches) {
      // Filter out acceptable occurrences like 0 or inside quotes in tests
      const invalidColors = colorMatches.filter((_c) =>
        !line.includes("color-mix(") || !isWhitelisted
      );
      if (invalidColors.length > 0 && !line.includes("console.log('%c")) {
        console.error(`[check-hardcoded-tokens] Hardcoded color found in ${file}:${i + 1}`);
        console.error(`  Line: ${line.trim()}`);
        hasError = true;
      }
    }
  }
}

if (hasError) {
  console.error(
    "[check-hardcoded-tokens] Failed: Hardcoded colors or tokens detected outside whitelist.",
  );
  Deno.exit(1);
} else {
  console.log("[check-hardcoded-tokens] Passed: All tokens conform to design system.");
  Deno.exit(0);
}
