// apps/web/tests/unit/components/button.test.js — <ds-button> 表单提交行为单测
//
// 回归保护历史 bug：ds-button 的 shadow 内原生 <button> 与宿主所在 light-DOM
// <form> 无关联，浏览器不会自动提交流表单（登录按钮点击后毫无反应、也无任何
// console error）。修复为：type=submit 时点击手动 requestSubmit() 最近宿主 form，
// 内部按钮一律按 type="button" 处理。此处断言该触发路径与禁用/非 submit 分支。

import { equal as assertEqual } from "node:assert/strict";
import { installWebComponentGlobals } from "./webcomponent-shim.js";
installWebComponentGlobals();

let modPromise;
function load() {
  if (!modPromise) {
    modPromise = import("../../../src/shared/ui/button/button.js").then(
      () => {},
    );
  }
  return modPromise;
}
function makeButton(type) {
  const Ctor = globalThis.customElements.get("ds-button");
  if (!Ctor) throw new Error("ds-button 未注册（先 await load()）");
  const host = new Ctor();
  if (type !== undefined) host.setAttribute("type", type);
  host.connectedCallback();
  return host;
}
function formStub(record) {
  return {
    requestSubmit: () => {
      record.called += 1;
    },
  };
}

Deno.test("ds-button: type=submit 点击时 requestSubmit 最近宿主 form", async () => {
  await load();
  const record = { called: 0 };
  const host = makeButton("submit");
  host.closest = () => formStub(record);
  host._button.dispatchEvent({ type: "click" });
  assertEqual(record.called, 1);
});

Deno.test("ds-button: 无 type（默认 button）点击不提交", async () => {
  await load();
  const record = { called: 0 };
  const host = makeButton();
  host.closest = () => formStub(record);
  host._button.dispatchEvent({ type: "click" });
  assertEqual(record.called, 0);
});

Deno.test("ds-button: disabled 时点击不提交", async () => {
  await load();
  const record = { called: 0 };
  const host = makeButton("submit");
  host.setAttribute("disabled", "");
  host.attributeChangedCallback(); // 触发重渲染（_button 重建）
  host.closest = () => formStub(record);
  host._button.dispatchEvent({ type: "click" });
  assertEqual(record.called, 0);
});

Deno.test("ds-button: 内部 button type 恒为 button（避免 shadow 歧义提交）", async () => {
  await load();
  const host = makeButton("submit");
  assertEqual(host._button.type, "button");
});
