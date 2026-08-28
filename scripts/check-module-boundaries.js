// scripts/check-module-boundaries.js — 跨模块 import 治理（硬规则 2，§4.3）
//
// 扫描 apps/{web,server}/src/modules/<id>/**/*.js 的 import 语句（静态 import
// 与动态 import()）。模块只允许 import 自己的文件、shared/*、contracts/*；
// 任何解析落进 其它模块目录 的 import 都判违规。跨模块协作只能走
// shared/core/event-bus.js 或 module-registry.js（§4.3）。前后端同时覆盖。
const ROOT = new URL("..", import.meta.url).pathname;
const SIDES = ["apps/web/src", "apps/server/src"];

// 语义路径别名：shorthand → 真实绝对前缀（import map / deno 解析配置）
const ALIASES = [
  ["@shared/", `${ROOT}apps/web/src/shared/`],
  ["@contracts/", `${ROOT}packages/contracts/`],
  ["@contracts", `${ROOT}packages/contracts/constants.js`],
];

function resolveSpecifier(spec, filePath) {
  // 1) 语义别名（import map / deno 解析配置）
  for (const [alias, abs] of ALIASES) {
    if (spec === alias) return abs;
    if (spec.startsWith(alias)) return spec.replace(alias, abs);
  }
  // 2) 相对路径 → 相对本文件所在目录解析为绝对路径
  if (spec.startsWith("./") || spec.startsWith("../") || spec === ".") {
    const dir = filePath.slice(0, filePath.lastIndexOf("/") + 1);
    return new URL(spec, new URL(`file://${dir}`)).pathname;
  }
  // 3) 其它（裸包名 / URL / 绝对）：非模块相对引用，放行
  return null;
}

let failed = false;
let count = 0;

// 真实模块目录名集合（modules/ 下仅目录算模块；生成的 registry.generated.js
// 这类直接落在 modules/ 根的文件不是模块，import 它们不算跨模块）
const moduleNames = new Set();
for (const side of SIDES) {
  for (const e of readDirSafe(`${ROOT}${side}/modules`)) {
    if (e.isDirectory) moduleNames.add(e.name);
  }
}

function otherModuleName(absPath, modulesRoot) {
  // 形如 <modulesRoot>/<id>/... 且 <id> 是真实模块目录 → 违规目标
  if (!absPath.startsWith(modulesRoot)) return null;
  const seg = absPath.slice(modulesRoot.length).split("/").filter(Boolean);
  if (moduleNames.has(seg[0])) return seg[0];
  return null;
}

for (const side of SIDES) {
  const base = `${ROOT}${side}/modules`;
  const modulesRoot = `${base}/`;
  for (const mod of readDirSafe(base)) {
    if (!mod.isDirectory) continue;
    const moduleDir = `${base}/${mod.name}`;
    for (const { file, text } of walkJs(moduleDir)) {
      const rel = file.replace(ROOT, "");
      // 收集 import 说明符（静态 import 与动态 import()）
      const specs = new Set();
      for (
        const m of text.matchAll(
          /import\s+(?:[\w$*{},\s]+?\s+from\s+)?["']([^"']+)["']/g,
        )
      ) {
        specs.add(m[1]);
      }
      for (const m of text.matchAll(/import\s*\(\s*["']([^"']+)["']\s*\)/g)) {
        specs.add(m[1]);
      }
      for (const spec of specs) {
        const abs = resolveSpecifier(spec, file);
        if (!abs) continue;
        // 自己模块内部 / shared / contracts 都放行
        if (abs.startsWith(moduleDir)) continue;
        if (abs.includes("/shared/")) continue;
        if (abs.startsWith(`${ROOT}packages/contracts`)) continue;
        // 落到其它模块？
        const other = otherModuleName(abs, modulesRoot);
        if (other && other !== mod.name) {
          failed = true;
          count += 1;
          console.error(
            `${rel}: 跨模块 import "${mod.name} → ${other}"：${spec}（应走 event-bus / module-registry）`,
          );
        }
      }
    }
  }
}

if (failed) {
  console.error(`[check-module-boundaries] 共 ${count} 处跨模块 import`);
  Deno.exit(1);
}
console.log(
  "[check-module-boundaries] 未发现跨模块 import（前后端模块隔离成立）",
);

function readDirSafe(dir) {
  try {
    return [...Deno.readDirSync(dir)];
  } catch {
    return [];
  }
}
function* walkJs(dir) {
  for (const e of readDirSafe(dir)) {
    const full = `${dir}/${e.name}`;
    if (e.isDirectory) yield* walkJs(full);
    else if (e.isFile && e.name.endsWith(".js")) {
      yield { file: full, text: Deno.readTextFileSync(full) };
    }
  }
}
