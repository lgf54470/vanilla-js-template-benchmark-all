// apps/server/src/shared/logger/request-context.js — requestId 贯穿（Logging.md §5）
//
// app.js 最外层中间件：为每个请求生成 requestId 存入 context，
// 同请求内所有日志通过 createLogger({ requestId: c.get('requestId') }) 串联。

import { createLogger } from "./logger.js";

export function withRequestId(c, next) {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  const log = createLogger({ module: "http", requestId });
  const start = performance.now();
  return next()
    .then(() => {
      const ms = Math.round((performance.now() - start) * 100) / 100;
      log.info(`${c.req.method} ${c.req.path} -> ${c.res.status} (${ms}ms)`);
    })
    .catch((err) => {
      const ms = Math.round((performance.now() - start) * 100) / 100;
      log.error(`${c.req.method} ${c.req.path} failed (${ms}ms)`, err);
      throw err;
    });
}
