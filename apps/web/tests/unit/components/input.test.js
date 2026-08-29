// apps/web/tests/unit/components/input.test.js — <ds-input>/<ds-textarea> 值反射单测
//
// 回归保护历史 bug：ds-input/ds-textarea 曾只派发 input 事件、从不把实时输入写回
// 宿主 value 属性，导致所有 getAttribute("value") 读取方（登录、notes、settings）
// 在真实键入时拿到空串。此处断言键入后宿主 value 属性即时同步，且程序化改 value
// 属性也能同步回内部 field（不整棵 re-render）。

import { equal as assertEqual } from "node:assert/strict";
import { installWebComponentGlobals } from "./webcomponent-shim.js";
installWebComponentGlobals();

let modPromise;
function load() {
  if (!modPromise) {
    modPromise = import("../../../src/shared/ui/input/input.js").then(() => {});
  }
  return modPromise;
}

function makeInput() {
  const Ctor = globalThis.customElements.get("ds-input");
  return {
    host: new Ctor(),
    Ctor,
  };
}
function makeTextarea() {
  const Ctor = globalThis.customElements.get("ds-textarea");
  return {
    host: new Ctor(),
    Ctor,
  };
}

Deno.test("ds-input: 实时键入反射回宿主 value 属性", async () => {
  await load();
  const { host } = makeInput();
  host.connectedCallback();
  // 初始无值
  assertEqual(host.getAttribute("value"), null);
  // 模拟键入：设置内部 field 值后触发 input
  host._input.value = "s3cret";
  assertEqual(host.getAttribute("value"), null); // 触发前尚未反射
  host._input.dispatchEvent({ type: "input" });
  assertEqual(host.getAttribute("value"), "s3cret");
  // 再次键入覆盖
  host._input.value = "";
  host._input.dispatchEvent({ type: "input" });
  assertEqual(host.getAttribute("value"), "");
});

Deno.test("ds-input: 程序化改 value 属性同步回内部 field（不重建 DOM）", async () => {
  await load();
  const { host } = makeInput();
  host.connectedCallback();
  const firstInput = host._input;
  host.setAttribute("value", "预填");
  // 手动触发 attributeChangedCallback（shim 不自动观察属性）——应只同步值、不重建
  host.attributeChangedCallback("value");
  assertEqual(host._input, firstInput); // 引用未变：未 re-render
  assertEqual(host._input.value, "预填");
});

Deno.test("ds-input: 密码框类型保留为 password", async () => {
  await load();
  const { host } = makeInput();
  host.setAttribute("type", "password");
  host.connectedCallback();
  assertEqual(host._input.type, "password");
});

Deno.test("ds-textarea: 实时键入反射回宿主 value 属性", async () => {
  await load();
  const { host } = makeTextarea();
  host.connectedCallback();
  assertEqual(host.getAttribute("value"), null);
  host._area.value = "第一行\n第二行";
  host._area.dispatchEvent({ type: "input" });
  assertEqual(host.getAttribute("value"), "第一行\n第二行");
});
