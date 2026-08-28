// scripts/e2e/m6-modules-smoke.js — M6 模块冒烟（一次性验收脚本）
//
// 覆盖：登录 → 9 个模块逐路由渲染（标题翻译、无 console.error）→ 笔记
// CRUD（新建/列表/编辑/删除）→ 工作空间切换隔离 → 设置保存。hash 路由由
// location.hash 驱动（assemble/router）。

import { launchHeadless } from "./headless.js";

const BASE = "http://127.0.0.1:8790";
const headless = await launchHeadless({ port: 9360, url: BASE });
const { page } = headless;

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`,
  );
}

async function waitFor(expr, label, timeoutMs = 9000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const v = await page.eval(`!!(${expr})`);
    if (v) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`等待超时: ${label}`);
}

async function nav(route) {
  await page.eval(`location.hash = "#${route}"`);
}

/** 导航到模块并等其标题渲染，返回标题文本 */
async function gotoModule(route, titleKeyExpr) {
  await nav(route);
  await waitFor(
    `[...document.querySelectorAll(".page-title,.settings-title,.notes-title")].some(el => el.textContent.trim() !== "")`,
    `${route} 渲染`,
  );
  return page.eval(
    `[...document.querySelectorAll(".page-title,.settings-title,.notes-title")].map(el => el.textContent.trim()).join(",")`,
  );
}

try {
  await page.navigate(`${BASE}/`);
  await waitFor(`document.querySelector("ds-input")`, "登录页");
  await page.eval(`(() => {
    document.querySelector("ds-input").setAttribute("value", "admin");
    document.querySelector(".login-form").requestSubmit();
  })()`);
  await waitFor("document.querySelector('ds-app-shell')", "壳装配");

  // 逐个模块路由
  const routes = [
    { r: "/dashboard", zh: "仪表盘" },
    { r: "/channels", zh: "频道" },
    { r: "/tokens", zh: "令牌" },
    { r: "/logs", zh: "日志" },
    { r: "/system", zh: "系统" },
    { r: "/docs", zh: "文档" },
    { r: "/auth", zh: "认证" },
    { r: "/settings/profile", zh: "设置" },
  ];
  for (const { r, zh } of routes) {
    const title = await gotoModule(r);
    check(`${r} 渲染`, title.includes(zh), title);
  }

  // 笔记模块 CRUD
  await nav("/notes");
  await waitFor(`document.querySelector(".notes-page")`, "笔记页");
  const emptyShown = await page.eval(
    `!document.querySelector("#empty").hidden`,
  );
  check("笔记初始空状态", emptyShown);

  // 新建
  await page.eval(`document.querySelector("#btn-new").click()`);
  await waitFor(
    `document.querySelector("#dialog").hasAttribute("open")`,
    "新建对话框打开",
  );
  await page.eval(`(() => {
    const d = document.querySelector("ds-app-shell");
    const root = document;
    root.querySelector("#f-title").setAttribute("value", "买牛奶");
    root.querySelector("#f-content").setAttribute("value", "记得带环保袋");
    root.querySelector("#f-tag").setAttribute("value", "生活");
    root.querySelector("#dialog-save").click();
  })()`);
  await waitFor(
    `[...document.querySelectorAll(".note-card__title")].some(el => el.textContent === "买牛奶")`,
    "笔记创建后出现",
  );
  check("笔记新建 → 列表出现", true);

  const cardCount1 = await page.eval(
    `document.querySelectorAll(".note-card").length`,
  );
  check("列表 1 条", cardCount1 === 1, `count=${cardCount1}`);

  // 编辑：改标题
  await page.eval(`(() => {
    const card = document.querySelector(".note-card");
    card.querySelector("ds-icon-button[aria-label='编辑']").click();
  })()`);
  await waitFor(
    `document.querySelector("#f-title").getAttribute("value") === "买牛奶"`,
    "编辑对话框预填",
  );
  await page.eval(`(() => {
    document.querySelector("#f-title").setAttribute("value", "买牛奶（大瓶）");
    document.querySelector("#f-pinned").setAttribute("checked", "");
    document.querySelector("#dialog-save").click();
  })()`);
  await waitFor(
    `[...document.querySelectorAll(".note-card__title")].some(el => el.textContent === "买牛奶（大瓶）")`,
    "编辑保存生效",
  );
  check("笔记编辑 → 标题更新", true);

  // 工作空间隔离：切到 ws_work → 笔记为空（默认空间数据不可见）
  await page.eval(`(() => {
    const w = document.querySelector("ds-workspace-switcher");
    [...w.shadowRoot.querySelectorAll(".ws-row")]
      .find(r => r.dataset.id === "ws_work").click();
  })()`);
  await waitFor(
    `document.querySelector("ds-workspace-switcher")?.getAttribute("value") === "ws_work" && document.querySelector("#empty")?.hidden === false`,
    "切 ws_work 后笔记隔离为空",
  );
  check("工作空间隔离（ws_work 无笔记）", true);

  // 切回默认空间 → 笔记还在（校验删除）
  await page.eval(`(() => {
    const w = document.querySelector("ds-workspace-switcher");
    [...w.shadowRoot.querySelectorAll(".ws-row")]
      .find(r => r.dataset.id === "ws_default").click();
  })()`);
  await waitFor(
    `[...document.querySelectorAll(".note-card__title")].some(el => el.textContent === "买牛奶（大瓶）")`,
    "回默认空间笔记仍在",
  );
  check("回默认空间笔记仍在", true);

  // 删除 → 确认 → 空状态
  await page.eval(`(() => {
    const card = document.querySelector(".note-card");
    card.querySelector("ds-icon-button[aria-label='删除']").click();
  })()`);
  await waitFor(
    `document.querySelector("ds-confirm-dialog")?.hasAttribute("open")`,
    "删除确认框",
  );
  await page.eval(`(() => {
    const confirm = document.querySelector("ds-confirm-dialog");
    confirm.shadowRoot.querySelector(".confirm-btn").click();
  })()`);
  await waitFor(
    `document.querySelector("#empty")?.hidden === false`,
    "删除后空状态",
  );
  check("笔记删除 → 空状态", true);

  // 设置保存 nickname
  await nav("/settings/profile");
  await waitFor(`document.querySelector("#nickname")`, "设置 profile");
  await page.eval(`(() => {
    document.querySelector("#nickname").setAttribute("value", "管理员");
    document.querySelector("#save-profile").click();
  })()`);
  await new Promise((r) => setTimeout(r, 500));
  const navUser = await page.eval(
    `document.querySelector("ds-nav-user")?.getAttribute("name")`,
  );
  check("保存昵称 → nav-user 更新", navUser === "管理员", navUser);

  // 无 console.error
  const errors = page.consoleErrors();
  check(
    "无 console.error",
    errors.length === 0,
    errors.slice(0, 4).join(" | "),
  );
} catch (err) {
  check("脚本异常", false, err.message);
}

await headless.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
if (failed.length) Deno.exit(1);
