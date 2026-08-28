#!/usr/bin/env -S deno run --allow-read
// check-module-boundaries.js — 拦截跨模块 import（ARCHITECTURE.md 硬规则 2 / §4.3）。
// 规则：apps 下各 src/modules/<id>/ 目录中的任何 .js 文件，import 只允许指向
// shared、本模块自身目录或裸标识符（@shared、hono 等）；解析后落点在
// modules/<other-id>/ 内即失败。前后端两侧都覆盖。
//
// 本脚本自包含（不 import 其他脚本），便于 scripts/tests 临时工作区单独执行。

const ROOT = new URL("..", import.meta.url).pathname;
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".data",
  "coverage",
  "tmp",
  ".git",
]);

async function collectJsFiles(dir, out) {
  let entries;
  try {
    entries = await Array.fromAsync(Deno.readDir(dir));
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      await collectJsFiles(path, out);
    } else if (entry.isFile && /\.js$/.test(entry.name)) {
      out.push(path);
    }
  }
}

// 匹配 import/export ... from "spec"、import "spec"、import("spec")
const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g;

export async function run() {
  const name = "check-module-boundaries";
  const files = [];
  await collectJsFiles(`${ROOT}apps`, files);
  const messages = [];

  for (const file of files) {
    const ownerMatch = file.match(/\/src\/modules\/([^/]+)\//);
    if (!ownerMatch) continue;
    const ownerId = ownerMatch[1];
    const source = await Deno.readTextFile(file);
    for (const match of source.matchAll(IMPORT_RE)) {
      const spec = match[1];
      if (!spec.startsWith(".")) continue; // 裸标识符（@shared、hono 等）另行约束
      const resolved = new URL(spec, `file://${file}`).pathname;
      const targetMatch = resolved.match(/\/src\/modules\/([^/]+)\//);
      if (targetMatch && targetMatch[1] !== ownerId) {
        messages.push(
          `${file.slice(ROOT.length)}: 跨模块 import "${spec}"（${ownerId} → ${
            targetMatch[1]
          }）`,
        );
      }
    }
  }

  return { name, ok: messages.length === 0, messages, scanned: files.length };
}

if (import.meta.main) {
  const result = await run();
  if (!result.ok) {
    console.error(`[${result.name}]`);
    for (const message of result.messages) console.error(`  ${message}`);
    Deno.exit(1);
  }
}
