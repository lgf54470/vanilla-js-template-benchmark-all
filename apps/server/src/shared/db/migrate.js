import { resolveDbAdapter } from "./resolve.js";

export async function runMigrations(db) {
  // 1. Ensure core_migrations table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS core_migrations (
      module TEXT NOT NULL,
      version INTEGER NOT NULL,
      applied_at TEXT NOT NULL,
      PRIMARY KEY (module, version)
    );
  `);

  // 2. Discover all migrations
  const migrationDirs = [
    {
      module: "core_workspaces",
      dir: new URL("../workspace/migrations", import.meta.url).pathname,
    },
  ];

  // Also check server modules
  const modulesDir = new URL("../../modules", import.meta.url).pathname;
  try {
    for await (const entry of Deno.readDir(modulesDir)) {
      if (entry.isDirectory) {
        const mDir = `${modulesDir}/${entry.name}/migrations`;
        try {
          const stat = await Deno.stat(mDir);
          if (stat.isDirectory) {
            migrationDirs.push({ module: entry.name, dir: mDir });
          }
        } catch {
          // No migrations for this module
        }
      }
    }
  } catch {
    // modules directory may not exist yet
  }

  // 3. Collect migration files
  const pendingMigrations = [];

  for (const { module, dir } of migrationDirs) {
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (entry.isFile && entry.name.endsWith(".sql")) {
          const match = entry.name.match(/^(\d+)_/);
          if (match) {
            const version = parseInt(match[1], 10);
            pendingMigrations.push({
              module,
              version,
              filename: entry.name,
              filePath: `${dir}/${entry.name}`,
            });
          }
        }
      }
    } catch {
      // Directory read error
    }
  }

  // Sort by version and module
  pendingMigrations.sort((a, b) => a.version - b.version || a.module.localeCompare(b.module));

  // 4. Query applied migrations
  const appliedRows = await db.query("SELECT module, version FROM core_migrations");
  const appliedSet = new Set(appliedRows.map((r) => `${r.module}:${r.version}`));

  let appliedCount = 0;

  for (const mig of pendingMigrations) {
    const key = `${mig.module}:${mig.version}`;
    if (!appliedSet.has(key)) {
      const sqlContent = await Deno.readTextFile(mig.filePath);
      console.log(`[migrate] Applying ${mig.module} -> ${mig.filename}...`);

      await db.transaction(async (tx) => {
        // Execute SQL statements in the file
        const statements = sqlContent
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const stmt of statements) {
          await tx.execute(stmt);
        }

        const now = new Date().toISOString();
        await tx.execute(
          "INSERT INTO core_migrations (module, version, applied_at) VALUES (?, ?, ?)",
          [mig.module, mig.version, now],
        );
      });

      appliedCount++;
    }
  }

  console.log(`[migrate] Finished. Applied ${appliedCount} new migrations.`);
  return { appliedCount };
}

// Allow direct execution
if (import.meta.main) {
  try {
    const db = await resolveDbAdapter();
    await runMigrations(db);
    Deno.exit(0);
  } catch (err) {
    console.error("[migrate] Migration failed:", err);
    Deno.exit(1);
  }
}
