/** request-context.js — 每请求生成 requestId 并贯穿下游日志（docs/Logging.md §5）。 */
export function withRequestId(c, next) {
  c.set("requestId", crypto.randomUUID());
  return next();
}
