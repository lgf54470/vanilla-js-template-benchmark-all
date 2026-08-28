// scripts/tests/check-file-length.test.js — check-file-length 行为级测试
import {
  assertResult,
  runCheck,
  withWorkspace,
} from "./helpers/check-runner.js";

Deno.test("check-file-length 正向：全部源文件 ≤ 500 行通过", async () => {
  await withWorkspace({
    "apps/web/src/main.js": "export const ok = 1;\n",
    "docs/长文档.md": "x\n".repeat(600), // 文档不受限
  }, async (ws) => {
    const res = await runCheck(ws, "check-file-length.js");
    assertResult(res, 0);
  });
});

Deno.test("check-file-length 反向：超长源文件报错", async () => {
  await withWorkspace({
    "apps/web/src/too-long.js": "// line\n".repeat(501),
  }, async (ws) => {
    const res = await runCheck(ws, "check-file-length.js");
    assertResult(res, 1, "too-long.js");
  });
});

Deno.test("check-file-length：vendored 依赖不受限", async () => {
  await withWorkspace({
    "packages/lib/hono/dist/big.js": "// vendored\n".repeat(600),
  }, async (ws) => {
    const res = await runCheck(ws, "check-file-length.js");
    assertResult(res, 0);
  });
});
