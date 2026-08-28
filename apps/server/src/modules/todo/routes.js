import { Hono } from "hono";
import { resolveDbAdapter } from "../../shared/db/resolve.js";
import { createTodoService } from "./service.js";

export function createTodoRouter() {
  const router = new Hono();

  router.get("/", async (c) => {
    const wsId = c.get("workspaceId");
    const status = c.req.query("status") || "";
    const db = await resolveDbAdapter({ env: c.env });
    const service = createTodoService(db);
    const list = await service.listTodos(wsId, status);
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
    const service = createTodoService(db);
    const created = await service.createTodo(wsId, body);
    return c.json({ ok: true, data: created });
  });

  router.put("/:id", async (c) => {
    const wsId = c.get("workspaceId");
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = await resolveDbAdapter({ env: c.env });
    const service = createTodoService(db);
    const updated = await service.updateTodo(wsId, id, body);
    return c.json({ ok: true, data: updated });
  });

  router.delete("/:id", async (c) => {
    const wsId = c.get("workspaceId");
    const id = c.req.param("id");
    const db = await resolveDbAdapter({ env: c.env });
    const service = createTodoService(db);
    await service.deleteTodo(wsId, id);
    return c.json({ ok: true, data: { deleted: true } });
  });

  return router;
}
