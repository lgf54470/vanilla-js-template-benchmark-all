/**
 * shared/db/adapter.js — 数据库适配器契约（ARCHITECTURE.md §9.2）。
 *
 * 三个实现（sqlite / d1 / turso）对外暴露完全一致的接口，业务代码
 * （repository.js）不感知底层是哪一个——同一套 repository 代码在四个平台运行。
 */

/**
 * @typedef {Object} DbAdapter
 * @property {(sql: string, params?: any[]) => Promise<any[]>} query
 *           SELECT 语句，返回行对象数组。
 * @property {(sql: string, params?: any[]) => Promise<{changes: number, lastInsertRowid?: number|bigint}>} execute
 *           INSERT/UPDATE/DELETE，返回影响行数。
 * @property {(fn: (tx: DbAdapter) => Promise<void>) => Promise<void>} transaction
 *           事务内执行 fn，任一步抛错整体回滚（D1 平台为尽力而为的顺序执行）。
 * @property {(sql: string) => void} [exec]
 *           多语句原样执行（仅迁移 runner 使用，D1/Turso 可能不支持）。
 */
