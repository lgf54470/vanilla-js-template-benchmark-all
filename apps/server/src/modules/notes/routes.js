import { Hono } from "hono";
import { resolveDbAdapter } from "../../shared/db/resolve.js";
import { createNotesService } from "./service.js";

export function createNotesRouter() {
  const router = new Hono();

  router.get("/", async (c) => {
    const wsId = c.get("workspaceId");
    const search = c.req.query("search") || "";
    const db = await resolveDbAdapter({ env: c.env });
    const service = createNotesService(db);
    const list = await service.listNotes(wsId, search);
    return c.json({ ok: true, data: list });
  });

  router.post("/", async (c) => {
    const wsId = c.get("workspaceId");
    const body = await c.req.json();
    if (!body.title) {
      return c.json(
        { ok: false, error: { code: "INVALID_INPUT", message: "Title required" } },
        400,
      );
    }
    const db = await resolveDbAdapter({ env: c.env });
    const service = createNotesService(db);
    const created = await service.createNote(wsId, body);
    return c.json({ ok: true, data: created });
  });

  router.put("/:id", async (c) => {
    const wsId = c.get("workspaceId");
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = await resolveDbAdapter({ env: c.env });
    const service = createNotesService(db);
    const updated = await service.updateNote(wsId, id, body);
    return c.json({ ok: true, data: updated });
  });

  router.delete("/:id", async (c) => {
    const wsId = c.get("workspaceId");
    const id = c.req.param("id");
    const db = await resolveDbAdapter({ env: c.env });
    const service = createNotesService(db);
    await service.deleteNote(wsId, id);
    return c.json({ ok: true, data: { deleted: true } });
  });

  return router;
}
