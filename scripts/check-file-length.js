#!/usr/bin/env -S deno run -A
/**
 * check-file-length.js — 单文件源码 ≤ 500 行（AGENTS 硬规则 7 / ARCHITECTURE §16）。
 *
 * 扫描范围：apps/**、packages/contracts/**、scripts/** 下的 .js/.css/.html。
 * 排除：vendored 产物（packages/lib）、构建产物（dist/.data/coverage）、
 * 生成文件（*.generated.js）、公开静态资产（apps/web/public）。
 */

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/?$/, "/");
const LIMIT = 500;

const SKIP_DIRS = new Set([
  "packages/lib",
  "dist",
  ".data",
  "coverage",
  "node_modules",
  ".git",
  "public",
]);
const SKIP_FILE = /(^|\/)(registry\.generated\.js|\.d\.ts)$/;

async function walk(dir, out) {
  const base = dir.replace(/\/$/, ""); // ROOT 带尾斜杠，避免拼出 // 双斜杠
  for await (const entry of Deno.readDir(dir)) {
    const p = `${base}/${entry.name}`;
    const rel = p.slice(ROOT.length);
    if (entry.isDirectory) {
      if (SKIP_DIRS.has(entry.name) || SKIP_DIRS.has(rel)) continue;
      await walk(p, out);
    } else if (/\.(js|css|html)$/.test(entry.name) && !SKIP_FILE.test(rel)) {
      out.push(p);
    }
  }
}

const files = [];
await walk(ROOT, files);

const offenders = [];
for (const file of files) {
  const content = await Deno.readTextFile(file);
  const lines = content.split("\n").length;
  if (lines > LIMIT) offenders.push({ file: file.slice(ROOT.length), lines });
}

if (offenders.length > 0) {
  console.error(`以下文件超过 ${LIMIT} 行，需按业务逻辑拆分：`);
  for (const { file, lines } of offenders) {
    console.error(`  ${file}（${lines} 行）`);
  }
  Deno.exit(1);
}
console.log(`✓ ${files.length} 个源码文件均 ≤ ${LIMIT} 行`);
