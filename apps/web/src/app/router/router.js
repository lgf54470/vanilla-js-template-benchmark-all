/**
 * app/router/router.js — 模块路由装配（ARCHITECTURE §4.2/§5）。
 *
 * registry.generated.js 的模块清单注册进 shared/core/router，
 * 路径变化时按「精确 → 最长前缀」解析命中模块并动态 import 其
 * index.js（唯一允许被 shell 动态 import 的文件），调用约定：
 * `await import(mod).mount(mainEl)`；未命中渲染壳层 404。
 */
import {
  currentPath,
  setRoutes,
  start,
  stop,
  subscribe,
} from "/src/shared/core/router.js";
import { MODULE_REGISTRY } from "/src/modules/registry.generated.js";
import { renderNotFound } from "../shell/not-found.js";

/**
 * @param {HTMLElement} mainEl 唯一滚动区（模块 UI 的挂载点）
 * @returns {{ destroy: () => void }}
 */
export function setupRouter(mainEl) {
  setRoutes(
    MODULE_REGISTRY.map((m) => ({ path: m.route, module: m.id })),
  );
  start();

  const unsubscribe = subscribe((path) => renderPath(mainEl, path));
  renderPath(mainEl, currentPath());

  return {
    destroy() {
      unsubscribe();
      stop();
    },
  };
}

/** @param {HTMLElement} mainEl @param {string} path */
async function renderPath(mainEl, path) {
  const hit = matchModule(path);
  if (!hit) {
    renderNotFound(mainEl, path);
    return;
  }
  try {
    const mod = await import(`/src/modules/${hit.id}/index.js`);
    mainEl.replaceChildren();
    await mod.mount?.(mainEl);
  } catch (err) {
    console.error(`router: 模块 ${hit.id} 加载失败`, err);
    renderNotFound(mainEl, path);
  }
}

/** @param {string} path @returns {{ id: string, route: string } | null} */
function matchModule(path) {
  let best = null;
  for (const m of MODULE_REGISTRY) {
    if (path === m.route || path.startsWith(`${m.route}/`)) {
      if (!best || m.route.length > best.route.length) best = m;
    }
  }
  return best;
}
