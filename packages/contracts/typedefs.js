/**
 * 前后端共享的 JSDoc typedef（仅类型，无运行时导出）。消费方式：
 *
 * ```js
 * import "../typedefs.js"; // 仅引入 JSDoc，无运行时代价（本文件无实际导出）
 * ```
 *
 * @typedef {Object} ApiResponse
 * @property {true|false} ok
 * @property {any=} data 成功时的载荷
 * @property {{ code: string, message?: string }=} error 失败时的错误（SCREAMING_SNAKE_CASE code）
 * @property {any=} meta 分页游标等元信息
 *
 * @typedef {"local"|"cloudflare"|"vercel"|"deno"|"docker"} DeployTarget
 *
 * @typedef {Object} DbAdapter
 * @property {(sql: string, params?: any[]) => Promise<any[]>} query
 * @property {(sql: string, params?: any[]) => Promise<{ changes: number, lastInsertRowid?: number|bigint }>} execute
 * @property {(fn: (tx: DbAdapter) => Promise<void>) => Promise<void>} transaction
 *
 * @typedef {Object} SessionTokenPayload
 * @property {string} jti 会话 id（core_sessions.id，非令牌本身）
 * @property {number} iat 签发时刻（Unix 秒）
 * @property {number=} exp 过期时刻（Unix 秒；browser-session 类令牌为 30 天兜底）
 * @typedef {{ jti: string, issuedAt: string, expiresAt: string|null, revokedAt: string|null, storageKind: "persistent"|"session" }} SessionRow
 *
 * @typedef {Object} WorkspaceRow
 * @property {string} id
 * @property {string} name 以 "i18n:" 前缀表示引用 i18n key，否则为用户输入字面量
 * @property {string} icon
 * @property {string} color_token
 * @property {number} sort_order
 * @property {0|1} is_system
 * @property {string} created_at
 * @property {string} updated_at
 */

export {};
