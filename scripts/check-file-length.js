// 硬规则 6：源码单文件 ≤ 500 行。文档（.md/.mdx）与 vendored 代码（packages/lib）
// 不在约束范围内；.githooks、CI 配置等非源码文件不扫描。packages/contracts 例外扫描。
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const MAX_LINES = 500;
const SCAN_EXT = /\.(js|mjs|cjs|ts|css|html|svg|json|jsonc|yaml|yml)$/;
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".data",
  "dist",
  "coverage",
  "packages", // vendored 上游源码不受本项目行数约束
  "docs", // 文档类 .md 不受此约束（ARCHITECTURE §1 第 6 条）
  ".workbuddy",
]);
// packages/contracts 是本项目自有代码，例外放行：跳过 packages 本体、仅扫描 contracts。
const offenders = [];

async function scan(dir) {
  for await (const entry of Deno.readDir(dir)) {
    const full = join(dir, entry.name);
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    if (entry.isDirectory) {
      if (rel === "packages") {
        await scan(join(full, "contracts"));
        continue;
      }
      if (SKIP_DIRS.has(entry.name)) continue;
      await scan(full);
      continue;
    }
    if (!SCAN_EXT.test(entry.name)) continue;
    const text = await Deno.readTextFile(full);
    const lineCount = text.split("\n").length;
    if (lineCount > MAX_LINES) {
      offenders.push({ rel, lineCount });
    }
  }
}

await scan(ROOT);

if (offenders.length > 0) {
  console.error(`check-file-length: 以下源码文件超过 ${MAX_LINES} 行：`);
  for (const o of offenders) {
    console.error(
      `  - ${o.rel}（${o.lineCount} 行，超出 ${o.lineCount - MAX_LINES}）`,
    );
  }
  console.error(
    "按业务逻辑拆分（组件 → component/template/handlers，模块 → 子文件）。",
  );
  process.exit(1);
}
console.log("check-file-length: 通过");
