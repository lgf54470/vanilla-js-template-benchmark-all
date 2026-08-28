#!/usr/bin/env -S deno run --allow-read
// check-workspace-scope.js — 兜底扫描 repository.js 的 workspace_id 谓词
// （ARCHITECTURE.md §16；核心保障是 createScopedRepository(...).forWorkspace()
// 封装器，docs/Workspace.md §3，本脚本是启发式兜底而非第一道防线）。
// 规则：apps/server/src/modules 各模块 repository.js 中每条 DML 模板字符串
// （SELECT/INSERT/UPDATE/DELETE）必须包含 workspace_id；DDL 豁免。

const ROOT = new URL("..", import.meta.url).pathname;
const MODULES_ROOT = `${ROOT}apps/server/src/modules`;
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".data",
  "coverage",
  "tmp",
  ".git",
]);
const DML_RE = /\b(?:select|insert|update|delete)\b/i;
const DDL_RE = /\b(?:create|alter|drop|pragma|index)\b/i;

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
    } else if (entry.isFile && entry.name === "repository.js") {
      yield path;
    }
  }
}

export async function run() {
  const name = "check-workspace-scope";
  const messages = [];
  let scanned = 0;

  for await (const file of walk(MODULES_ROOT)) {
    scanned++;
    const content = await Deno.readTextFile(file);
    for (const match of content.matchAll(/`(?:\\.|[^`\\])*`/gs)) {
      const literal = match[0];
      if (DDL_RE.test(literal) || !DML_RE.test(literal)) continue;
      if (literal.includes("workspace_id")) continue;
      const line = content.slice(0, match.index).split("\n").length;
      messages.push(
        `${
          file.slice(ROOT.length)
        }:${line}: DML 缺少 workspace_id 谓词（必须经 forWorkspace()）`,
      );
    }
  }

  return { name, ok: messages.length === 0, messages, scanned };
}

if (import.meta.main) {
  const result = await run();
  if (!result.ok) {
    console.error(`[${result.name}]`);
    for (const message of result.messages) console.error(`  ${message}`);
    Deno.exit(1);
  }
}
