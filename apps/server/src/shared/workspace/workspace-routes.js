// apps/server/src/shared/workspace/workspace-routes.js — /api/workspaces 核心端点
//
// 工作空间是核心基础设施（core_workspaces，跨模块），API 挂在 shared/workspace
// 而非某个 sidebar 模块（ARCHITECTURE.md §7 / Workspace.md §6）。M4 提供列表
// 读取；创建/重命名/删除（含级联）在 M6 随管理 UI 补齐。
// 响应带 i18n: 前缀的 name 原样返回，前端识别前缀取 key 翻译（i18n.md §5）。

import { Hono } from "../../../../../packages/lib/hono/dist/hono.js";

export function createWorkspaceRoutes({ listWorkspaces }) {
  const router = new Hono();

  router.get("/", async (c) => {
    const rows = await listWorkspaces(c.get("db"));
    return c.json({
      ok: true,
      data: rows.map((w) => ({
        id: w.id,
        name: w.name, // 可能带 i18n: 前缀，前端处理
        icon: w.icon,
        colorToken: w.color_token,
        isSystem: w.is_system === 1,
      })),
    });
  });

  return router;
}
