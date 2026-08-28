// scripts/tests/check-workspace-scope.test.js — check-workspace-scope 行为级测试
// 正向：业务表只经 createScopedRepository 入口通过；注释里提表名不误报；
// 反向：任何裸 SQL / 拼接引用业务表报错。
import {
  assertResult,
  runCheck,
  withWorkspace,
} from "./helpers/check-runner.js";

const MIGRATION =
  "-- 业务表：notes 模块\nCREATE TABLE IF NOT EXISTS notes_note (\n  id INTEGER PRIMARY KEY,\n  workspace_id TEXT NOT NULL,\n  title TEXT NOT NULL\n);\n";

const REPO_OK = `// 入口调用是唯一合法出现点
import { createScopedRepository } from "../../shared/db/scoped-repository.js";
export function createNotesRepository(db) {
  const scoped = createScopedRepository(db, "notes_note");
  return { forWorkspace: (id) => scoped.forWorkspace(id) };
}
`;

const REPO_BARE = REPO_OK +
  `\n// 违规：绕过入口的裸查询\nconst rows = db.query("SELECT * FROM notes_note WHERE workspace_id = 1");
`;

const REPO_COMMENT = "// 注释里提到 notes_note 表不算违规\n" +
  REPO_OK +
  "\n// 讨论：notes_note 应始终带 workspace_id\n";

Deno.test("check-workspace-scope 正向：业务表只经入口通过", async () => {
  await withWorkspace({
    "apps/server/src/modules/notes/migrations/0001_init.sql": MIGRATION,
    "apps/server/src/modules/notes/repository.js": REPO_OK,
  }, async (ws) => {
    const res = await runCheck(ws, "check-workspace-scope.js");
    assertResult(res, 0, "全部只见于 createScopedRepository 入口");
  });
});

Deno.test("check-workspace-scope 反向：裸 SELECT 引用报错", async () => {
  await withWorkspace({
    "apps/server/src/modules/notes/migrations/0001_init.sql": MIGRATION,
    "apps/server/src/modules/notes/repository.js": REPO_BARE,
  }, async (ws) => {
    const res = await runCheck(ws, "check-workspace-scope.js");
    assertResult(res, 1, "业务表");
    assertResult(res, 1, "notes_note");
  });
});

Deno.test("check-workspace-scope 正向：注释提表名不误报", async () => {
  await withWorkspace({
    "apps/server/src/modules/notes/migrations/0001_init.sql": MIGRATION,
    "apps/server/src/modules/notes/repository.js": REPO_COMMENT,
  }, async (ws) => {
    const res = await runCheck(ws, "check-workspace-scope.js");
    assertResult(res, 0, "全部只见于 createScopedRepository 入口");
  });
});
