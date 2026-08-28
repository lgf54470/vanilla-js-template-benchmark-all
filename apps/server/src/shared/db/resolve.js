// apps/server/src/shared/db/resolve.js — 按 DEPLOY_TARGET 选择数据库适配器
//
// 不做运行时探测猜测：目标由各 platform-adapters/*.entry.js 在启动时显式传入
// （ARCHITECTURE.md §9.2）。sqliteFactory 仅由 local/docker 入口注入（本文件与
// 其余入口不静态 import node:sqlite，保证 cloudflare/vercel/deno 可被边缘打包）。
//
// 选择矩阵：
//   local      → SQLite（.data/dev.sqlite3，可被 LOCAL_SQLITE_PATH 覆盖）
//   cloudflare → D1（env.DB binding）；FORCE_TURSO=1 时改用 Turso
//   vercel/deno → Turso
//   docker     → Turso；LOCAL_SQLITE_PATH 设置时改用本机 SQLite

import { createD1Adapter } from "./d1.adapter.js";
import { createTursoAdapter } from "./turso.adapter.js";

const DEFAULT_LOCAL_DB = ".data/dev.sqlite3";

/**
 * @param {Object} opts
 * @param {string} opts.target DEPLOY_TARGET（local|cloudflare|vercel|deno|docker）
 * @param {Record<string,string|undefined>} opts.env 环境变量（Deno.env）
 * @param {Object} [opts.bindings] 平台绑定（如 env.DB）
 * @param {(path:string) => any} [opts.sqliteFactory] 仅 local/docker 入口注入
 */
export function createDb({ target, env = {}, bindings = {}, sqliteFactory }) {
  switch (target) {
    case "local": {
      const path = env.LOCAL_SQLITE_PATH ?? DEFAULT_LOCAL_DB;
      if (!sqliteFactory) {
        throw new Error("createDb: local 目标需要注入 sqliteFactory");
      }
      return sqliteFactory(path);
    }
    case "cloudflare": {
      if (env.FORCE_TURSO === "1" || env.FORCE_TURSO === "true") {
        return createTursoAdapter({
          url: env.TURSO_URL,
          authToken: env.TURSO_AUTH_TOKEN,
        });
      }
      return createD1Adapter(bindings.DB);
    }
    case "vercel":
    case "deno": {
      return createTursoAdapter({
        url: env.TURSO_URL,
        authToken: env.TURSO_AUTH_TOKEN,
      });
    }
    case "docker": {
      if (env.LOCAL_SQLITE_PATH) {
        if (!sqliteFactory) {
          throw new Error(
            "createDb: docker 目标用本机 SQLite 时需要注入 sqliteFactory",
          );
        }
        return sqliteFactory(env.LOCAL_SQLITE_PATH);
      }
      return createTursoAdapter({
        url: env.TURSO_URL,
        authToken: env.TURSO_AUTH_TOKEN,
      });
    }
    default:
      throw new Error(`createDb: 未知 DEPLOY_TARGET "${target}"`);
  }
}
