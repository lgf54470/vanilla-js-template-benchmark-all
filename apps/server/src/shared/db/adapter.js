/**
 * @typedef {Object} DbAdapter
 * @property {(sql: string, params?: any[]) => Promise<any[]>} query
 * @property {(sql: string, params?: any[]) => Promise<{ changes: number, lastInsertRowid?: number | bigint }>} execute
 * @property {(fn: (tx: DbAdapter) => Promise<void>) => Promise<void>} transaction
 */
