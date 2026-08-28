// scripts/check-hardcoded-tokens.js — 禁止硬编码颜色/圆角/间距/字号字面量
//
// 判定依据 docs/CSS.md §6：
//   禁止：裸 hex 颜色、rgb 函数、hsl 函数、oklch 函数；裸 px 用于圆角/间距/字号
//         （border-radius、padding、margin、gap、font-size）。
//   白名单：tokens/*.css、themes/**、base/reset.css（令牌定义处）；1px/2px 用于
//         border-width/outline-width；0/100%/1fr/auto 等结构性值；SVG 内联坐标（.svg
//         文件整体跳过）；媒体查询 px（Layout.md §2 明确允许）。
// 注意：本文件自身会被扫描（scripts/ 属于源码），注释中不要出现会被规则命中的字面量。
import { walk } from "./_walk.js";

const ROOT = new URL("..", import.meta.url);
const SKIP_DIRS = new Set([
  ".git",
  "lib", // vendored 依赖（packages/lib）——walk 按目录名匹配
  "dist",
  "coverage",
  ".data",
  "node_modules",
  "docs",
  ".github",
  ".wrangler",
  ".vercel",
  ".deployctl",
  "tmp",
]);
const INCLUDED_EXT = new Set([".js", ".mjs", ".ts", ".css", ".html"]);

/** 令牌定义处白名单 */
function isWhitelisted(file) {
  const rel = file.replace(ROOT.pathname, "");
  return (
    /\/shared\/styles\/tokens\/[^/]+\.css$/.test(rel) ||
    /\/shared\/styles\/themes\/[^/]+\.css$/.test(rel) ||
    rel.endsWith("/shared/styles/base/reset.css")
  );
}

const PATTERNS = [
  {
    re: /#[0-9a-fA-F]{3,8}\b/g,
    what: "hex 颜色字面量",
  },
  {
    re: /\b(?:rgba?|hsla?|oklch)\(/g,
    what: "rgb/hsl/oklch 颜色函数",
  },
  {
    re:
      /(?:border-radius|border-(?:start|end)-(?:start|end)-radius):\s*[0-9.]+px/g,
    what: "px 圆角（应使用 var(--radius-*)）",
  },
  {
    re: /(?:padding|margin|gap)[\w-]*:\s*[0-9.]+px/g,
    what: "px 间距（应使用 var(--space-*)）",
  },
  {
    re: /font-size:\s*[0-9.]+px/g,
    what: "px 字号（应使用 var(--text-*)）",
  },
];

let failed = false;
let checked = 0;
for (const entry of walk(ROOT.pathname, { skipDirs: SKIP_DIRS })) {
  if (entry.isDirectory) continue;
  const rel = entry.path.replace(ROOT.pathname, "");
  // scripts/tests 下的 fixture 故意包含违规字面量（负向用例），跳过
  if (rel.startsWith("/scripts/tests/")) continue;
  const base = rel.slice(rel.lastIndexOf("/") + 1);
  const ext = base.slice(base.lastIndexOf("."));
  if (!INCLUDED_EXT.has(ext)) continue;
  if (isWhitelisted(rel)) continue;
  const text = await Deno.readTextFile(entry.path);
  checked += 1;
  for (const { re, what } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      failed = true;
      const line = text.slice(0, m.index).split("\n").length;
      const snippet = text.slice(m.index, m.index + 60).split("\n")[0];
      console.error(`${rel}:${line}: ${what}（"${snippet.trim()}"）`);
    }
  }
}

if (failed) {
  console.error(
    "[check-hardcoded-tokens] 存在硬编码字面量，请改用设计令牌（docs/CSS.md §6）",
  );
  Deno.exit(1);
}
console.log(`[check-hardcoded-tokens] ${checked} 个文件无硬编码字面量`);
