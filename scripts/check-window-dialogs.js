#!/usr/bin/env -S deno run --allow-read
// check-window-dialogs.js — 禁止浏览器内置对话框（ARCHITECTURE.md 硬规则 4）。
// 扫描 apps 与 packages/contracts 下 .js/.ts：alert( / confirm( / prompt( 即失败。
// 注意 \b 不匹配 confirmDialog(（confirm 后接词字符，无边界），命名避开全局
// confirm( 的封装函数（如 confirmDialog）不会被误报。
// scripts 下的治理脚本自身包含这些字面量模式，不在扫描范围。

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN_ROOTS = ["apps", "packages/contracts"];
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".data",
  "coverage",
  "tmp",
  ".git",
  "lib",
]);
const DIALOG_RE = /\b(alert|confirm|prompt)\s*\(/;

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
    } else if (entry.isFile && /\.(js|ts)$/.test(entry.name)) {
      yield path;
    }
  }
}

export async function run() {
  const name = "check-window-dialogs";
  const messages = [];
  let scanned = 0;

  for (const root of SCAN_ROOTS) {
    for await (const file of walk(`${ROOT}${root}`)) {
      scanned++;
      const content = await Deno.readTextFile(file);
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (DIALOG_RE.test(lines[i])) {
          messages.push(
            `${file.slice(ROOT.length)}:${i + 1}: 使用了内置对话框 ${
              lines[i].match(DIALOG_RE)[1]
            }(（改用 <ds-dialog>/<ds-toast>）`,
          );
        }
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
