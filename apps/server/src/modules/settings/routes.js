import { Hono } from "hono";
import { resolveDbAdapter } from "../../shared/db/resolve.js";
import { createSettingsService } from "./service.js";
import { hashPassword } from "../../shared/auth/session.js";

export function createSettingsRouter() {
  const router = new Hono();

  router.get("/", async (c) => {
    const wsId = c.get("workspaceId");
    const db = await resolveDbAdapter({ env: c.env });
    const service = createSettingsService(db);
    const list = await service.listSettings(wsId);
    return c.json({ ok: true, data: list });
  });

  router.post("/", async (c) => {
    const wsId = c.get("workspaceId");
    const body = await c.req.json();
    const db = await resolveDbAdapter({ env: c.env });
    const service = createSettingsService(db);
    const result = await service.setSetting(wsId, body.key, body.value);
    return c.json({ ok: true, data: result });
  });

  router.post("/password", async (c) => {
    const body = await c.req.json();
    if (!body.newPassword) {
      return c.json({
        ok: false,
        error: { code: "INVALID_INPUT", message: "New password required" },
      }, 400);
    }
    const db = await resolveDbAdapter({ env: c.env });
    const newHash = await hashPassword(body.newPassword);
    const now = new Date().toISOString();

    const existing = await db.query("SELECT * FROM app_settings WHERE key = ?", ["settings:auth"]);
    if (existing.length > 0) {
      await db.execute("UPDATE app_settings SET value = ?, updated_at = ? WHERE key = ?", [
        newHash,
        now,
        "settings:auth",
      ]);
    } else {
      await db.execute(
        "INSERT INTO app_settings (key, value, is_encrypted, updated_at) VALUES (?, ?, 0, ?)",
        ["settings:auth", newHash, now],
      );
    }

    return c.json({ ok: true, data: { updated: true } });
  });

  return router;
}
