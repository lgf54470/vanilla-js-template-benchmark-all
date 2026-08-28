/**
 * shared/core/router.js — History API 路由（ARCHITECTURE §5）。
 *
 * 极简路由器：setRoutes 注册 { path, module } 清单，navigate/popcstate
 * 触发订阅回调；模块按「精确匹配 → 前缀匹配」解析（子路由命中父模块）。
 * 懒加载（import(modules/<id>/index.js)）由 app/router 层完成，
 * 本文件不感知模块结构。
 */

/** @type {Array<{ path: string, module: string }>} */
let routes = [];

/** @type {Set<(path: string) => void>} */
const listeners = new Set();

/** 当前路径（无 pathname 环境——如测试——回落 "/"）。 */
export function currentPath() {
  return globalThis.location?.pathname || "/";
}

/**
 * 注册路由清单（整体替换）。
 * @param {Array<{ path: string, module: string }>} list
 */
export function setRoutes(list) {
  routes = Array.isArray(list) ? [...list] : [];
}

/**
 * 订阅路径变化（navigate / popstate 均触发；同路径重复 navigate 也触发，
 * 便于调用方强制重挂）。
 * @param {(path: string) => void} fn
 * @returns {() => void} 取消订阅
 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  const path = currentPath();
  for (const fn of listeners) {
    try {
      fn(path);
    } catch (err) {
      console.error("router: 订阅处理器异常", err);
    }
  }
}

/**
 * 编程式导航（pushState；replace 用于登录页 /login 同步等场景）。
 * @param {string} path
 * @param {{ replace?: boolean }} [options]
 */
export function navigate(path, options = {}) {
  if (options.replace) globalThis.history?.replaceState(null, "", path);
  else globalThis.history?.pushState(null, "", path);
  notify();
}

/**
 * 通知当前路径的所有订阅者（不改变历史栈）。
 * 工作空间切换等需要强制重挂当前模块的场景使用（Workspace.md §4）。
 */
export function reload() {
  notify();
}
/** 启动 popstate 监听（main.js 装配壳层时调用一次）。 */
export function start() {
  globalThis.addEventListener?.("popstate", notify);
}

/** 停止监听（壳层拆除时调用，防止泄漏）。 */
export function stop() {
  globalThis.removeEventListener?.("popstate", notify);
}

/**
 * 解析路径命中的路由（精确优先，其次最长前缀）。
 * @param {string} path
 * @returns {{ path: string, module: string } | null}
 */
export function matchRoute(path) {
  const exact = routes.find((r) => r.path === path);
  if (exact) return exact;
  const prefix = routes
    .filter((r) => path.startsWith(`${r.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return prefix ?? null;
}
