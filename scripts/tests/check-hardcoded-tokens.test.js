// scripts/tests/check-hardcoded-tokens.test.js — check-hardcoded-tokens 行为级测试
import {
  assertResult,
  runCheck,
  withWorkspace,
} from "./helpers/check-runner.js";

Deno.test("check-hardcoded-tokens 正向：纯令牌引用通过", async () => {
  await withWorkspace({
    "apps/web/src/main.js": "const a = 1;\n",
    "apps/web/src/shared/styles/tokens/colors.css":
      "--color-bg: var(--background, oklch(1 0 0));\n",
    "apps/web/src/shared/styles/base/reset.css": "body { margin: 0; }\n",
    "apps/web/src/shared/styles/base/no-motion.css":
      "* { animation: none !important; }\n",
  }, async (ws) => {
    const res = await runCheck(ws, "check-hardcoded-tokens.js");
    assertResult(res, 0);
  });
});

Deno.test("check-hardcoded-tokens 反向：hex 颜色", async () => {
  await withWorkspace({
    "apps/web/src/main.js": 'el.style.color = "#ff5500";\n',
  }, async (ws) => {
    const res = await runCheck(ws, "check-hardcoded-tokens.js");
    assertResult(res, 1, "hex 颜色");
  });
});

Deno.test("check-hardcoded-tokens 反向：oklch 颜色函数", async () => {
  await withWorkspace({
    "apps/web/src/main.js": 'el.style.background = "oklch(0.5 0.2 30)";\n',
  }, async (ws) => {
    const res = await runCheck(ws, "check-hardcoded-tokens.js");
    assertResult(res, 1, "oklch 颜色函数");
  });
});

Deno.test("check-hardcoded-tokens 反向：px 圆角/间距/字号", async () => {
  await withWorkspace({
    "apps/web/src/main.js": "// 无\n",
    "apps/web/src/style.css":
      "box { border-radius: 8px; padding: 4px; font-size: 16px; }\n",
  }, async (ws) => {
    const res = await runCheck(ws, "check-hardcoded-tokens.js");
    assertResult(res, 1, "px 圆角");
    assertResult(res, 1, "px 间距");
    assertResult(res, 1, "px 字号");
  });
});

Deno.test("check-hardcoded-tokens：1px border-width 与媒体查询 px 放行", async () => {
  await withWorkspace({
    "apps/web/src/style.css":
      "box { border: 1px solid var(--color-border); }\n@media (max-width: 767px) { box { padding: var(--space-3); } }\n",
  }, async (ws) => {
    const res = await runCheck(ws, "check-hardcoded-tokens.js");
    assertResult(res, 0);
  });
});
