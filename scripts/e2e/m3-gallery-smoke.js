// scripts/e2e/m3-gallery-smoke.js — M3 组件库画廊冒烟（一次性验收脚本）
//
// 用法：URL=http://127.0.0.1:8790/__dev/components deno run -A scripts/e2e/m3-gallery-smoke.js
// 覆盖：画廊渲染、掩码字段、对话框开合、确认对话框、toast、侧栏收起/展开、
// workspace 切换事件、下拉菜单外点关闭。

import { launchHeadless } from "./headless.js";

const url = Deno.env.get("URL") ?? "http://127.0.0.1:8790/__dev/components";
const headless = await launchHeadless({ port: 9333 });
const { page } = headless;

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`,
  );
}

try {
  await page.navigate(url);

  // 1. 画廊渲染
  const sections = await page.eval(
    `document.querySelectorAll(".gallery h2").length`,
  );
  check("画廊 9 个分区渲染", sections >= 9, `sections=${sections}`);

  // 2. 掩码字段（property 注入后显示掩码）
  const masks = await page.eval(
    `[...document.querySelectorAll("masked-field")].map(f => f.shadowRoot.querySelector(".text").textContent)`,
  );
  check(
    "邮箱掩码 u***@e*** 样式",
    masks[0] === "****@e*****e.com",
    masks[0],
  );
  check("手机掩码", masks[1] === "138****1234", masks[1]);

  // 3. 眼睛切换 → 明文 + data-revealed
  const revealed = await page.eval(`
    (async () => {
      const f = document.querySelector("masked-field");
      f.shadowRoot.querySelector(".eye").click();
      await new Promise(r => setTimeout(r, 50));
      const text = f.shadowRoot.querySelector(".text").textContent;
      const attr = f.hasAttribute("data-revealed");
      f.shadowRoot.querySelector(".eye").click(); // 切回掩码
      return text + "|" + attr;
    })()
  `);
  check("眼睛切换显示明文", revealed === "user@example.com|true", revealed);

  // 4. 对话框开合
  const dialogOk = await page.eval(`
    (async () => {
      const dlg = document.querySelector("#g-dialog");
      document.querySelector("#g-dialog-open").click();
      await new Promise(r => setTimeout(r, 100));
      const opened = dlg.hasAttribute("open") && !dlg.shadowRoot.querySelector(".overlay").hidden;
      dlg.close();
      await new Promise(r => setTimeout(r, 100));
      const closed = !dlg.hasAttribute("open") && dlg.shadowRoot.querySelector(".overlay").hidden;
      return opened + "|" + closed;
    })()
  `);
  check("对话框开合", dialogOk === "true|true", dialogOk);

  // 5. 确认对话框（danger）开 → 点确认 → 关
  const confirmRes = await page.eval(`
    (async () => {
      document.querySelector("#g-confirm").click();
      await new Promise(r => setTimeout(r, 150));
      const cdlg = document.querySelector("ds-confirm-dialog");
      const opened = cdlg.hasAttribute("open") && cdlg.hasAttribute("danger");
      const confirmBtn = cdlg.shadowRoot.querySelector(".confirm-btn");
      confirmBtn.click();
      await new Promise(r => setTimeout(r, 100));
      return opened + "|" + (cdlg.hasAttribute("open") ? "still-open" : "closed");
    })()
  `);
  check("确认对话框开→确认→关", confirmRes === "true|closed", confirmRes);

  // 6. toast 出现
  const toastOk = await page.eval(`
    (async () => {
      document.querySelector("#g-toast").click();
      await new Promise(r => setTimeout(r, 200));
      const host = document.querySelector("ds-toast-host");
      return host ? host.shadowRoot.querySelectorAll(".item").length : 0;
    })()
  `);
  check("toast 队列渲染", toastOk >= 1, `items=${toastOk}`);

  // 7. 侧栏收起/展开（provider store）
  const sidebarState = await page.eval(`
    (async () => {
      const prov = document.querySelector("ds-sidebar-provider");
      prov.toggleSidebar();
      await new Promise(r => setTimeout(r, 50));
      const collapsed = prov.dataset.state;
      prov.toggleSidebar();
      await new Promise(r => setTimeout(r, 50));
      const expanded = prov.dataset.state;
      return collapsed + "|" + expanded;
    })()
  `);
  check("侧栏收起/展开", sidebarState === "collapsed|expanded", sidebarState);

  // 8. workspace 切换事件
  const wsEvent = await page.eval(`
    (async () => {
      const ws = document.querySelector("ds-workspace-switcher");
      let got = null;
      ws.addEventListener("workspace-switcher-select", e => got = e.detail.workspaceId);
      ws._select("ws_work");
      await new Promise(r => setTimeout(r, 50));
      return got;
    })()
  `);
  check("workspace 切换事件", wsEvent === "ws_work", wsEvent);

  // 9. 下拉菜单外点关闭
  const dropdownOk = await page.eval(`
    (async () => {
      const nav = document.querySelector("ds-nav-user");
      const menu = nav.shadowRoot.querySelector("ds-dropdown-menu");
      menu.toggle();
      await new Promise(r => setTimeout(r, 50));
      const opened = menu.open === true;
      document.body.click();
      await new Promise(r => setTimeout(r, 50));
      return opened + "|" + (menu.open === false);
    })()
  `);
  check("下拉外点关闭", dropdownOk === "true|true", dropdownOk);

  // 10. 无 console error（模块加载零报错）
  const errors = page.consoleErrors();
  check(
    "无 console 错误",
    errors.length === 0,
    errors.join("; ").slice(0, 120),
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} 通过`);
  if (failed.length > 0) Deno.exit(1);
} finally {
  await headless.close();
}
