#!/usr/bin/env deno run -A
/**
 * check-hardcoded-tokens.js — 硬编码颜色/圆角/间距/字号字面量扫描（docs/CSS.md §6）。
 *
 * 禁止（非白名单文件中出现即失败）：
 *   - 裸 #hex / rgb( / hsl( / oklch( / color-mix( 颜色字面量；
 *   - 裸 px 用于 border-radius / padding / margin / gap（必须 var(--radius-*)/--space-*）；
 *   - 裸 font-size 数值（必须 var(--text-*)）。
 * 白名单（令牌定义处，允许字面量，docs/CSS.md §6）：
 *   - shared/styles/tokens/*.css、shared/styles/themes/**、shared/styles/base/reset.css；
 *   - 1px/2px 用于 border-width/outline-width；0/100%/1fr/auto 等结构性值；SVG 内联坐标。
 * 范围：apps/web/src 下全部 .css（组件/页面样式随 M3+ 落地后自动纳入扫描）。
 */

const ROOT = import.meta.dirname + "/../apps/web/src";

/** 零依赖递归遍历目录，收集全部 .css 文件 */
async function walkCss(dir) {
  const out = [];
  for await (const entry of Deno.readDir(dir)) {
    const full = dir + "/" + entry.name;
    if (entry.isDirectory) out.push(...await walkCss(full));
    else if (entry.isFile && entry.name.endsWith(".css")) out.push(full);
  }
  return out;
}

/** 白名单：令牌定义处允许颜色/尺寸字面量 */
function isWhitelisted(path) {
  const p = path.replaceAll("\\", "/");
  return p.includes("/shared/styles/tokens/") ||
    p.includes("/shared/styles/themes/") ||
    p.endsWith("/shared/styles/base/reset.css");
}

const COLOR_RE = /#(?:[0-9a-fA-F]{3,8})\b|rgba?\(|hsla?\(|oklch\(|color-mix\(/;
/** 仅文档点名的四类属性（含逻辑属性 longhand，如 padding-inline/margin-block） */
const PX_PROPS =
  /^(?:border-(?:start-end|start-start|end-start|end-end-)?radius|border-radius|padding(?:-inline|block|-top|-bottom|-inline-start|-inline-end|-block-start|-block-end)?|margin(?:-inline|block|-top|-bottom|-inline-start|-inline-end|-block-start|-block-end)?|gap|row-gap|column-gap|inset)$/;

const violations = [];

for (const path of await walkCss(ROOT)) {
  if (isWhitelisted(path)) continue;

  const raw = await Deno.readTextFile(path);
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, ""); // 注释不参与判定

  const declRe = /([a-zA-Z-]+)\s*:\s*([^;{}]+)/g;
  let m;
  while ((m = declRe.exec(css)) !== null) {
    const prop = m[1].toLowerCase();
    const value = m[2].trim();
    const line = raw.slice(0, m.index).split("\n").length;

    if (COLOR_RE.test(value)) {
      violations.push(
        path + ":" + line + " 颜色字面量 → " + prop + ": " + value,
      );
    }
    if (prop === "font-size" && !value.startsWith("var(")) {
      violations.push(
        path + ":" + line + " 裸 font-size → " + prop + ": " + value,
      );
    }
    if (
      PX_PROPS.test(prop) && /\b\d+(?:\.\d+)?px\b/.test(value) &&
      !value.startsWith("var(")
    ) {
      violations.push(path + ":" + line + " 裸 px → " + prop + ": " + value);
    }
  }
}

if (violations.length > 0) {
  console.error("check-hardcoded-tokens: " + violations.length + " 处违规");
  for (const v of violations) console.error("  " + v);
  console.error("需要新字面量时，先在 docs/CSS.md §2/§3 令牌层定义再引用。");
  Deno.exit(1);
}
console.log("check-hardcoded-tokens: OK");
