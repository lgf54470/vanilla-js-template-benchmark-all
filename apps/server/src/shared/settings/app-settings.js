// apps/server/src/shared/settings/app-settings.js — app_settings 表的唯一 SQL 封装
//
// Database.md §1.1：跨模块读取 app_settings 的 key 视同跨模块耦合，**只有**本
// 封装可以被任意模块/中间件调用，模块不得直接拼 SQL 查该表。settings 模块的
// service.js 同样经此封装读写（settings:* 与 accounts:* 命名空间归属由调用方
// 约定，本文件只负责存取与加密标记）。

import { decryptField, encryptField } from "../crypto/field-crypto.js";

/**
 * @param {import("../db/adapter.js").DbAdapter} db
 * @param {string | Uint8Array} encryptionKey
 */
export function createAppSettingsStore(db, encryptionKey) {
  return {
    /** 读取 key 的 JSON 解析后的值；不存在返回 null。 */
    async get(key) {
      const rows = await db.query(
        "SELECT value, is_encrypted FROM app_settings WHERE key = ?",
        [key],
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      const raw = row.is_encrypted
        ? await decryptField(row.value, encryptionKey)
        : row.value;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    /** 读取原始字符串（无 JSON 解析），用于需要原样比较的场景。 */
    async getRaw(key) {
      const rows = await db.query(
        "SELECT value, is_encrypted FROM app_settings WHERE key = ?",
        [key],
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      return row.is_encrypted
        ? await decryptField(row.value, encryptionKey)
        : row.value;
    },
    /**
     * 写入 JSON 值。
     * @param {string} key
     * @param {unknown} value
     * @param {{ encrypt?: boolean }} [opts] encrypt=true 时加密存储（Database.md §5）
     */
    async set(key, value, opts = {}) {
      const raw = JSON.stringify(value);
      const { encrypt = false } = opts;
      const stored = encrypt ? await encryptField(raw, encryptionKey) : raw;
      await db.execute(
        `INSERT INTO app_settings (key, value, is_encrypted, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           is_encrypted = excluded.is_encrypted,
           updated_at = excluded.updated_at`,
        [key, stored, encrypt ? 1 : 0, new Date().toISOString()],
      );
    },
    async remove(key) {
      await db.execute("DELETE FROM app_settings WHERE key = ?", [key]);
    },
  };
}
