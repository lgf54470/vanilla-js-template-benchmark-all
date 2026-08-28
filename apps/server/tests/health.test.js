import { strict } from "node:assert";
import { createApp } from "../src/app.js";

Deno.test("GET /api/health 返回 ok 与部署目标", async () => {
  const app = createApp();
  const res = await app.request("/api/health");
  strict.equal(res.status, 200);
  const body = await res.json();
  strict.ok(body.ok);
  strict.equal(typeof body.target, "string");
});

Deno.test("未知路径返回 404 JSON", async () => {
  const app = createApp();
  const res = await app.request("/api/nope");
  strict.equal(res.status, 404);
});
