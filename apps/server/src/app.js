import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { withRequestId } from "./shared/logger/request-context.js";
import { createAuthMiddleware } from "./shared/auth/auth-middleware.js";
import { createWorkspaceMiddleware } from "./shared/workspace/context-middleware.js";
import { createWorkspaceService } from "./shared/workspace/workspace-service.js";
import { resolveDbAdapter } from "./shared/db/resolve.js";
import {
  checkLockout,
  hashPassword,
  issueSessionToken,
  recordLoginFailure,
  resetLoginFailures,
  revokeSessionToken,
  verifyPassword,
} from "./shared/auth/session.js";

import { createNotesRouter } from "./modules/notes/routes.js";
import { createTodoRouter } from "./modules/todo/routes.js";
import { createBookmarksRouter } from "./modules/bookmarks/routes.js";
import { createPasswordsRouter } from "./modules/passwords/routes.js";
import { createSettingsRouter } from "./modules/settings/routes.js";

export function createApp() {
  const app = new Hono();

  // 1. Security Headers
  app.use("*", secureHeaders());

  // 2. CORS (if configured)
  const corsOrigin = Deno.env.get("CORS_ALLOWED_ORIGIN");
  if (corsOrigin) {
    app.use("*", cors({ origin: corsOrigin, credentials: true }));
  }

  // 3. Request ID
  app.use("*", withRequestId);

  // 4. Auth Middleware
  app.use("/api/*", createAuthMiddleware());

  // 5. Workspace Middleware
  app.use("/api/*", createWorkspaceMiddleware());

  // 6. Health Route
  app.get("/api/health", (c) => {
    return c.json({
      ok: true,
      data: {
        target: Deno.env.get("DEPLOY_TARGET") || "local",
        timestamp: new Date().toISOString(),
      },
    });
  });

  // 7. Workspaces API
  app.get("/api/workspaces", async (c) => {
    const db = await resolveDbAdapter({ env: c.env });
    const service = createWorkspaceService(db);
    const list = await service.listWorkspaces();
    return c.json({ ok: true, data: list });
  });

  app.post("/api/workspaces", async (c) => {
    const body = await c.req.json();
    if (!body.name) {
      return c.json(
        { ok: false, error: { code: "INVALID_INPUT", message: "Name is required" } },
        400,
      );
    }
    const db = await resolveDbAdapter({ env: c.env });
    const service = createWorkspaceService(db);
    const created = await service.createWorkspace(body);
    return c.json({ ok: true, data: created });
  });

  app.put("/api/workspaces/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const db = await resolveDbAdapter({ env: c.env });
    const service = createWorkspaceService(db);
    const updated = await service.updateWorkspace(id, body);
    return c.json({ ok: true, data: updated });
  });

  app.delete("/api/workspaces/:id", async (c) => {
    const id = c.req.param("id");
    const db = await resolveDbAdapter({ env: c.env });
    const service = createWorkspaceService(db);

    try {
      const deleted = await service.deleteWorkspace(id, [
        async (wsId) => {
          await db.execute("DELETE FROM notes_items WHERE workspace_id = ?", [wsId]);
          await db.execute("DELETE FROM todo_items WHERE workspace_id = ?", [wsId]);
          await db.execute("DELETE FROM bookmarks_items WHERE workspace_id = ?", [wsId]);
          await db.execute("DELETE FROM passwords_items WHERE workspace_id = ?", [wsId]);
          await db.execute("DELETE FROM settings_entries WHERE workspace_id = ?", [wsId]);
        },
      ]);
      return c.json({ ok: true, data: { deleted } });
    } catch (err) {
      if (err.message === "WORKSPACE_SYSTEM_CANNOT_DELETE") {
        return c.json(
          {
            ok: false,
            error: {
              code: "WORKSPACE_SYSTEM_CANNOT_DELETE",
              message: "System workspaces cannot be deleted",
            },
          },
          403,
        );
      }
      return c.json(
        { ok: false, error: { code: "WORKSPACE_DELETE_FAILED", message: err.message } },
        400,
      );
    }
  });

  // 8. Auth API
  app.post("/api/auth/login", async (c) => {
    const lockout = checkLockout();
    if (lockout.locked) {
      return c.json(
        {
          ok: false,
          error: {
            code: "AUTH_LOCKED_OUT",
            message: `Too many failed attempts. Locked for ${lockout.remainingSec}s`,
            remainingSeconds: lockout.remainingSec,
          },
        },
        429,
      );
    }

    const password = c.req.header("x-auth-password") ||
      (await c.req.json().catch(() => ({}))).password;
    const body = await c.req.json().catch(() => ({}));
    const durationSeconds = body.durationSeconds ?? (24 * 3600);
    const storageKind = body.storageKind || "persistent";

    if (!password) {
      return c.json({
        ok: false,
        error: { code: "AUTH_MISSING_PASSWORD", message: "Password required" },
      }, 400);
    }

    const db = await resolveDbAdapter({ env: c.env });
    const rows = await db.query("SELECT value FROM app_settings WHERE key = ?", ["settings:auth"]);
    let storedHash = rows[0]?.value;

    if (!storedHash && Deno.env.get("DEV_SEED_AUTH_PASSWORD")) {
      const devPwd = Deno.env.get("DEV_SEED_AUTH_PASSWORD");
      storedHash = await hashPassword(devPwd);
      const now = new Date().toISOString();
      await db.execute(
        "INSERT INTO app_settings (key, value, is_encrypted, updated_at) VALUES (?, ?, 0, ?)",
        ["settings:auth", storedHash, now],
      );
    }

    if (!storedHash) {
      return c.json({
        ok: false,
        error: { code: "AUTH_NOT_INITIALIZED", message: "System password not set" },
      }, 400);
    }

    const isValid = await verifyPassword(password, storedHash);
    if (!isValid) {
      const failInfo = recordLoginFailure();
      return c.json(
        {
          ok: false,
          error: {
            code: "AUTH_INVALID_PASSWORD",
            message: "Invalid password",
            failuresRemaining: failInfo.failuresRemaining,
          },
        },
        401,
      );
    }

    resetLoginFailures();
    const { token } = await issueSessionToken(durationSeconds, storageKind, db);

    return c.json({ ok: true, data: { token, storageKind } });
  });

  app.post("/api/auth/logout", async (c) => {
    const sessionId = c.get("sessionId");
    const db = await resolveDbAdapter({ env: c.env });
    if (sessionId) {
      await revokeSessionToken(sessionId, db);
    }
    return c.json({ ok: true, data: { loggedOut: true } });
  });

  app.get("/api/auth/verify", (c) => {
    const session = c.get("session");
    return c.json({ ok: true, data: { authenticated: true, session } });
  });

  // 9. Mount Module Sub-routers
  app.route("/api/notes", createNotesRouter());
  app.route("/api/todo", createTodoRouter());
  app.route("/api/bookmarks", createBookmarksRouter());
  app.route("/api/passwords", createPasswordsRouter());
  app.route("/api/settings", createSettingsRouter());

  return app;
}
