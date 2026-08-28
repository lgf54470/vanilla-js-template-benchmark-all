/**
 * shared/db/resolve.js — 按 DEPLOY_TARGET 选择数据库适配器（ARCHITECTURE.md §9.2）。
 *
 * 读取显式环境变量，不做运行时探测猜测；sqlite 适配器（node:sqlite）只在
 * 真正需要时动态 import——cloudflare 打包（esbuild）不认识 node:sqlite，
 * 见 docs/Deployment.md §3 打包说明。
 *
 * @param {{
 *   target?: string,                 // 缺省读 DEPLOY_TARGET
 *   vars?: Record<string, string>,   // 平台环境变量（Workers 的 env vars / Deno.env）
 *   bindings?: Record<string, any>,  // 平台绑定（Workers 的 env.DB / env.ASSETS）
 *   localSqlitePath?: string,        // 测试/入口注入的 sqlite 路径
 * }} options
 */
export async function createDbAdapter(options = {}) {
  const vars = options.vars ?? {};
  const get = (key) => vars[key] ?? globalThis.Deno?.env?.get(key);
  const target = options.target ?? get("DEPLOY_TARGET") ?? "local";
  const bindings = options.bindings ?? {};

  async function turso() {
    const { createTursoAdapter } = await import("./turso.adapter.js");
    const url = get("TURSO_URL");
    if (!url) {
      throw new Error(`TURSO_URL is required for target: ${target}`);
    }
    return createTursoAdapter({ url, authToken: get("TURSO_AUTH_TOKEN") });
  }

  async function sqlite() {
    const { createSqliteAdapter } = await import("./sqlite.adapter.js");
    const path = options.localSqlitePath ?? get("LOCAL_SQLITE_PATH") ??
      ".data/dev.sqlite3";
    if (globalThis.Deno?.mkdir && !path.startsWith(":")) {
      const dir = path.replace(/[\\/][^\\/]+$/, "");
      await Deno.mkdir(dir, { recursive: true }).catch(() => {});
    }
    return createSqliteAdapter(path);
  }

  switch (target) {
    case "local":
      return sqlite();
    case "cloudflare": {
      if (get("FORCE_TURSO")) return turso();
      if (!bindings.DB) {
        throw new Error("D1 binding env.DB is required for cloudflare");
      }
      const { createD1Adapter } = await import("./d1.adapter.js");
      return createD1Adapter(bindings.DB);
    }
    case "vercel":
    case "deno":
      return turso();
    case "docker":
      return get("LOCAL_SQLITE_PATH") || options.localSqlitePath
        ? sqlite()
        : turso();
    default:
      throw new Error(`Unknown DEPLOY_TARGET: ${target}`);
  }
}
