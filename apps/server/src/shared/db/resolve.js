import { createD1Adapter } from "./d1.adapter.js";
import { createTursoAdapter } from "./turso.adapter.js";

let cachedAdapter = null;

export async function resolveDbAdapter(options = {}) {
  if (cachedAdapter && !options.forceNew) {
    return cachedAdapter;
  }

  const target = options.target || Deno.env.get("DEPLOY_TARGET") || "local";

  if (target === "cloudflare") {
    if (Deno.env.get("FORCE_TURSO") === "1") {
      cachedAdapter = createTursoAdapter();
    } else if (options.env?.DB) {
      cachedAdapter = createD1Adapter(options.env.DB);
    } else {
      throw new Error("Cloudflare D1 binding (env.DB) is missing");
    }
  } else if (target === "docker") {
    const localPath = Deno.env.get("LOCAL_SQLITE_PATH");
    if (localPath) {
      const { createSqliteAdapter } = await import("./sqlite.adapter.js");
      cachedAdapter = await createSqliteAdapter(localPath);
    } else {
      cachedAdapter = createTursoAdapter();
    }
  } else if (target === "vercel" || target === "deno") {
    cachedAdapter = createTursoAdapter();
  } else {
    // local target
    const path = options.dbPath || Deno.env.get("LOCAL_SQLITE_PATH") || ".data/dev.sqlite3";
    const { createSqliteAdapter } = await import("./sqlite.adapter.js");
    cachedAdapter = await createSqliteAdapter(path);
  }

  return cachedAdapter;
}
