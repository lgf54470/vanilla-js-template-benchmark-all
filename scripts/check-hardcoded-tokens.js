#!/usr/bin/env -S deno run -A
/**
 * check-hardcoded-tokens.js — 裸颜色/圆角/间距字面量检查（AGENTS 硬规则 3 /
 * ARCHITECTURE §16 / docs/CSS.md §6）。
 *
 * 扫描 apps/web/src 下所有 .css；白名单（令牌定义处）跳过：
 *   tokens/*.css、styles/themes/**、base/reset.css。
 * 拦截：#hex / rgb( / hsl( / oklch( / color(；border-radius|padding|margin|gap
 * 里的 px 字面量（0 除外）；font-size 裸数值。1px/2px 描边宽度、结构性值
 * （0/100%/1fr/auto）、var() 引用不受影响。SVG 坐标（public/*.svg）不在扫描范围。
 */

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/?$/, "/");
const SCAN_DIR = `${ROOT}apps/web/src`;

const BANNED_FUNC = /\b(?:rgba?|hsla?|oklch|color)\s*\(/;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const PX_PROPS =
  /(?:^|[\s;])(?:border-radius|padding(?:-block|-inline|-top|-right|-bottom|-left)?|margin(?:-block|-inline|-top|-right|-bottom|-left)?|gap|row-gap|column-gap)\s*:\s*([^;]+);/;
const FONT_SIZE_NUM = /font-size\s*:\s*\d/;

async function walk(dir, out) {
  for await (const entry of Deno.readDir(dir)) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory) await walk(p, out);
    else if (/\.css$/.test(entry.name)) out.push(p);
  }
}

const files = [];
await walk(SCAN_DIR, files);

const violations = [];
let checked = 0;
for (const file of files) {
  const rel = file.slice(ROOT.length);
  // 白名单：令牌定义处（相对路径判断，路径分隔符统一为 /）
  const norm = rel.replaceAll("\\", "/");
  if (
    /\/tokens\/[^/]+\.css$/.test(norm) ||
    /\/styles\/themes\//.test(norm) ||
    /\/base\/reset\.css$/.test(norm)
  ) {
    continue;
  }
  checked++;

  const source = await Deno.readTextFile(file);
  // 逐行扫描并跟踪 /* */ 注释块（注释内的示例不判违规）
  let inComment = false;
  for (const [i, line] of source.split("\n").entries()) {
    let code = "";
    let rest = line;
    while (rest.length > 0) {
      if (inComment) {
        const end = rest.indexOf("*/");
        if (end === -1) {
          rest = "";
        } else {
          inComment = false;
          rest = rest.slice(end + 2);
        }
      } else {
        const start = rest.indexOf("/*");
        if (start === -1) {
          code += rest;
          rest = "";
        } else {
          code += rest.slice(0, start);
          inComment = true;
          rest = rest.slice(start + 2);
        }
      }
    }
    if (code.trim() === "") continue;

    const flag = (why) =>
      violations.push(`${rel}:${i + 1}: ${why}\n    ${line.trim()}`);
    if (BANNED_FUNC.test(code)) flag("裸颜色函数（用 --color-* 语义令牌）");
    if (HEX.test(code)) flag("裸 #hex 颜色");
    const px = code.match(PX_PROPS);
    if (px && /\b\d+px\b/.test(px[1].replaceAll("0px", ""))) {
      flag("圆角/间距用了 px 字面量（用 --radius-*/--space-*）");
    }
    if (FONT_SIZE_NUM.test(code)) flag("font-size 裸数值（用 --text-*）");
  }
}

if (violations.length > 0) {
  console.error(`发现 ${violations.length} 处硬编码令牌：`);
  for (const v of violations) console.error(`  ${v}`);
  Deno.exit(1);
}
console.log(`✓ ${checked} 个非白名单样式文件无硬编码令牌`);
