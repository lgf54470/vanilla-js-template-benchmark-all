// apps/web/src/shared/ui/sidebar/sidebar-provider.js — <ds-sidebar-provider>
//
// 状态机（Components.md §3.2）：持有 open / openMobile / isMobile / state，
// 经 shared/core/store.js 的 createStore 暴露，子组件用
// element.closest('ds-sidebar-provider').store 订阅。默认展开态读
// localStorage['pref:sidebar-open']（无记录默认 true）。Ctrl/Cmd+B 全局切换。
// 无 shadow：本组件是 light-DOM 布局容器，app-shell css 按 [data-state] 布局。

import { define } from "../base.js";
import { createStore } from "../../core/store.js";
import { STORAGE_KEYS } from "@contracts/constants.js";

class DsSidebarProvider extends HTMLElement {
  connectedCallback() {
    const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN);
    const defaultOpen = saved === null ? true : saved === "true";

    this.store = createStore({
      open: defaultOpen,
      openMobile: false,
      isMobile: false,
      state: defaultOpen ? "expanded" : "collapsed",
    });

    this._mq = matchMedia("(max-width: 767px)");
    this._onMq = (e) => this.store.set({ isMobile: e.matches });
    this.store.set({ isMobile: this._mq.matches });
    this._mq.addEventListener("change", this._onMq);

    this._onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        this.toggleSidebar();
      }
    };
    document.addEventListener("keydown", this._onKey);

    this._unsub = this.store.subscribe((s) => {
      this.dataset.state = s.state;
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, String(s.open));
    });
    this.dataset.state = this.store.get().state;
    this.dataset.sidebar = "";
  }
  disconnectedCallback() {
    this._mq?.removeEventListener("change", this._onMq);
    document.removeEventListener("keydown", this._onKey);
    this._unsub?.();
  }
  /** Ctrl/Cmd+B 绑定 */
  toggleSidebar() {
    const s = this.store.get();
    this.store.set({
      open: !s.open,
      state: !s.open ? "expanded" : "collapsed",
    });
  }
  setOpen(v) {
    this.store.set({ open: v, state: v ? "expanded" : "collapsed" });
  }
  setOpenMobile(v) {
    this.store.set({ openMobile: v });
  }
  get isMobile() {
    return this.store.get().isMobile;
  }
}
define("ds-sidebar-provider", DsSidebarProvider);
