import assert from "node:assert/strict";
import { createSqliteAdapter } from "../../../src/shared/db/sqlite.adapter.js";
import { runMigrations } from "../../../src/shared/db/migrate.js";
import { createPasswordsService } from "../../../src/modules/passwords/service.js";

Deno.test("passwords: 敏感密码字段加密存储与解密读取", async () => {
  const db = await createSqliteAdapter(":memory:");
  await runMigrations(db);

  const service = createPasswordsService(db);
  const created = await service.createPassword("ws_default", {
    title: "Database Root",
    username: "admin",
    password: "SuperSecretPassword123!",
  });
  assert.strictEqual(created.password, "SuperSecretPassword123!");

  // Verify raw database row has encrypted string, NOT plaintext
  const rawRows = await db.query("SELECT * FROM passwords_items WHERE id = ?", [created.id]);
  assert.strictEqual(rawRows.length, 1);
  assert.notStrictEqual(rawRows[0].encrypted_password, "SuperSecretPassword123!");

  // Verify list service decrypts it correctly
  const list = await service.listPasswords("ws_default");
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].password, "SuperSecretPassword123!");
});
