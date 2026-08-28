/** /api/health 冒烟：统一响应包络 { ok, data }（ARCHITECTURE.md §8）。 */
import { createApp } from "../src/app.js";

const app = createApp({ deployTarget: "test" });

Deno.test("GET /api/health 返回 ok 与部署目标", async () => {
  const res = await app.request("/api/health");
  if (res.status !== 200) throw new Error(`status: ${res.status}`);
  const body = await res.json();
  if (body.ok !== true || body.data.target !== "test") {
    throw new Error(JSON.stringify(body));
  }
  if (res.headers.get("x-content-type-options") !== "nosniff") {
    throw new Error("security headers missing");
  }
});

Deno.test("未知路径返回 404 JSON", async () => {
  const res = await app.request("/api/nope");
  const body = await res.json();
  if (
    res.status !== 404 || body.ok !== false || body.error.code !== "NOT_FOUND"
  ) {
    throw new Error(JSON.stringify(body));
  }
});
