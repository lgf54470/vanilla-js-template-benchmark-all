import assert from "node:assert/strict";
import { createSqliteAdapter } from "../../../src/shared/db/sqlite.adapter.js";
import { runMigrations } from "../../../src/shared/db/migrate.js";
import { createSettingsService } from "../../../src/modules/settings/service.js";

Deno.test("settings: 偏好键值存储与更新", async () => {
  const db = await createSqliteAdapter(":memory:");
  await runMigrations(db);

  const service = createSettingsService(db);
  await service.setSetting("ws_default", "notifications", "enabled");
  let list = await service.listSettings("ws_default");
  assert.strictEqual(list.find((s) => s.key === "notifications")?.value, "enabled");

  await service.setSetting("ws_default", "notifications", "disabled");
  list = await service.listSettings("ws_default");
  assert.strictEqual(list.find((s) => s.key === "notifications")?.value, "disabled");
});
