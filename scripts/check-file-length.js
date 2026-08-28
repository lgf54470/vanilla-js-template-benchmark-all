#!/usr/bin/env -S deno run --allow-read
// check-file-length.js — 单文件源码 ≤ 500 行（ARCHITECTURE.md 硬规则 7）。
// 扫描 apps、packages/contracts、scripts 下的 .js/.ts/.css；
// 跳过 node_modules/dist/.data/coverage/tmp 与 packages/lib
// （vendored 第三方源码不受治理约束，docs/Vendoring.md）。

const ROOT = new URL("..", import.meta.url).pathname;
const MAX_LINES = 500;
const SCAN_ROOTS = ["apps", "packages/contracts", "scripts"];
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".data",
  "coverage",
  "tmp",
  ".git",
  "lib", // packages/lib（vendored）
]);
const EXTS = new Set([".js", ".ts", ".css"]);

function extname(name) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot);
}

async function* walk(dir) {
  let entries;
  try {
    entries = await Array.fromAsync(Deno.readDir(dir));
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(path);
    } else if (entry.isFile && EXTS.has(extname(entry.name))) {
      yield path;
    }
  }
}

export async function run() {
  const name = "check-file-length";
  const messages = [];
  let scanned = 0;

  for (const root of SCAN_ROOTS) {
    for await (const file of walk(`${ROOT}${root}`)) {
      scanned++;
      const content = await Deno.readTextFile(file);
      const lines = content.split("\n").length -
        (content.endsWith("\n") ? 1 : 0);
      if (lines > MAX_LINES) {
        messages.push(
          `${file.slice(ROOT.length)}: ${lines} 行 > ${MAX_LINES}`,
        );
      }
    }
  }

  return { name, ok: messages.length === 0, messages, scanned };
}

if (import.meta.main) {
  const result = await run();
  if (!result.ok) {
    console.error(`[${result.name}] 超限文件：`);
    for (const message of result.messages) console.error(`  ${message}`);
    Deno.exit(1);
  }
}
