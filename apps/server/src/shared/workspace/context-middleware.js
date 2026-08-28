import { createWorkspaceService } from "./workspace-service.js";
import { resolveDbAdapter } from "../db/resolve.js";

export function createWorkspaceMiddleware() {
  return async function workspaceMiddleware(c, next) {
    const rawWsId = c.req.header("x-workspace-id");
    let targetWsId = rawWsId || "ws_default";

    try {
      const db = await resolveDbAdapter({ env: c.env });
      const service = createWorkspaceService(db);
      const ws = await service.getWorkspace(targetWsId);

      if (!ws) {
        targetWsId = "ws_default";
      }
    } catch {
      targetWsId = "ws_default";
    }

    c.set("workspaceId", targetWsId);
    c.header("x-workspace-id", targetWsId);
    await next();
  };
}
