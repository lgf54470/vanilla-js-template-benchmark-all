// scripts/tests/check-sql-concat.test.js — check-sql-concat 行为级测试
// 正向：全 `?` 参数化 + Database.md §4.2 占位符数量生成的模板通过；反向：
// 值位置内联 ${...}（WHERE id = ${val}）报错；未传参数数组的裸拼接也报错。
import {
  assertResult,
  runCheck,
  withWorkspace,
} from "./helpers/check-runner.js";

const PARAM_OK = {
  "apps/server/src/modules/notes/repository.js":
    `import { createScopedRepository } from "../../shared/db/scoped-repository.js";
export function createNotesRepository(db) {
  const scoped = createScopedRepository(db, "notes_note");
  return {
    forWorkspace(id) {
      const repo = scoped.forWorkspace(id);
      return {
        list() {
          return repo.list("AND tag = ? ORDER BY updated_at DESC", ["生活"]);
        },
      };
    },
  };
}
`,
  "apps/server/src/shared/db/scoped-repository.js":
    `export function createScopedRepository(db, table) {
  return { forWorkspace() {} };
}
`,
};

const IN_PLACEHOLDER = {
  "apps/server/src/modules/notes/repository.js":
    `import { createScopedRepository } from "../../shared/db/scoped-repository.js";
export function r(db) {
  const ids = [1, 2, 3];
  const placeholders = ids.map(() => "?").join(",");
  return db.query(
    \`SELECT * FROM notes_note WHERE workspace_id = ? AND id IN (\${placeholders})\`,
    ["ws", ...ids],
  );
}
`,
  "apps/server/src/shared/db/scoped-repository.js":
    "export function createScopedRepository() {}\n",
};

Deno.test("check-sql-concat 正向：全占位符参数化通过", async () => {
  await withWorkspace(PARAM_OK, async (ws) => {
    const res = await runCheck(ws, "check-sql-concat.js");
    assertResult(res, 0, "未发现 SQL 值位置内联");
  });
});

Deno.test("check-sql-concat 正向：IN (${placeholders}) 占位符生成不报错（§4.2）", async () => {
  await withWorkspace(IN_PLACEHOLDER, async (ws) => {
    const res = await runCheck(ws, "check-sql-concat.js");
    assertResult(res, 0, "未发现 SQL 值位置内联");
  });
});

Deno.test("check-sql-concat 反向：WHERE id = ${val} 值内联报错", async () => {
  await withWorkspace({
    "apps/server/src/modules/notes/repository.js":
      `import { createScopedRepository } from "../../shared/db/scoped-repository.js";
export function r(db) {
  const input = readInput();
  return db.query(\`SELECT * FROM notes_note WHERE workspace_id = \${input}\`);
}
`,
    "apps/server/src/shared/db/scoped-repository.js":
      "export function createScopedRepository() {}\n",
  }, async (ws) => {
    const res = await runCheck(ws, "check-sql-concat.js");
    assertResult(res, 1, "值位置内联");
  });
});
