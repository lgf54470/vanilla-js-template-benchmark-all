// apps/server/src/modules/auth/repository.js — core_sessions 表操作（Auth.md §1.3）
//
// core_sessions 是核心基础设施表（前缀 core_*），不属于任何 workspace，
// 因此不经过 createScopedRepository（Database.md §1 三类表约定）。

/**
 * @param {import("../../shared/db/adapter.js").DbAdapter} db
 */
export function createSessionsRepository(db) {
  return {
    async insert({ id, issuedAt, expiresAt, storageKind }) {
      await db.execute(
        `INSERT INTO core_sessions (id, issued_at, expires_at, revoked_at, storage_kind)
         VALUES (?, ?, ?, NULL, ?)`,
        [id, issuedAt, expiresAt, storageKind],
      );
    },
    /**
     * 会话吊销状态（供校验中间件，结果进 30s 进程内缓存）。
     * @returns {Promise<{ revokedAt: string | null } | null>}
     */
    async getStatus(id) {
      const rows = await db.query(
        "SELECT revoked_at FROM core_sessions WHERE id = ?",
        [id],
      );
      if (rows.length === 0) return null;
      return { revokedAt: rows[0].revoked_at };
    },
    async revoke(id) {
      await db.execute(
        "UPDATE core_sessions SET revoked_at = ? WHERE id = ?",
        [new Date().toISOString(), id],
      );
    },
    async deleteExpired(nowIso) {
      await db.execute(
        "DELETE FROM core_sessions WHERE expires_at IS NOT NULL AND expires_at < ?",
        [nowIso],
      );
    },
  };
}
