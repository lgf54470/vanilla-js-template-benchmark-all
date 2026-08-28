/**
 * 为每请求注入唯一 requestId
 */
export async function withRequestId(c, next) {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  await next();
}
