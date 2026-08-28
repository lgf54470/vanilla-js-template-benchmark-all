/**
 * Cloudflare Workers 入口（ARCHITECTURE.md §8/§15）。
 *
 * - 非 /api 路径且存在 ASSETS binding → 转发静态资产（wrangler.toml assets 配置
 *   含 SPA 回退）；/api 与无 ASSETS 的本地演练进 Hono。
 * - env.DB（D1 binding）注入数据库适配器；FORCE_TURSO=1 改用 Turso。
 * - 注意（docs/Deployment.md §3）：不静态 import node:sqlite——resolve.js 内部
 *   按需动态 import；裸 specifier（hono/@contracts）由 wrangler 打包时按相对路径解析。
 */
import { createApp } from "../app.js";
import { createDbAdapter } from "../shared/db/resolve.js";

let cachedApp = null;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/") && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    if (!cachedApp) {
      const db = await createDbAdapter({
        target: "cloudflare",
        vars: env,
        bindings: env,
      });
      cachedApp = createApp({
        db,
        deployTarget: "cloudflare",
        secret: env.APP_ENCRYPTION_KEY ?? "",
      });
    }
    return cachedApp.fetch(request);
  },
};
