// apps/web/tests/unit/components/tabs.test.js — <ds-tabs> 行为单测
//
// 用 webcomponent-shim 实例化真实 <ds-tabs> 类（不渲染像素）：断言默认激活首项、
// _select 切换面板 hidden 与 aria-selected、点击事件、方向键/Home/End 键盘导航、
// 以及冒泡 composed 的 ds-tabs-change。真实浏览器渲染由 M3 CDP 冒烟兜底。
//
// 注意：customElements.define 在模块求值期运行一次，因此本文件在模块作用域安装
// 一次 Web Components 全局（而非每个用例新建 registry），随后动态 import 组件。

import { deepStrictEqual as assertEqual } from "node:assert/strict";
import { installWebComponentGlobals } from "./webcomponent-shim.js";
// 一次性安装（全局 registry 供 define 写入；跨用例共享）
installWebComponentGlobals();

let modPromise;
function load() {
  if (!modPromise) {
    modPromise = import("../../../src/shared/ui/tabs/tabs.js").then(() => {
      // 确保 define() 已同步执行完
    });
  }
  return modPromise;
}
function makeTabs() {
  const Tabs = globalThis.customElements.get("ds-tabs");
  const Tab = globalThis.customElements.get("ds-tab");
  if (!Tabs || !Tab) {
    throw new Error("ds-tabs/ds-tab 未注册（先 await load()）");
  }
  const host = new Tabs();
  const mk = (id, label) => {
    const t = new Tab();
    t.setAttribute("value", id);
    t.setAttribute("label", label);
    t.textContent = label + " 内容";
    return t;
  };
  host.append(mk("overview", "概览"), mk("detail", "明细"), mk("logs", "日志"));
  host.connectedCallback();
  return { host };
}

Deno.test("ds-tabs: 无 value 时默认激活首项", async () => {
  await load();
  const { host } = makeTabs();
  const [t1, t2, t3] = host.children;
  const buttons = () =>
    host.shadowRoot.querySelector(".tablist").querySelectorAll(".tab");
  assertEqual(host.value, "overview");
  assertEqual(t1.hidden, false);
  assertEqual(t2.hidden, true);
  assertEqual(t3.hidden, true);
  assertEqual(buttons().length, 3);
  assertEqual(buttons()[0].getAttribute("aria-selected"), "true");
  assertEqual(buttons()[1].getAttribute("aria-selected"), "false");
});

Deno.test("ds-tabs: _select 切换激活面板并派发 ds-tabs-change", async () => {
  await load();
  const { host } = makeTabs();
  const [t1, t2] = host.children;
  let ev = null;
  host.addEventListener("ds-tabs-change", (e) => (ev = e));
  host._select("detail");
  assertEqual(host.value, "detail");
  assertEqual(t1.hidden, true);
  assertEqual(t2.hidden, false);
  assertEqual(ev.detail.value, "detail");
  assertEqual(ev.bubbles, true);
  assertEqual(ev.composed, true);
  const buttons = () =>
    host.shadowRoot.querySelector(".tablist").querySelectorAll(".tab");
  assertEqual(buttons()[1].getAttribute("aria-selected"), "true");
});

Deno.test("ds-tabs: 点击 tab 按钮触发切换", async () => {
  await load();
  const { host } = makeTabs();
  const buttons = host.shadowRoot.querySelector(".tablist")
    .querySelectorAll(".tab");
  const logsBtn = buttons[2]; // value="logs"
  let ev = null;
  host.addEventListener("ds-tabs-change", (e) => (ev = e));
  host.shadowRoot.fire("click", { composedPath: () => [logsBtn] });
  assertEqual(host.value, "logs");
  assertEqual(ev.detail.value, "logs");
});

Deno.test("ds-tabs: 方向键/Home/End 键盘导航", async () => {
  await load();
  const { host } = makeTabs();
  const key = (k) =>
    host.shadowRoot.fire("keydown", {
      key: k,
      preventDefault() {},
      composedPath: () => [],
    });
  host._select("overview"); // 确保当前锚点
  key("ArrowRight"); // overview → detail
  assertEqual(host.value, "detail");
  key("ArrowLeft"); // detail → overview
  assertEqual(host.value, "overview");
  key("End"); // → logs
  assertEqual(host.value, "logs");
  key("Home"); // → overview
  assertEqual(host.value, "overview");
});
