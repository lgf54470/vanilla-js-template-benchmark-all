import { resolveDbAdapter } from "../db/resolve.js";
import { runMigrations } from "../db/migrate.js";
import { hashPassword } from "../auth/session.js";

export async function ensureAuthSeed(db) {
  const rows = await db.query("SELECT value FROM app_settings WHERE key = ?", ["settings:auth"]);
  if (rows.length === 0) {
    const devPwd = Deno.env.get("DEV_SEED_AUTH_PASSWORD") || "change-me-in-dev";
    const hash = await hashPassword(devPwd);
    const now = new Date().toISOString();
    await db.execute(
      "INSERT OR REPLACE INTO app_settings (key, value, is_encrypted, updated_at) VALUES (?, ?, 0, ?)",
      ["settings:auth", hash, now],
    );
    console.log(`[db-seed] Seeded auth password in app_settings (DEV_SEED_AUTH_PASSWORD).`);
  }
}

export async function seedDatabase(db) {
  console.log("[db-seed] Running migrations and seeding default workspaces...");
  await runMigrations(db);
  await ensureAuthSeed(db);
  console.log("[db-seed] Seeding completed.");
}

if (import.meta.main) {
  try {
    const db = await resolveDbAdapter();
    await seedDatabase(db);
    Deno.exit(0);
  } catch (err) {
    console.error("[db-seed] Seeding failed:", err);
    Deno.exit(1);
  }
}
