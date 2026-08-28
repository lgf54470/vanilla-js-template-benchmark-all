// apps/web/tests/unit/components/store.test.js — 组件状态机引擎单测（Components.md §3.2）
//
// <ds-sidebar-provider> 的 open/state 折叠状态机基于 shared/core/store.js 的
// createStore。本测试覆盖引擎本身的行为契约：get 返回快照、浅比较跳过无变化
// 通知、set 触发订阅（含 prev）、unsubscribe 取消订阅。组件生命周期（DOM 挂载 /
// matchMedia / localStorage）由 M3 CDP 冒烟在真实浏览器里验证，不在此重复搭建
// DOM 桩。
import { deepStrictEqual as assertEqual } from "node:assert/strict";
import { createStore } from "../../../src/shared/core/store.js";

Deno.test("store.get 返回不可变快照（改快照不影响内部状态）", () => {
  const store = createStore({ open: true, state: "expanded" });
  const snap = store.get();
  snap.open = false;
  assertEqual(store.get().open, true);
});

Deno.test("store 浅比较跳过无变化通知，仅变化时触发订阅", () => {
  const store = createStore({ open: true, state: "expanded" });
  let calls = 0;
  store.subscribe(() => calls++);
  store.set({ open: true }); // 无变化：不应通知
  assertEqual(calls, 0);
  store.set({ open: false, state: "collapsed" });
  assertEqual(calls, 1);
});

Deno.test("store 订阅回调收到 { next, prev }，set 支持部分 patch 合并", () => {
  const store = createStore({ open: true, state: "expanded", isMobile: false });
  const seen = [];
  store.subscribe((next, prev) => seen.push({ next, prev }));
  store.set({ isMobile: true }); // 只改一个字段
  assertEqual(seen.length, 1);
  assertEqual(seen[0].next, { open: true, state: "expanded", isMobile: true });
  assertEqual(seen[0].prev, { open: true, state: "expanded", isMobile: false });
});

Deno.test("store.unsubscribe 后不再收到通知", () => {
  const store = createStore({ n: 0 });
  let calls = 0;
  const unsub = store.subscribe(() => calls++);
  unsub();
  store.set({ n: 1 });
  assertEqual(calls, 0);
});

Deno.test("store 折叠状态机：toggleSidebar 语义（翻转 open/state）", () => {
  // 模拟 sidebar-provider.toggleSidebar 依赖的 state 推导
  const store = createStore({ open: true, state: "expanded" });
  const flip = () => {
    const s = store.get();
    store.set({ open: !s.open, state: !s.open ? "expanded" : "collapsed" });
  };
  flip();
  assertEqual(store.get(), { open: false, state: "collapsed" });
  flip();
  assertEqual(store.get(), { open: true, state: "expanded" });
});
