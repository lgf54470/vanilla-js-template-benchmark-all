// scripts/check-file-length.js — 单文件 ≤ 500 行（硬规则 7，ARCHITECTURE.md §1）
// 文档类 .md 不受限；vendored 依赖（packages/lib）与构建产物排除。
const ROOT = new URL("..", import.meta.url);
const MAX_LINES = 500;
const EXCLUDED_DIRS = new Set([
  ".git",
  "lib", // vendored 依赖（packages/lib）——walk 按目录名匹配
  "dist",
  "coverage",
  ".data",
  "node_modules",
  ".wrangler",
  ".vercel",
  ".deployctl",
]);
const EXCLUDED_FILES = new Set(["deno.lock"]);
const INCLUDED_EXT = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".css",
  ".html",
  ".json",
]);

function* walkFiles(dir) {
  for (const entry of Deno.readDirSync(dir)) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      if (!EXCLUDED_DIRS.has(entry.name)) yield* walkFiles(full);
    } else if (entry.isFile) {
      yield full;
    }
  }
}

let failed = false;
let checked = 0;
for (const file of walkFiles(ROOT.pathname)) {
  const base = file.slice(file.lastIndexOf("/") + 1);
  if (EXCLUDED_FILES.has(base)) continue;
  const ext = base.slice(base.lastIndexOf("."));
  if (!INCLUDED_EXT.has(ext)) continue;
  const text = await Deno.readTextFile(file);
  const lines = text.split("\n").length;
  checked += 1;
  if (lines > MAX_LINES) {
    failed = true;
    console.error(
      `${file.replace(ROOT.pathname, "")}: ${lines} 行 > ${MAX_LINES} 行`,
    );
  }
}

if (failed) {
  console.error("[check-file-length] 存在超长文件");
  Deno.exit(1);
}
console.log(`[check-file-length] ${checked} 个文件全部 ≤ ${MAX_LINES} 行`);
