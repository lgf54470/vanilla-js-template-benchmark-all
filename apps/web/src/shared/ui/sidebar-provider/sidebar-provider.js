/**
 * ds-sidebar-provider — Sidebar 状态机（docs/Components.md §3.2 / ARCHITECTURE §5.2）。
 *
 * 持有 createStore({ state, open, openMobile, isMobile })；子组件经
 * closest("ds-sidebar-provider").store 订阅（不用框架 Context）。
 * - open 持久化到 localStorage[pref:sidebar-open]（无记录默认展开）。
 * - Ctrl/Cmd+B 全局切换（toggleSidebar）。
 * - <768px 时 isMobile=true，展开状态切换到 openMobile（Sheet 覆盖层）。
 *
 * 本组件同时是顶层网格容器（.app-shell，网格样式在 app-shell.css）。
 */
import { createStore } from "../../core/store.js";
import { mobileMediaQuery } from "../../lib/breakpoints.js";
import { STORAGE_KEYS } from "/packages/contracts/constants.js";

class DsSidebarProvider extends HTMLElement {
  /** @type {{ get, set, subscribe }} */
  store = createStore({
    state: "expanded",
    open: true,
    openMobile: false,
    isMobile: false,
  });

  #mql;
  #unsubscribe;

  connectedCallback() {
    const saved = globalThis.localStorage?.getItem(STORAGE_KEYS.sidebarOpen);
    const open = saved === null ? true : saved === "true";

    this.#mql = mobileMediaQuery();
    const isMobile = this.#mql?.matches ?? false;
    this.#apply({ open, isMobile, openMobile: false });

    this.#mql?.addEventListener("change", (e) => {
      // 切换断点：桌面残留的移动抽屉状态清零
      this.#apply({ isMobile: e.matches, openMobile: false });
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        this.toggleSidebar();
      }
    });

    this.#unsubscribe = this.store.subscribe(() => {
      const { open, isMobile } = this.store.get();
      if (!isMobile) {
        globalThis.localStorage?.setItem(
          STORAGE_KEYS.sidebarOpen,
          String(open),
        );
      }
    });
  }

  disconnectedCallback() {
    this.#unsubscribe?.();
  }

  #apply(patch) {
    const prev = this.store.get();
    const next = { ...prev, ...patch };
    this.store.set({
      ...next,
      state: next.open ? "expanded" : "collapsed",
    });
  }

  /** 桌面态展开/收起。 */
  setOpen(value) {
    this.#apply({ open: Boolean(value) });
  }

  /** 移动态 Sheet 开合。 */
  setOpenMobile(value) {
    this.#apply({ openMobile: Boolean(value) });
  }

  /** Ctrl/Cmd+B 入口：按当前断点切换对应状态。 */
  toggleSidebar() {
    const { open, openMobile, isMobile } = this.store.get();
    if (isMobile) this.setOpenMobile(!openMobile);
    else this.setOpen(!open);
  }
}

customElements.define("ds-sidebar-provider", DsSidebarProvider);
