// apps/web/tests/unit/lib/dom.test.js — DOM 工具（CSS.md §9 no-motion 约束）
// waitForTransition 在 no-motion（transitionDuration=0s）下立即 resolve，禁止
// 依赖 transitionend；isOutsideClick 走 composedPath（shadow 穿透）；可见性。
import { equal } from "node:assert/strict";
import { installDomShim } from "./dom-shim.js";
import {
  isElementVisible,
  isOutsideClick,
  waitForTransition,
} from "../../../src/shared/lib/dom.js";

Deno.test("waitForTransition: no-motion 下立即完成（transitionDuration=0s）", async () => {
  const shim = installDomShim();
  try {
    const el = {}; // 桩元素；getComputedStyle 返回 0s → 立即 resolve
    await waitForTransition(el, 50);
    equal(true, true);
  } finally {
    shim.restore();
  }
});

Deno.test("waitForTransition: 有过渡时长时等 transitionend，完成即解绑", async () => {
  const shim = installDomShim();
  try {
    globalThis.getComputedStyle = () => ({ transitionDuration: "0.2s" });
    const el = shim.document.createElement("div");
    let resolved = false;
    const p = waitForTransition(el, 400).then(() => {
      resolved = true;
    });
    const handlers = [...(el._listeners["transitionend"] ?? [])];
    equal(handlers.length, 1); // 已注册 transitionend 监听
    handlers[0](); // 触发过渡结束
    await p;
    equal(resolved, true);
    equal(el._listeners["transitionend"]?.size ?? 0, 0); // 完成即解绑
  } finally {
    shim.restore();
  }
});

Deno.test("isOutsideClick: composedPath 含/不含容器判定", () => {
  const shim = installDomShim();
  try {
    const container = { id: "panel" };
    equal(
      isOutsideClick({ composedPath: () => [{}, container] }, container),
      false,
    );
    equal(
      isOutsideClick({ composedPath: () => ["root", "other"] }, container),
      true,
    );
  } finally {
    shim.restore();
  }
});

Deno.test("isElementVisible: 依据 getClientRects().length", () => {
  const shim = installDomShim();
  try {
    const el = shim.document.createElement("div");
    equal(isElementVisible(el), false); // 桩默认 0
    el.getClientRects = () => ({ length: 1 });
    equal(isElementVisible(el), true);
  } finally {
    shim.restore();
  }
});
