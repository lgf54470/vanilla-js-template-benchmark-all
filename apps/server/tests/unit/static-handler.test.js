// apps/server/tests/unit/static-handler.test.js — 静态服务（ETag/SPA/路径穿越）
import assert from "node:assert/strict";

import {
  createStaticHandler,
  resolveSafePath,
} from "../../src/shared/static/static-handler.js";

function setup() {
  const root = Deno.makeTempDirSync({ prefix: "fb-static-" });
  Deno.writeTextFileSync(
    `${root}/index.html`,
    "<!doctype html><title>app</title>",
  );
  Deno.writeTextFileSync(`${root}/a.js`, "export const a = 1;");
  // contracts 双根：独立目录（模拟仓库根下的 packages/contracts），与 web 根
  // 互不包含——前缀剥离错误时该测试必然失败而不是被 "/" 根兜底
  const contracts = Deno.makeTempDirSync({ prefix: "fb-contracts-" });
  Deno.writeTextFileSync(`${contracts}/constants.js`, "export const K = 1;");
  return { root, contracts };
}

Deno.test("static: 站点根服务 index.html", async () => {
  const { root } = setup();
  const handler = createStaticHandler({
    roots: [{ urlPrefix: "/", dir: root }],
  });
  const res = await handler(new Request("http://x/"));
  assert.equal(res.status, 200);
  assert.equal((await res.text()).includes("<!doctype html>"), true);
  assert.equal(res.headers.get("content-type").includes("text/html"), true);
});

Deno.test("static: ETag 命中返回 304", async () => {
  const { root } = setup();
  const handler = createStaticHandler({
    roots: [{ urlPrefix: "/", dir: root }],
  });
  const first = await handler(new Request("http://x/a.js"));
  const etag = first.headers.get("etag");
  assert.ok(etag);

  const second = await handler(
    new Request("http://x/a.js", { headers: { "If-None-Match": etag } }),
  );
  assert.equal(second.status, 304);
  assert.equal((await second.text()).length, 0);
});

Deno.test("static: 深链 SPA 回退到 index.html", async () => {
  const { root } = setup();
  const handler = createStaticHandler({
    roots: [{ urlPrefix: "/", dir: root }],
  });
  const res = await handler(new Request("http://x/settings/profile"));
  assert.equal(res.status, 200);
  assert.equal((await res.text()).includes("<!doctype html>"), true);
});

Deno.test("static: 多根——/packages/contracts 第二根", async () => {
  const { root, contracts } = setup();
  const handler = createStaticHandler({
    roots: [
      { urlPrefix: "/", dir: root },
      { urlPrefix: "/packages/contracts", dir: contracts },
    ],
  });
  const res = await handler(
    new Request("http://x/packages/contracts/constants.js"),
  );
  assert.equal(res.status, 200);
  assert.equal((await res.text()).includes("export const K"), true);
});

Deno.test("static: 路径穿越被拒（resolveSafePath 单元）", () => {
  const { root } = setup();
  assert.equal(resolveSafePath("/../secret", root), null);
  assert.equal(resolveSafePath("/..%2f..%2f.env", root), null);
  assert.equal(resolveSafePath("/%00", root), null);
  assert.equal(resolveSafePath("/a/../../etc/passwd", root), null);
  // 合法路径正常解析
  const ok = resolveSafePath("/index.html", root);
  assert.ok(ok);
  assert.ok(ok.href.includes("index.html"));
});
