// scripts/check-sql-concat.js — 禁字符串拼接 SQL 治理（硬规则 5，§9.4）
//
// 规则：SQL 一律 `?` 占位符 + 参数数组，禁止把「运行时值」内联进 SQL 文本。
// 启发式（非完整 AST，兜底手段；Docs AGENTS 表格同列示范即承认启发式）：
//   在含 SQL 关键字（SELECT/INSERT/UPDATE/DELETE 等）的 server 源码行中，`${expr}`
//   出现在「值位置」（= / < > / LIKE / BETWEEN / IN ( / VALUES ( 之后）即违规；
//   唯一豁免 Database.md §4.2 的占位符数量生成（${placeholders} 等 `?` 序列），
//   以及标识符/列名位置（UPDATE ... SET ${setClause}）。注释与字符串外套剔除后，
//   `${expr}` 一定在真实 SQL 文本里才判定。
const ROOT = new URL("..", import.meta.url).pathname;
const SERVER_SRC = `${ROOT}apps/server/src`;

const SQL_KW =
  /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN|VALUES|SET|INTO|GROUP|ORDER|HAVING|LIMIT)\b/i;

// 值位置前导：后接空格可能与 `${` 紧邻
const VALUE_PRECEED =
  /(\bIN\s*\(|\bVALUES\s*\(|=|<>|!=|>=|<=|>|<|\bLIKE\b|\bILIKE\b|\bBETWEEN\b)[\s]*$/;
const PLACEHOLDER_EXPR =
  /["']?\?["']?|placeholders|\.map\s*\(|\.fill\s*\(|\.join\s*\(|Array\s*\(|=>\s*["']?[?][?]?/;

let failed = false;
let count = 0;
let inBlock = false;

for (const { file, lines } of walkJs(SERVER_SRC)) {
  lines.forEach((raw, i) => {
    const code = stripCommentsLine(raw, () => (inBlock = false));
    if (!SQL_KW.test(code)) return;
    // 逐个 ${...} 段，检查其前导是否是值位置
    for (const m of code.matchAll(/\$\{([^}]*)\}/g)) {
      const before = code.slice(0, m.index);
      const m2 = VALUE_PRECEED.exec(before);
      if (!m2) continue; // 非值位置（标识符/列名/占位符等），放行
      const expr = m[1].trim();
      // 豁免：IN ( / VALUES ( 下的占位符数量生成（Database.md §4.2）
      if (m2[1].match(/\bIN\s*\($/) || m2[1].match(/\bVALUES\s*\($/)) {
        if (PLACEHOLDER_EXPR.test(expr)) continue;
      }
      // 豁免：比较运算符后紧跟的是纯 ?（如 `x = ${hasRest ? "?" : "?"}` 罕见，
      // 这里保守只放行显式 ?）
      if (PLACEHOLDER_EXPR.test(expr)) continue;
      failed = true;
      count += 1;
      console.error(
        `${file.replace(ROOT, "")}:${
          i + 1
        } SQL 值位置内联 "\${${expr}}"（应用参数数组 ? 占位）`,
      );
    }
  });
}

if (failed) {
  console.error(`[check-sql-concat] 共 ${count} 处 SQL 值内联`);
  Deno.exit(1);
}
console.log(
  "[check-sql-concat] 未发现 SQL 值位置内联（参数化成立）",
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
      yield { file: full, lines: Deno.readTextFileSync(full).split("\n") };
    }
  }
}
/** 去注释保留字符串内容（SQL 就写在字符串/模板里，字符串必须保留）。 */
function stripCommentsLine(line, onBlockClosed) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < line.length) {
    const c = line[i];
    const n = line[i + 1];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += n ?? "";
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
