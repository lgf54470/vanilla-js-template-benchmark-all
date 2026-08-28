/**
 * apps/web/tests/e2e/smoke.test.js — UI 冒烟（ARCHITECTURE §13 / docs/Testing.md §4）。
 * 关键路径：应用起服 → 页面可用 → 亮暗切换即时生效 → 刷新后持久（PREPAINT 防闪）。
 * 前置缺失（无 Chrome / 服务不可达）时自动跳过，CI 环境按需启用。
 */

import {
  connectCDP,
  launchChrome,
} from "../../../../scripts/testing/cdp-client.js";

const BASE = Deno.env.get("SMOKE_BASE") ?? "http://127.0.0.1:8788";

/** 服务可达才跑（e2e 用 just dev 或本地入口另行拉起） */
async function serverUp() {
  try {
    const res = await fetch(`${BASE}/api/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

Deno.test({
  name: "UI 冒烟：主题切换即时生效且刷新持久",
  ignore: !(await serverUp()),
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const chrome = await launchChrome();
    try {
      const cdp = await connectCDP(chrome.port, BASE);
      try {
        // 1) 入口模块执行完毕（模块脚本与 load 事件无先后保证，轮询等待）
        const mounted = await cdp.waitFor(
          "document.querySelector('.pg-main') != null",
        );
        if (!mounted) throw new Error("M1 样张未挂载（5s 内 .pg-main 未出现）");

        // 2) 切 dark：类与 data-theme 即时更新
        const applied = await cdp.evaluate(`
          localStorage.setItem("pref:theme", "dark");
          document.querySelector('[data-set="theme"][data-value="dark"]').click();
          ({ dark: document.documentElement.classList.contains("dark"),
             dataTheme: document.documentElement.dataset.theme })
        `);
        if (!applied.dark || applied.dataTheme !== "dark") {
          throw new Error(`亮暗切换未生效：${JSON.stringify(applied)}`);
        }

        // 3) 刷新：PREPAINT 直接恢复 dark（首帧不闪白）
        await cdp.navigate(BASE);
        await cdp.waitFor("document.querySelector('.pg-main') != null");
        const persisted = await cdp.evaluate(`
          ({ dark: document.documentElement.classList.contains("dark"),
             theme: localStorage.getItem("pref:theme") })
        `);
        if (!persisted.dark || persisted.theme !== "dark") {
          throw new Error(`刷新后未恢复：${JSON.stringify(persisted)}`);
        }

        // 4) 清理偏好，避免污染其它用例
        await cdp.evaluate('localStorage.removeItem("pref:theme")');
      } finally {
        cdp.close();
      }
    } finally {
      await chrome.close();
    }
  },
});
