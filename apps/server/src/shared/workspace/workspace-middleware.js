/**
 * shared/workspace/workspace-middleware.js — x-workspace-id 校验与注入
 * （docs/Workspace.md §4/§5）。
 *
 * - 缺失/非法头 → 回退 ws_default（不报 500，回归测试红线 #2）。
 * - 合法性校验走 core_workspaces 全量列表的进程内缓存（TTL 60s）。
 * - c.set('workspaceId', ...) 供下游 repository 使用。
 */
const WORKSPACES_TTL_MS = 60_000;
const DEFAULT_WORKSPACE_ID = "ws_default";

export function createWorkspaceMiddleware(db, cache) {
  async function listWorkspaceIds() {
    const hit = cache.get("workspaces:ids");
    if (hit !== undefined) return hit;
    const rows = await db.query("SELECT id FROM core_workspaces");
    const ids = new Set(rows.map((r) => r.id));
    cache.set("workspaces:ids", ids, WORKSPACES_TTL_MS);
    return ids;
  }

  return async function workspaceMiddleware(c, next) {
    const header = c.req.header("x-workspace-id");
    let workspaceId = DEFAULT_WORKSPACE_ID;
    if (header) {
      const ids = await listWorkspaceIds();
      if (ids.has(header)) workspaceId = header;
    }
    c.set("workspaceId", workspaceId);
    return next();
  };
}

/** 工作空间写操作后主动失效缓存（docs/Workspace.md §5）。 */
export function invalidateWorkspaceCache(cache) {
  cache.del("workspaces:ids");
}
