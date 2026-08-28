/**
 * shared/workspace/routes.js — 工作空间端点（供前端 WorkspaceSwitcher）。
 * 新建/重命名/删除（含级联清理）随 M6 模块能力注册表落地。
 */
import { Hono } from "hono";

export function createWorkspaceRouter(db, cache) {
  const router = new Hono();

  router.get("/", async (c) => {
    const hit = cache.get("workspaces:list");
    if (hit !== undefined) return c.json({ ok: true, data: hit });
    const rows = await db.query(
      "SELECT id, name, icon, color_token AS colorToken, sort_order AS sortOrder, is_system AS isSystem FROM core_workspaces ORDER BY sort_order",
    );
    cache.set("workspaces:list", rows, 60_000);
    return c.json({ ok: true, data: rows });
  });

  return router;
}
