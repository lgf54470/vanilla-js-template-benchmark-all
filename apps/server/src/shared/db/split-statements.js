// apps/server/src/shared/db/split-statements.js — 迁移 SQL 语句拆分
//
// d1/turso 的 batch API 只接受单语句；迁移文件的多语句 SQL 需要先拆开。
// 拆分规则：按行尾分号切分（迁移文件约定：语句以 ; 结尾且不跨行——SQLite DDL
// 惯例，字符串字面量内不含 ; 的迁移即可正确拆分；node:sqlite 的 exec 不需要
// 拆分，本文件仅用于边缘适配器）。

/** @param {string} sql @returns {string[]} */
export function splitStatements(sql) {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
