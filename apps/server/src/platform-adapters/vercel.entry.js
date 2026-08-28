/**
 * Vercel Edge Function 入口（ARCHITECTURE.md §8/§15）。
 * vercel.json 把 /api/* rewrite 到本函数；静态产物由平台 serve dist/web/。
 * 数据库：Turso（TURSO_URL/TURSO_AUTH_TOKEN 环境变量）。
 */
import { createApp } from "../app.js";
import { createDbAdapter } from "../shared/db/resolve.js";

let cachedApp = null;

export default async function handler(request) {
  if (!cachedApp) {
    const vars = {};
    for (
      const key of [
        "TURSO_URL",
        "TURSO_AUTH_TOKEN",
        "APP_ENCRYPTION_KEY",
        "LOG_LEVEL",
      ]
    ) {
      const value = process.env?.[key];
      if (value !== undefined) vars[key] = value;
    }
    const db = await createDbAdapter({ target: "vercel", vars });
    cachedApp = createApp({
      db,
      deployTarget: "vercel",
      secret: vars.APP_ENCRYPTION_KEY ?? "",
    });
  }
  return cachedApp.fetch(request);
}
