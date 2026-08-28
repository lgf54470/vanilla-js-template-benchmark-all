import { resolveDbAdapter } from "../db/resolve.js";
import { runMigrations } from "../db/migrate.js";

export async function seedDatabase(db) {
  console.log("[db-seed] Running migrations and seeding default workspaces...");
  await runMigrations(db);
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
