// apps/server/src/platform-adapters/deno.entry.js — Deno Deploy 入口
//
// Deno.serve(app.fetch)；静态产物经 deployctl --static-dir=dist/web 由平台在
// 请求到达 Worker 前直接服务，/api 路径才进入 Hono（Deployment.md §5）。
// 数据库固定 Turso。四个目标里运行时与本地工具链最一致，问题最易本地复现。

import { createDb } from "../shared/db/resolve.js";
import { createApp } from "../app.js";
import { collectEnv } from "../shared/env.js";
import { createLogger } from "../shared/logger/logger.js";

const log = createLogger({ module: "deno" });

const env = collectEnv();
env.DEPLOY_TARGET = env.DEPLOY_TARGET ?? "deno";

const db = createDb({ target: "deno", env });
const app = createApp({ db, env });

log.info(`deno deploy entry ready (target=deno)`);

Deno.serve(app.fetch);
