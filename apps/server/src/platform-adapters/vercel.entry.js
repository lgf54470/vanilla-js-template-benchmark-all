// apps/server/src/platform-adapters/vercel.entry.js — Vercel Edge Function 入口
//
// vercel.json 的 rewrites 把 /api/* 指向本函数，其余路径由静态产物
// dist/web 直接服务（Deployment.md §4）。数据库固定 Turso。环境变量经
// shared/env.js 兜底读取（边缘运行时可能无 Deno.env，用 process.env）。

import { createDb } from "../shared/db/resolve.js";
import { createApp } from "../app.js";
import { collectEnv } from "../shared/env.js";

let singleton = null;

function getApp() {
  if (!singleton) {
    const env = collectEnv();
    env.DEPLOY_TARGET = env.DEPLOY_TARGET ?? "vercel";
    const db = createDb({ target: "vercel", env });
    singleton = createApp({ db, env });
  }
  return singleton;
}

export default function handler(request) {
  const app = getApp();
  return app.fetch(request);
}
