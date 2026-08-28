#!/usr/bin/env -S deno run --allow-read
// check-sql-concat.js — 拦截模板字符串拼接 SQL（ARCHITECTURE.md 硬规则 5）。
// 扫描 apps/server/src 全部 .js：模板字符串含 SQL 关键字且存在 ${...} 插值即失败，
// 唯一豁免是插值表达式恰为 placeholders（占位符数量的结构性生成，值仍走参数数组，
// docs/Database.md §4.2）。

const ROOT = new URL("..", import.meta.url).pathname;
const SERVER_SRC = `${ROOT}apps/server/src`;
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".data",
  "coverage",
  "tmp",
  ".git",
]);
const SQL_KEYWORD_RE =
  /\b(?:select|insert|update|delete|create|alter|drop|with)\b/i;
const INTERP_RE = /\$\{([^}]*)\}/g;

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
    } else if (entry.isFile && entry.name.endsWith(".js")) {
      yield path;
    }
  }
}

export async function run() {
  const name = "check-sql-concat";
  const messages = [];
  let scanned = 0;

  for await (const file of walk(SERVER_SRC)) {
    scanned++;
    const content = await Deno.readTextFile(file);
    for (const match of content.matchAll(/`(?:\\.|[^`\\])*`/gs)) {
      const literal = match[0];
      if (!SQL_KEYWORD_RE.test(literal)) continue;
      const line = content.slice(0, match.index).split("\n").length;
      for (const interp of literal.matchAll(INTERP_RE)) {
        const expr = interp[1].trim();
        if (expr === "placeholders") continue; // 结构性占位符生成（Database.md §4.2）
        messages.push(
          `${
            file.slice(ROOT.length)
          }:${line}: SQL 模板字符串插值 \${${expr}}（值必须走参数数组）`,
        );
      }
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
