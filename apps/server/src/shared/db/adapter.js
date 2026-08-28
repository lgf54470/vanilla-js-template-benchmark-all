// apps/server/src/shared/db/adapter.js — DbAdapter 契约（JSDoc，无 TS 编译）
//
// 三个实现（sqlite/d1/turso）对外暴露完全一致的 { query, execute, transaction }，
// 业务代码（repository.js）不感知底层是哪一个（Database.md §3）。

/**
 * @typedef {Object} DbResult
 * @property {number|bigint} changes 受影响行数
 * @property {number|bigint} [lastInsertRowid] 自增 id（SQLite 场景）
 */

/**
 * @typedef {Object} DbAdapter
 * @property {(sql: string, params?: any[]) => Promise<any[]>} query
 * @property {(sql: string, params?: any[]) => Promise<DbResult>} execute
 * @property {(fn: (tx: DbAdapter) => Promise<void>) => Promise<void>} transaction
 */

export {};
