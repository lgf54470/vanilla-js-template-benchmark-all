// apps/server/src/platform-adapters/cloudflare.entry.js — Cloudflare Workers 入口
//
// 协议桥接（ARCHITECTURE.md §8）：非 /api 路径且存在 ASSETS binding 时转发
// 静态资产（dist/web，wrangler.toml [assets]），否则进 Hono。数据库为 D1
// （env.DB binding），FORCE_TURSO=1 时改用 Turso。懒初始化单例，避免每请求重建。
//
// 打包注意（Deployment.md §3）：本文件及其依赖链不得静态 import node:sqlite——
// resolve.js 不 import sqlite 适配器，由 local/docker 入口注入工厂，满足这一点。

import { createDb } from "../shared/db/resolve.js";
import { createApp } from "../app.js";
import { createLogger } from "../shared/logger/logger.js";

const log = createLogger({ module: "cloudflare" });

let singleton = null;

function getApp(env) {
  if (!singleton) {
    const db = createDb({ target: "cloudflare", env, bindings: env });
    singleton = createApp({ db, env });
    log.info("cloudflare app initialized");
  }
  return singleton;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // 静态资产层优先（含 SPA 深链回退与 packages/contracts 双根，均已由
    // wrangler [assets] 配置处理，Deployment.md §3）
    if (!url.pathname.startsWith("/api") && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    const app = await getApp(env);
    return app.fetch(request, env, ctx);
  },
};
