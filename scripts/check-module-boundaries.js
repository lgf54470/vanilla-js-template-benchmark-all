#!/usr/bin/env -S deno run -A
/**
 * check-module-boundaries.js — 禁止跨模块 import（AGENTS 硬规则 2 / ARCHITECTURE §4.3）。
 *
 * 扫描 apps/{web,server}/src/modules/<id>/ 下所有 .js 的 import/export-from 语句：
 * - 模块 A → 兄弟模块 B（相对路径跳出自身模块目录）：禁止；
 * - 模块 → app/shell 内部实现：禁止（壳由 module.json 驱动，反向依赖会形成环）。
 * 跨模块协作只允许 shared/core/event-bus.js 与 module-registry.js 两条通道。
 */

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/?$/, "/");
const MODULES_DIRS = [
  `${ROOT}apps/web/src/modules`,
  `${ROOT}apps/server/src/modules`,
];
const IMPORT_RE = /\b(?:import|export)\b[^'"]*from\s*["']([^"']+)["']/g;

async function walk(dir, out) {
  for await (const entry of Deno.readDir(dir)) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory) await walk(p, out);
    else if (/\.js$/.test(entry.name)) out.push(p);
  }
}

const violations = [];

for (const modulesDir of MODULES_DIRS) {
  const files = [];
  try {
    await walk(modulesDir, files);
  } catch {
    continue; // 里程碑早期目录尚不存在
  }

  for (const file of files) {
    const rel = file.slice(ROOT.length);
    // 本模块 id = modules/<id>/ 下的第一段
    const m = rel.match(/^apps\/(web|server)\/src\/modules\/([^/]+)\//);
    if (!m) continue;
    const selfId = m[2];
    const selfPrefix = `apps/${m[1]}/src/modules/${selfId}/`;

    const source = await Deno.readTextFile(file);
    for (const match of source.matchAll(IMPORT_RE)) {
      const spec = match[1];
      if (!spec.startsWith(".")) continue;
      // 解析相对路径 → 仓库内绝对路径（规范化）
      const parts = rel.split("/").slice(0, -1);
      for (const seg of spec.split("/")) {
        if (seg === ".") continue;
        else if (seg === "..") parts.pop();
        else parts.push(seg);
      }
      const target = parts.join("/") + "/";

      // 1) 跳出自身模块目录 → 兄弟模块
      if (
        target.startsWith("apps/") && !target.startsWith(selfPrefix) &&
        /^apps\/[^/]+\/src\/modules\/[^/]+\/.+$/.test(target)
      ) {
        violations.push(
          `${rel}: 跨模块 import "${spec}"（改用 event-bus / module-registry）`,
        );
      }
      // 2) 模块 → app/shell 内部
      if (target.startsWith("apps/") && target.includes("/src/app/shell/")) {
        violations.push(`${rel}: 模块依赖壳内部实现 "${spec}"`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("发现跨模块 import 违规：");
  for (const v of violations) console.error(`  ${v}`);
  Deno.exit(1);
}
console.log("✓ 模块边界检查通过（无跨模块 import）");
