// apps/server/src/shared/workspace/workspace-middleware.js — x-workspace-id 校验
//
// 语义（Workspace.md §4）：请求缺失/携带非法 x-workspace-id 时回退到 ws_default
// 而不是 500。core_workspaces 全量列表走进程内缓存（TTL 60s），写操作后主动失效。

import { appCache } from "../cache/memory-cache.js";
import { DEFAULT_WORKSPACE_ID } from "../../../../../packages/contracts/constants.js";

export const WORKSPACES_CACHE_KEY = "workspaces:all";
export const WORKSPACES_CACHE_TTL_MS = 60_000;

/**
 * 读取工作空间全量列表（缓存 60s，Workspace.md §5）。
 * @param {import("../db/adapter.js").DbAdapter} db
 * @returns {Promise<Array<{ id: string, is_system: number }>>}
 */
export async function listWorkspacesCached(db) {
  const cached = appCache.get(WORKSPACES_CACHE_KEY);
  if (cached) return cached;
  const rows = await db.query(
    "SELECT id, name, icon, color_token, is_system FROM core_workspaces ORDER BY sort_order ASC, id ASC",
    [],
  );
  appCache.set(WORKSPACES_CACHE_KEY, rows, WORKSPACES_CACHE_TTL_MS);
  return rows;
}

export function invalidateWorkspacesCache() {
  appCache.delete(WORKSPACES_CACHE_KEY);
}

/**
 * 校验中间件：合法性走缓存；非法/缺失回退 ws_default（Workspace.md §8.2）。
 */
export function createWorkspaceMiddleware() {
  return async (c, next) => {
    const db = c.get("db");
    const requested = c.req.header("x-workspace-id") ?? "";

    let workspaceId = DEFAULT_WORKSPACE_ID;
    if (requested) {
      const workspaces = await listWorkspacesCached(db);
      const found = workspaces.some((w) => w.id === requested);
      if (found) workspaceId = requested;
    }

    c.set("workspaceId", workspaceId);
    return next();
  };
}
