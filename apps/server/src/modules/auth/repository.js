/**
 * auth/repository.js — 本模块唯一允许写 SQL 的地方（参数化强制）。
 * app_settings 只经 createSettings 封装访问（docs/Database.md §1.1）。
 */
export function createAuthRepository(db, settings) {
  function getAuthSetting() {
    return settings.getSetting("settings:auth");
  }

  function setAuthSetting(value) {
    return settings.setSetting("settings:auth", value);
  }

  function getLockout() {
    return settings.getSetting("settings:auth-lockout");
  }

  function setLockout(value) {
    return settings.setSetting("settings:auth-lockout", value);
  }

  function clearLockout() {
    return db.execute("DELETE FROM app_settings WHERE key = ?", [
      "settings:auth-lockout",
    ]);
  }

  function insertSession(session) {
    return db.execute(
      "INSERT INTO core_sessions (id, issued_at, expires_at, revoked_at, storage_kind) VALUES (?, ?, ?, NULL, ?)",
      [
        session.id,
        session.issuedAt,
        session.expiresAt ?? null,
        session.storageKind,
      ],
    );
  }

  async function findSession(id) {
    const rows = await db.query(
      "SELECT id, issued_at AS issuedAt, expires_at AS expiresAt, revoked_at AS revokedAt, storage_kind AS storageKind FROM core_sessions WHERE id = ?",
      [id],
    );
    return rows[0] ?? null;
  }

  function revokeSession(id) {
    return db.execute(
      "UPDATE core_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
      [new Date().toISOString(), id],
    );
  }

  return {
    getAuthSetting,
    setAuthSetting,
    getLockout,
    setLockout,
    clearLockout,
    insertSession,
    findSession,
    revokeSession,
  };
}
