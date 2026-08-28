// scripts/check-window-dialogs.js — 禁原生弹窗治理（硬规则 4，§6.4）
//
// 扫描 apps/web/src/**/*.js，拦截 alert( / confirm( / prompt(（含 window.alert
// 等带前缀写法）。全站弹层一律走 shared/ui 的 <ds-dialog> / <ds-toast>；注释里
// 提到这些方法不误报，字符串/模板里出现也不误报（只认真正调用位）。
const ROOT = new URL("..", import.meta.url).pathname;
const WEB_SRC = `${ROOT}apps/web/src`;

// alert/confirm/prompt 的调用位：单词边界 + 前面不是 . / : （如 el.alert 是
// 合法自定义方法，不得拦截）；注释与字符串已在 strip 阶段剔除。
const CALL = /\b(?:alert|confirm|prompt)\s*\(/g;
const PROP_PREFIX = /[\w$]\.$/;

let failed = false;
let count = 0;
let inBlock = false;

for (const { file, lines } of walkJs(WEB_SRC)) {
  lines.forEach((raw, i) => {
    const code = stripCommentsLine(raw, () => (inBlock = false));
    if (!CALL.test(code)) return;
    CALL.lastIndex = 0;
    let m;
    while ((m = CALL.exec(code)) !== null) {
      const before = code.slice(0, m.index);
      if (PROP_PREFIX.test(before)) continue;
      failed = true;
      count += 1;
      console.error(
        `${file.replace(ROOT, "")}:${i + 1} 禁用原生弹窗 "${
          m[0].slice(0, -1)
        }"（用 <ds-dialog>/<ds-toast>）`,
      );
    }
  });
}

if (failed) {
  console.error(`[check-window-dialogs] 共 ${count} 处原生弹窗调用`);
  Deno.exit(1);
}
console.log("[check-window-dialogs] 未发现 alert/confirm/prompt 调用");

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
      yield { file: full, lines: Deno.readTextFileSync(full).split("\n") };
    }
  }
}
/** 去注释 + 掏空字符串内容（块注释跨行用 inBlock 跟踪）；
 * 字符串/注释里的 alert( 不算调用，必须剔除避免误报。 */
function stripCommentsLine(line, onBlockClosed) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < line.length) {
    const c = line[i];
    const n = line[i + 1];
    if (quote) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (inBlock) {
      if (c === "*" && n === "/") {
        inBlock = false;
        onBlockClosed();
        i += 2;
      } else i += 1;
      continue;
    }
    if (c === "/" && n === "/") break;
    if (c === "/" && n === "*") {
      inBlock = true;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      out += c;
      quote = c;
      i += 1;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}
