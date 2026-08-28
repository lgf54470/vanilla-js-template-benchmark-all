// scripts/check-workspace-scope.js — 工作空间隔离兜底治理（硬规则 6，Workspace.md §3）
//
// 业务表 = apps/server/src/modules/<id>/migrations/ 里 CREATE TABLE 定义的表
// （<module>_<name> 命名，带 workspace_id）。系统表（core_* / app_settings，
// 由 shared 专属模块封装）不属于本检查范围。
//
// 规则：在所有 apps/server/src/**/*.js 源码里，业务表名只能作为
// `createScopedRepository(db, "<table>")` 的实参出现（结构性隔离的入口）。
// 任何其它环境（裸 `FROM notes_note`、`INSERT INTO`、字符串拼接等）即违规。
const ROOT = new URL("..", import.meta.url).pathname;
const MODULES_DIR = `${ROOT}apps/server/src/modules`;
const SERVER_SRC = `${ROOT}apps/server/src`;

// 1) 从各模块迁移 SQL 收集业务表名
const tableNames = new Set();
for (const mod of readDirSafe(MODULES_DIR)) {
  if (!mod.isDirectory) continue;
  const migDir = `${MODULES_DIR}/${mod.name}/migrations`;
  for (const sql of readDirSafe(migDir)) {
    if (!sql.isFile || !sql.name.endsWith(".sql")) continue;
    const text = await Deno.readTextFile(`${migDir}/${sql.name}`);
    for (
      const m of text.matchAll(
        /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-z0-9_]+)\s*\(/g,
      )
    ) {
      tableNames.add(m[1]);
    }
  }
}

const tbl = [...tableNames].sort();
if (tbl.length === 0) {
  console.log("[check-workspace-scope] 0 个业务表，跳过");
  Deno.exit(0);
}
const anyTable = new RegExp(`\\b(?:${tbl.join("|")})\\b`);
const globalTable = new RegExp(anyTable.source, "g");
const entryRe = new RegExp(
  `createScopedRepository\\s*\\(\\s*[\\w$.]+\\s*,\\s*"(?:${
    tbl.join("|")
  })"\\s*\\)`,
  "g",
);

// 2) 逐行扫描：去掉注释与字符串内"伪表名"后再核对，
//    剥离入口调用后仍出现的表名引用即裸访问违规。
let failed = false;
let violations = 0;
let inBlock = false;

for (const { file, lines } of walkJs(SERVER_SRC)) {
  const relevant = lines.some((ln) => anyTable.test(ln));
  if (!relevant) continue;
  lines.forEach((raw, i) => {
    const code = stripCommentsLine(raw, () => (inBlock = false));
    if (!anyTable.test(code)) return;
    const cleaned = code.replace(entryRe, "");
    if (!anyTable.test(cleaned)) return;
    for (const m of cleaned.matchAll(globalTable)) {
      failed = true;
      violations += 1;
      console.error(
        `${file.replace(ROOT, "")}:${i + 1} 业务表 "${
          m[0]
        }" 出现未经 createScopedRepository 的裸访问引用`,
      );
    }
  });
}

if (failed) {
  console.error(`[check-workspace-scope] 共 ${violations} 处业务表裸访问违规`);
  Deno.exit(1);
}
console.log(
  `[check-workspace-scope] 业务表 ${
    tbl.join(", ")
  } 全部只见于 createScopedRepository 入口`,
);

// ---- 工具 ----

function readDirSafe(dir) {
  try {
    return [...Deno.readDirSync(dir)];
  } catch {
    return [];
  }
}

/** 深度遍历源码，按行切分，返回 { file, lines } */
function* walkJs(dir) {
  for (const e of readDirSafe(dir)) {
    const full = `${dir}/${e.name}`;
    if (e.isDirectory) {
      yield* walkJs(full);
    } else if (e.isFile && e.name.endsWith(".js")) {
      yield { file: full, lines: Deno.readTextFileSync(full).split("\n") };
    }
  }
}

/**
 * 只去除注释（行注释与块注释），**保留字符串内容**——这样裸 SQL 字符串里的
 * 业务表名仍可见不误吞；而注释里提到表名不会误报。
 * 块注释跨行时用 inBlock 状态跨行跟踪。
 */
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
      } else {
        i += 1;
      }
      continue;
    }
    if (c === "/" && n === "/") break; // 行注释：其后全部丢弃
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
