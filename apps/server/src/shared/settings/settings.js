/**
 * shared/settings/settings.js — app_settings 键值读写的唯一合法入口
 * （docs/Database.md §1.1：模块不得直接拼 SQL 查 app_settings 表）。
 *
 * value 恒为 JSON 字符串存库；读取侧解析后返回。显示配置类键走进程内缓存。
 */
export function createSettings(db, cache) {
  /** 读 key，返回解析后的值（不存在返回 null）。 */
  async function getSetting(key, { ttlMs = 0 } = {}) {
    if (ttlMs > 0 && cache) {
      const hit = cache.get(`settings:${key}`);
      if (hit !== undefined) return hit;
    }
    const rows = await db.query(
      "SELECT value, is_encrypted FROM app_settings WHERE key = ?",
      [key],
    );
    if (!rows[0]) return null;
    const raw = rows[0].is_encrypted ? null : JSON.parse(rows[0].value);
    if (ttlMs > 0 && cache) cache.set(`settings:${key}`, raw, ttlMs);
    return raw;
  }

  /** 写 key（value 任意可 JSON 序列化值）。 */
  async function setSetting(key, value) {
    await db.execute(
      `INSERT INTO app_settings (key, value, is_encrypted, updated_at)
       VALUES (?, ?, 0, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value,
         is_encrypted = excluded.is_encrypted, updated_at = excluded.updated_at`,
      [key, JSON.stringify(value), new Date().toISOString()],
    );
    cache?.del(`settings:${key}`);
  }

  return { getSetting, setSetting };
}
