#!/usr/bin/env -S deno run --allow-read
// check-hardcoded-tokens.js — 拦截组件/页面 CSS 中的裸颜色、圆角、间距、字号字面量
// （ARCHITECTURE.md 硬规则 3，判定依据 docs/CSS.md §6）。
//
// 白名单（令牌定义处，允许字面量）：
//   - apps/web/src/shared/styles/tokens/ 整个目录
//   - apps/web/src/shared/styles/themes/ 整个目录
//   - apps/web/src/shared/styles/base/reset.css
// 其余 CSS 一律禁止：hex / rgb( / hsl( / oklch( 等颜色字面量；
// padding/margin/gap/border-radius/inset 出现 px/rem 字面量；
// font-size 未使用 var(--text-*)。

const ROOT = new URL("..", import.meta.url).pathname;
const CSS_ROOT = `${ROOT}apps/web/src`;
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);

function isWhitelisted(relPath) {
  return relPath.includes("/shared/styles/tokens/") ||
    relPath.includes("/shared/styles/themes/") ||
    relPath === "apps/web/src/shared/styles/base/reset.css";
}

const COLOR_RE =
  /(?:^|[\s:(,])#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\s*\(/;
// padding / margin / gap / border-radius / inset（含逻辑属性变体）出现 px/rem
const SPACING_PROP_RE =
  /^(padding|margin|gap|row-gap|column-gap|border-radius|inset)(?:-[a-z-]+)?\s*:/;
const PX_RE = /(?<![\w.])(?:\d*\.)?\d+(?:px|rem)\b/;
const FONT_SIZE_RE = /^font-size\s*:\s*([^;]+);?$/;

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
    } else if (entry.isFile && entry.name.endsWith(".css")) {
      yield path;
    }
  }
}

export async function run() {
  const name = "check-hardcoded-tokens";
  const messages = [];
  let scanned = 0;

  for await (const file of walk(CSS_ROOT)) {
    const relPath = file.slice(ROOT.length);
    scanned++;
    if (isWhitelisted(relPath)) continue;
    const content = await Deno.readTextFile(file);
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;
      if (COLOR_RE.test(line)) {
        messages.push(
          `${relPath}:${lineNo}: 裸颜色字面量（用 --color-* 语义层）`,
        );
        continue;
      }
      const propMatch = line.match(SPACING_PROP_RE);
      if (propMatch && PX_RE.test(line)) {
        messages.push(
          `${relPath}:${lineNo}: \`${
            propMatch[1]
          }\` 使用 px/rem 字面量（用 --space-*/--radius-*）`,
        );
        continue;
      }
      const fontSizeMatch = line.match(FONT_SIZE_RE);
      if (
        fontSizeMatch && !fontSizeMatch[1].includes("var(--") &&
        !/^\s*(?:inherit|larger|smaller)\s*$/.test(fontSizeMatch[1])
      ) {
        messages.push(
          `${relPath}:${lineNo}: font-size 字面量（用 --text-* 刻度）`,
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
