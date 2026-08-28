import { Hono } from "hono";
import { resolveDbAdapter } from "../../shared/db/resolve.js";
import { createPasswordsService } from "./service.js";

export function createPasswordsRouter() {
  const router = new Hono();

  router.get("/", async (c) => {
    const wsId = c.get("workspaceId");
    const db = await resolveDbAdapter({ env: c.env });
    const service = createPasswordsService(db);
    const list = await service.listPasswords(wsId);
    return c.json({ ok: true, data: list });
  });

  router.post("/", async (c) => {
    const wsId = c.get("workspaceId");
    const body = await c.req.json();
    if (!body.title || !body.username || !body.password) {
      return c.json({
        ok: false,
        error: { code: "INVALID_INPUT", message: "Title, username, and password required" },
      }, 400);
    }
    const db = await resolveDbAdapter({ env: c.env });
    const service = createPasswordsService(db);
    const created = await service.createPassword(wsId, body);
    return c.json({ ok: true, data: created });
  });

  router.put("/:id", async (c) => {
    const wsId = c.get("workspaceId");
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = await resolveDbAdapter({ env: c.env });
    const service = createPasswordsService(db);
    const updated = await service.updatePassword(wsId, id, body);
    return c.json({ ok: true, data: updated });
  });

  router.delete("/:id", async (c) => {
    const wsId = c.get("workspaceId");
    const id = c.req.param("id");
    const db = await resolveDbAdapter({ env: c.env });
    const service = createPasswordsService(db);
    await service.deletePassword(wsId, id);
    return c.json({ ok: true, data: { deleted: true } });
  });

  return router;
}
