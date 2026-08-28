import { Hono } from "hono";
import { resolveDbAdapter } from "../../shared/db/resolve.js";
import { createBookmarksService } from "./service.js";

export function createBookmarksRouter() {
  const router = new Hono();

  router.get("/", async (c) => {
    const wsId = c.get("workspaceId");
    const category = c.req.query("category") || "";
    const db = await resolveDbAdapter({ env: c.env });
    const service = createBookmarksService(db);
    const list = await service.listBookmarks(wsId, category);
    return c.json({ ok: true, data: list });
  });

  router.post("/", async (c) => {
    const wsId = c.get("workspaceId");
    const body = await c.req.json();
    if (!body.title || !body.url) {
      return c.json({
        ok: false,
        error: { code: "INVALID_INPUT", message: "Title and URL required" },
      }, 400);
    }
    const db = await resolveDbAdapter({ env: c.env });
    const service = createBookmarksService(db);
    const created = await service.createBookmark(wsId, body);
    return c.json({ ok: true, data: created });
  });

  router.put("/:id", async (c) => {
    const wsId = c.get("workspaceId");
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = await resolveDbAdapter({ env: c.env });
    const service = createBookmarksService(db);
    const updated = await service.updateBookmark(wsId, id, body);
    return c.json({ ok: true, data: updated });
  });

  router.delete("/:id", async (c) => {
    const wsId = c.get("workspaceId");
    const id = c.req.param("id");
    const db = await resolveDbAdapter({ env: c.env });
    const service = createBookmarksService(db);
    await service.deleteBookmark(wsId, id);
    return c.json({ ok: true, data: { deleted: true } });
  });

  return router;
}
