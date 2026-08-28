// apps/server/src/modules/notes/routes.js — /api/notes 路由
//
// 统一响应包络（ARCHITECTURE.md §8）。workspaceId 取自中间件上下文
// c.get("workspaceId")（x-workspace-id，Workspace.md §4），业务代码不读请求头。

import { Hono } from "../../../../../packages/lib/hono/dist/hono.js";
import { ERROR_CODES } from "../../../../../packages/contracts/constants.js";

function jsonError(c, err) {
  const code = err?.code ?? ERROR_CODES.INTERNAL_ERROR;
  const status = code === "VALIDATION_ERROR"
    ? 400
    : code === "NOT_FOUND"
    ? 404
    : 500;
  return c.json({
    ok: false,
    error: { code, message: err?.message ?? "Internal error" },
  }, status);
}

export function createNotesRoutes({ service }) {
  const router = new Hono();

  const ws = (c) => c.get("workspaceId");

  router.get("/", async (c) => {
    const tag = c.req.query("tag") ?? "";
    try {
      const data = await service.list(ws(c), tag);
      return c.json({ ok: true, data });
    } catch (err) {
      return jsonError(c, err);
    }
  });

  router.get("/tags", async (c) => {
    try {
      const data = await service.listTags(ws(c));
      return c.json({ ok: true, data });
    } catch (err) {
      return jsonError(c, err);
    }
  });

  router.post("/", async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const data = await service.create(ws(c), body);
      return c.json({ ok: true, data }, 201);
    } catch (err) {
      return jsonError(c, err);
    }
  });

  router.get("/:id", async (c) => {
    try {
      const data = await service.get(ws(c), Number(c.req.param("id")));
      return c.json({ ok: true, data });
    } catch (err) {
      return jsonError(c, err);
    }
  });

  router.put("/:id", async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const data = await service.update(ws(c), Number(c.req.param("id")), body);
      return c.json({ ok: true, data });
    } catch (err) {
      return jsonError(c, err);
    }
  });

  router.delete("/:id", async (c) => {
    try {
      const data = await service.remove(ws(c), Number(c.req.param("id")));
      return c.json({ ok: true, data });
    } catch (err) {
      return jsonError(c, err);
    }
  });

  return router;
}
