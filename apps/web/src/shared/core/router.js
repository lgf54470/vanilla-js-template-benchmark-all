// apps/web/src/shared/core/router.js — 极简 hash 路由
//
// 路由格式 #/dashboard、#/notes/all。location.hash 驱动；路由变化触发
// route:change（detail: { path }），壳层监听后动态 import 模块 index.js
// 并 mount。模块懒加载（ARCHITECTURE.md §4.2）。默认路由 /dashboard。

import { emit, on } from "./event-bus.js";

export const DEFAULT_ROUTE = "/dashboard";

function currentHash() {
  return location.hash.replace(/^#/, "") || DEFAULT_ROUTE;
}

export function createRouter() {
  let current = currentHash();

  function navigate(path) {
    if (path === current) return;
    location.hash = path;
  }

  function handle() {
    const next = currentHash();
    if (next === current) return;
    current = next;
    emit("route:change", { path: current });
  }

  globalThis.addEventListener("hashchange", handle);

  return {
    /** 当前路由路径（不含 #） */
    get path() {
      return current;
    },
    navigate,
    handle,
    /** 路由变化订阅，返回取消函数 */
    onRoute(handler) {
      return on("route:change", handler);
    },
  };
}

/** 应用级单例 */
export const router = createRouter();
