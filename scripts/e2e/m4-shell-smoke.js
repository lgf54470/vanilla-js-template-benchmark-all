// scripts/e2e/m4-shell-smoke.js — M4 应用壳冒烟（一次性验收脚本）
//
// 用法：deno run -A scripts/e2e/m4-shell-smoke.js
// 前置：dev server 已在 8790 端口运行（或本脚本自管理：见注释）。
// 覆盖（Layout.md / ARCHITECTURE.md §5 验收点）：
//   1. 登录门控：无令牌 → 登录页；错密码报错；对密码进壳
//   2. 两列网格 + 侧栏菜单（registry 驱动、i18n 翻译、激活高亮）
//   3. workspace-switcher（磁贴 + 对勾 + i18n: 前缀翻译）
//   4. nav-user（占位名/未绑定邮箱）
//   5. Header（lang-switch / theme-switch / theme-settings / logout）
//   6. 主题三段切换 → html.dark 即时生效
//   7. 语言切换 → 字典重载 + 壳重建 + 菜单文案变化（en → Dashboard）
//   8. 拖拽调宽（pointer 事件）→ 双变量同帧写入 + 持久化
//   9. rail 点击折叠/展开 → 网格列跟随 icon 宽度
//   10. 登出 → 回登录页

import { launchHeadless } from "./headless.js";

const BASE = "http://127.0.0.1:8790";
const PASSWORD = "admin";

const headless = await launchHeadless({ port: 9340, url: BASE });
const { page } = headless;

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`,
  );
}

/** 轮询等待表达式为真 */
async function waitFor(expr, label, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const v = await page.eval(`!!(${expr})`);
    if (v) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`等待超时: ${label}`);
}

try {
  await page.navigate(`${BASE}/`);
  await waitFor("document.querySelector('.login-card')", "登录页渲染");

  // 1. 登录页渲染
  check("登录页渲染（login-card）", true);
  const loginTitle = await page.eval(
    `document.querySelector(".login-head p")?.textContent`,
  );
  check("登录页标题文案", loginTitle === "输入访问密码以继续", loginTitle);

  // 错密码 → 错误提示
  await page.eval(`(() => {
    const input = document.querySelector("ds-input");
    input.setAttribute("value", "wrong-password");
    document.querySelector(".login-form").requestSubmit();
  })()`);
  await waitFor(
    `document.querySelector(".login-error")?.textContent.includes("密码错误")`,
    "错密码错误提示",
  );
  check("错密码 → 错误提示", true);

  // 对密码 → 进壳
  await page.eval(`(() => {
    document.querySelector("ds-input").setAttribute("value", "${PASSWORD}");
    document.querySelector(".login-form").requestSubmit();
  })()`);
  await waitFor("document.querySelector('ds-app-shell')", "AppShell 装配");
  await waitFor(
    "document.querySelectorAll('ds-sidebar-menu-item').length >= 7",
    "侧栏菜单项",
  );

  // 2. 网格 + 菜单
  const gridCols = await page.eval(
    `getComputedStyle(document.querySelector("ds-sidebar-provider.app-shell")).gridTemplateColumns`,
  );
  check("两列网格", gridCols.split(" ").length === 2, gridCols);
  const menuLabels = await page.eval(`(() => {
    const items = [...document.querySelectorAll("ds-sidebar-menu-item")]
      .map(e => e.getAttribute("label"));
    const colls = [...document.querySelectorAll("ds-collapsible")]
      .map(c => c.getAttribute("label"));
    return items.concat(colls).join(",");
  })()`);
  check(
    "菜单标签（zh-CN 翻译）",
    menuLabels.includes("仪表盘") && menuLabels.includes("笔记") &&
      menuLabels.includes("设置"),
    menuLabels,
  );
  const activeItem = await page.eval(
    `document.querySelector("ds-sidebar-menu-item[isactive='true']")?.getAttribute("label")`,
  );
  check("dashboard 默认激活", activeItem === "仪表盘", activeItem);

  // 3. workspace-switcher：6 项 + 对勾 + i18n 前缀翻译
  await waitFor(
    `document.querySelector("ds-workspace-switcher")?.shadowRoot.querySelectorAll(".ws-row").length === 6`,
    "工作空间列表",
  );
  const wsNames = await page.eval(
    `[...document.querySelectorAll("ds-workspace-switcher")].flatMap(w =>
      [...w.shadowRoot.querySelectorAll(".ws-row")]
        .map(r => r.querySelector("span:nth-child(2)").textContent)
    ).join(",")`,
  );
  check(
    "工作空间 6 项（i18n: 前缀翻译）",
    wsNames.includes("默认") && wsNames.includes("工作") &&
      wsNames.includes("旅行"),
    wsNames,
  );
  const wsCurrent = await page.eval(
    `document.querySelector("ds-workspace-switcher")?.getAttribute("value")`,
  );
  check("当前工作空间 = ws_default", wsCurrent === "ws_default", wsCurrent);

  // 4. nav-user 占位
  const navUser = await page.eval(
    `document.querySelector("ds-nav-user")?.getAttribute("name")`,
  );
  check("nav-user 占位名", navUser === "用户", navUser);

  // 5. Header 部件齐备
  const headerParts = await page.eval(`(() => {
    const h = document.querySelector("ds-app-header");
    const root = h?.shadowRoot;
    return h && root ? {
      lang: !!root.querySelector("ds-lang-switch"),
      theme: !!root.querySelector("ds-theme-switch"),
      settings: !!root.querySelector("ds-theme-settings"),
      logout: !!root.querySelector(".logout"),
    } : null;
  })()`);
  check(
    "Header 部件（lang/theme/settings/logout）",
    headerParts?.lang && headerParts?.theme && headerParts?.settings &&
      headerParts?.logout,
    JSON.stringify(headerParts),
  );

  // 6. 主题切换：dark 即时生效（组件在 Header shadow 内，从 header 根查）
  await page.eval(`(() => {
    const root = document.querySelector("ds-app-header").shadowRoot;
    const ts = root.querySelector("ds-theme-switch");
    ts.shadowRoot.querySelector("button[aria-label='dark']").click();
  })()`);
  await waitFor(
    "document.documentElement.classList.contains('dark')",
    "dark 生效",
  );
  check("主题切换 → html.dark 生效", true);
  // 切回 system
  await page.eval(`(() => {
    const root = document.querySelector("ds-app-header").shadowRoot;
    const ts = root.querySelector("ds-theme-switch");
    ts.shadowRoot.querySelector("button[aria-label='system']").click();
  })()`);
  await waitFor(
    "!document.documentElement.classList.contains('dark')",
    "system 生效",
  );
  check("主题切换 → 回 system", true);

  // 7. 语言切换：en → 菜单文案变化
  await page.eval(`(() => {
    const ls = document.querySelector("ds-app-header").shadowRoot
      .querySelector("ds-lang-switch");
    ls.shadowRoot.querySelector("button.trigger").click();
  })()`);
  await waitFor(
    `document.querySelector("ds-app-header").shadowRoot.querySelector("ds-lang-switch").shadowRoot.querySelectorAll("ds-menu-item").length === 3`,
    "语言菜单弹出",
  );
  await page.eval(`(() => {
    const ls = document.querySelector("ds-app-header").shadowRoot
      .querySelector("ds-lang-switch");
    [...ls.shadowRoot.querySelectorAll("ds-menu-item")]
      .find(i => i.getAttribute("value") === "en").click();
  })()`);
  await waitFor(
    `[...document.querySelectorAll("ds-sidebar-menu-item")].some(e => e.getAttribute("label") === "Dashboard")`,
    "en 菜单重建",
  );
  const enLabels = await page.eval(
    `[...document.querySelectorAll("ds-sidebar-menu-item")].map(e => e.getAttribute("label")).join(",")`,
  );
  check("语言切换 → en 菜单", enLabels.includes("Dashboard"), enLabels);
  const langAttr = await page.eval(`document.documentElement.lang`);
  check("html lang=en", langAttr === "en", langAttr);
  // 切 zh-TW：三语循环的第二站
  await page.eval(`(() => {
    const ls = document.querySelector("ds-app-header").shadowRoot
      .querySelector("ds-lang-switch");
    ls.shadowRoot.querySelector("button.trigger").click();
  })()`);
  await waitFor(
    `document.querySelector("ds-app-header").shadowRoot.querySelector("ds-lang-switch").shadowRoot.querySelectorAll("ds-menu-item").length === 3`,
    "语言菜单（zh-TW）",
  );
  await page.eval(`(() => {
    const ls = document.querySelector("ds-app-header").shadowRoot
      .querySelector("ds-lang-switch");
    [...ls.shadowRoot.querySelectorAll("ds-menu-item")]
      .find(i => i.getAttribute("value") === "zh-TW").click();
  })()`);
  await waitFor(
    `[...document.querySelectorAll("ds-sidebar-menu-item")].some(e => e.getAttribute("label") === "儀表板")`,
    "zh-TW 菜单重建",
  );
  const twLabels = await page.eval(
    `[...document.querySelectorAll("ds-sidebar-menu-item")].map(e => e.getAttribute("label")).join(",")`,
  );
  check("语言切换 → zh-TW 菜单", twLabels.includes("儀表板"), twLabels);
  const wsTw = await page.eval(
    `[...document.querySelectorAll("ds-workspace-switcher")].flatMap(w =>
      [...w.shadowRoot.querySelectorAll(".ws-row")]
        .map(r => r.querySelector("span:nth-child(2)").textContent)
    ).join(",")`,
  );
  check(
    "zh-TW 工作空间名",
    wsTw.includes("工作") && wsTw.includes("旅行"),
    wsTw,
  );
  check(
    "zh-TW 无裸 key",
    !twLabels.includes("menu.title") && !wsTw.includes("workspace.seed"),
    twLabels + "|" + wsTw,
  );
  // 切回 zh-CN
  await page.eval(`(() => {
    const ls = document.querySelector("ds-app-header").shadowRoot
      .querySelector("ds-lang-switch");
    ls.shadowRoot.querySelector("button.trigger").click();
  })()`);
  await waitFor(
    `document.querySelector("ds-app-header").shadowRoot.querySelector("ds-lang-switch").shadowRoot.querySelectorAll("ds-menu-item").length === 3`,
    "语言菜单再次弹出",
  );
  await page.eval(`(() => {
    const ls = document.querySelector("ds-app-header").shadowRoot
      .querySelector("ds-lang-switch");
    [...ls.shadowRoot.querySelectorAll("ds-menu-item")]
      .find(i => i.getAttribute("value") === "zh-CN").click();
  })()`);
  await waitFor(
    `[...document.querySelectorAll("ds-sidebar-menu-item")].some(e => e.getAttribute("label") === "仪表盘")`,
    "zh-CN 恢复",
  );
  check("语言切换 → 回 zh-CN", true);

  // 8. 拖拽调宽：pointer 事件链
  await page.eval(`(() => {
    const rail = document.querySelector("ds-sidebar-rail");
    const shell = document.querySelector("ds-app-shell");
    rail.dispatchEvent(new PointerEvent("pointerdown", {
      clientX: 256, clientY: 200, pointerId: 9, bubbles: true,
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      clientX: 320, clientY: 200, pointerId: 9, bubbles: true, cancelable: true,
    }));
  })()`);
  await new Promise((r) => setTimeout(r, 100));
  await page.eval(`(() => {
    window.dispatchEvent(new PointerEvent("pointermove", {
      clientX: 340, clientY: 200, pointerId: 9, bubbles: true, cancelable: true,
    }));
  })()`);
  await new Promise((r) => setTimeout(r, 100));
  await page.eval(`(() => {
    window.dispatchEvent(new PointerEvent("pointerup", {
      clientX: 340, clientY: 200, pointerId: 9, bubbles: true,
    }));
  })()`);
  await new Promise((r) => setTimeout(r, 150));
  const dragW = await page.eval(`(() => {
    const p = document.querySelector("ds-sidebar-provider.app-shell");
    return {
      current: p.style.getPropertyValue("--sidebar-current-width"),
      width: p.style.getPropertyValue("--sidebar-width"),
    };
  })()`);
  check(
    "拖拽调宽 → 双变量同帧写入",
    dragW.current === "340px" && dragW.width === "340px",
    JSON.stringify(dragW),
  );
  const persistedW = await page.eval(
    `localStorage.getItem("pref:sidebar-width")`,
  );
  check("拖拽松手持久化 pref:sidebar-width", persistedW === "340", persistedW);

  // 9. rail 点击折叠 → 网格列 = icon 宽度
  await page.eval(
    `document.querySelector("ds-sidebar-rail").shadowRoot.querySelector("button").click()`,
  );
  await waitFor(
    `document.querySelector("ds-sidebar")?.dataset.state === "collapsed"`,
    "折叠",
  );
  const collapsedW = await page.eval(
    `document.querySelector("ds-sidebar-provider.app-shell").style.getPropertyValue("--sidebar-current-width")`,
  );
  check("折叠 → 网格列 48px", collapsedW === "48px", collapsedW);
  const iconGrid = await page.eval(
    `getComputedStyle(document.querySelector("ds-sidebar-provider.app-shell")).gridTemplateColumns`,
  );
  check("折叠网格列 = 48px", iconGrid.startsWith("48px"), iconGrid);
  // 展开恢复
  await page.eval(
    `document.querySelector("ds-sidebar-rail").shadowRoot.querySelector("button").click()`,
  );
  await waitFor(
    `document.querySelector("ds-sidebar")?.dataset.state === "expanded"`,
    "展开",
  );
  const expandedW = await page.eval(
    `document.querySelector("ds-sidebar-provider.app-shell").style.getPropertyValue("--sidebar-current-width")`,
  );
  check("展开恢复拖拽宽度", expandedW === "340px", expandedW);

  // 10. 登出 → 回登录页
  await page.eval(
    `document.querySelector("ds-app-header").shadowRoot.querySelector(".logout").click()`,
  );
  await waitFor("document.querySelector('.login-card')", "登出回登录页");
  check("登出 → 回登录页", true);
  const tokenGone = await page.eval(
    `!localStorage.getItem("pref:auth-token") && !sessionStorage.getItem("pref:auth-token-session")`,
  );
  check("登出清除令牌", tokenGone);

  // 控制台错误检查
  const errors = page.consoleErrors();
  check(
    "无 console.error",
    errors.length === 0,
    errors.slice(0, 3).join(" | "),
  );
} catch (err) {
  check("脚本异常", false, err.message);
}

await headless.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
if (failed.length) {
  Deno.exit(1);
}
