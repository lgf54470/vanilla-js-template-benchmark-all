import { createApp } from "../app.js";
import { resolveDbAdapter } from "../shared/db/resolve.js";
import { runMigrations } from "../shared/db/migrate.js";
import { ensureAuthSeed } from "../shared/workspace/seed.js";
import { createStaticHandler } from "../shared/static/static-handler.js";
import { serveWithPortHint } from "../shared/net/serve-with-port-hint.js";

const port = Number(Deno.env.get("PORT")) || 8787;
const app = createApp();
const staticHandler = createStaticHandler({
  root: "apps/web",
  extraRoots: {
    "/packages/contracts": "packages/contracts",
  },
});

// Auto-run migrations & seed auth password in local dev
try {
  const db = await resolveDbAdapter({ target: "local" });
  await runMigrations(db);
  await ensureAuthSeed(db);
} catch (err) {
  console.warn("[local] Auto-migration warning:", err.message);
}

const fetchHandler = async (req) => {
  const staticRes = await staticHandler({ req });
  if (staticRes) return staticRes;
  return app.fetch(req);
};

console.log(`[local] Server started: http://127.0.0.1:${port}`);
serveWithPortHint({ port }, fetchHandler);
