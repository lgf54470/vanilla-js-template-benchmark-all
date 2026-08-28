// 硬规则 3（docs/CSS.md §6）：组件/页面 CSS 禁止裸颜色与裸尺寸字面量，
// 一律消费令牌（--color-*/--ds-*/--space-*/--radius-*/--text-*/--shadow-*）。
// 白名单（令牌定义处允许字面量）：shared/styles/tokens/、shared/styles/themes/、
// base/reset.css；1px/2px 用于 border-width/outline-width；0、结构性值。
// 只扫 CSS（JS 内联样式出现时再扩）；本文件是判定依据 docs/CSS.md §6 的实现。
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const SCAN_ROOTS = ["apps"];
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".data",
  "dist",
  "coverage",
  "packages", // vendored 上游源码不扫
  "docs",
  ".workbuddy",
]);

// 相对 ROOT 的白名单路径前缀（令牌定义处，允许颜色/尺寸字面量）
const WHITELIST_PREFIXES = [
  "apps/web/src/shared/styles/tokens/",
  "apps/web/src/shared/styles/themes/",
  "apps/web/src/shared/styles/base/reset.css",
];

// 颜色字面量：#hex / rgb( / hsl( / oklch( （含 color-mix 内联色）
const COLOR_LITERAL =
  /(^|[^\w-])(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklcha?\()/;

// 尺寸字面量：radius/padding/margin/gap 族属性出现 px（0px 视为结构性零，放行）
const SPACING_PROPERTY =
  /^\s*[a-z-]*(border-radius|padding|margin|gap)[a-z-]*\s*:\s*([^;]+);/;

// 字号字面量：font-size 出现 px/rem 数值（必须 var(--text-*)）
const FONT_SIZE_LITERAL = /^\s*font-size\s*:\s*([^;]+);/;
const LITERAL_FONT_VALUE = /(?:^|[\s(,])(?:\d*\.?\d+)(?:px|rem)\b/;

// 允许 1px/2px 的属性（border/outline 宽度，含 shorthand）
const BORDER_WIDTH_PROPERTY =
  /^\s*(border|outline)(-(width|top|right|bottom|left|inline|block))?\s*:\s*([^;]+);/;
const OK_THIN_WIDTH = /(?:^|\s|,)(?:1|2)px\b/;

/** 去掉 CSS 块注释，避免令牌文件自身的说明文字被误报。 */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

function isWhitelisted(rel) {
  return WHITELIST_PREFIXES.some((p) => rel === p || rel.startsWith(p));
}

const offenders = [];

function checkFile(rel, text) {
  const css = stripComments(text);
  const lines = css.split("\n");
  lines.forEach((line, idx) => {
    const lineno = idx + 1;
    const report = (reason) =>
      offenders.push({ rel, lineno, line: line.trim(), reason });

    const colorMatch = line.match(COLOR_LITERAL);
    if (colorMatch) {
      report("裸颜色字面量（用 --color-* / --chart-N / --swatch-*）");
    }

    const spacing = line.match(SPACING_PROPERTY);
    if (spacing) {
      const value = spacing[2];
      const pxNums = [...value.matchAll(/(\d*\.?\d+)px\b/g)].map((m) => m[1]);
      const hasPx = pxNums.some((n) => Number(n) !== 0); // 0px 视为结构性零
      if (hasPx) {
        report("radius/padding/margin/gap 出现 px（用 --space-*/--radius-*）");
      }
    }

    const font = line.match(FONT_SIZE_LITERAL);
    if (font && LITERAL_FONT_VALUE.test(font[1])) {
      report("font-size 出现数值字面量（用 --text-*）");
    }

    const border = line.match(BORDER_WIDTH_PROPERTY);
    if (border) {
      const pxValues = border[4].match(/(?:\d*\.?\d+)px\b/g) ?? [];
      const bad = pxValues.filter((v) => !OK_THIN_WIDTH.test(v));
      if (bad.length > 0) {
        report(`border/outline 宽度只允许 1px/2px（发现：${bad.join(", ")}）`);
      }
    }
  });
}

async function scan(dir) {
  for await (const entry of Deno.readDir(dir)) {
    const full = join(dir, entry.name);
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    if (entry.isDirectory) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await scan(full);
      continue;
    }
    if (!/\.(css)$/.test(entry.name)) continue;
    if (isWhitelisted(rel)) continue;
    checkFile(rel, await Deno.readTextFile(full));
  }
}

for (const root of SCAN_ROOTS) await scan(join(ROOT, root));

if (offenders.length > 0) {
  console.error("check-hardcoded-tokens: 发现裸字面量（docs/CSS.md §6）：");
  for (const o of offenders) {
    console.error(`  - ${o.rel}:${o.lineno} ${o.reason}`);
    console.error(`      ${o.line}`);
  }
  console.error(
    "令牌不足时先在 shared/styles/{tokens,themes} 增补令牌再引用，勿内联字面量。",
  );
  process.exit(1);
}
console.log("check-hardcoded-tokens: 通过");
