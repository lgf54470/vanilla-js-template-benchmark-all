// apps/web/src/app/shell/app-shell.js — <ds-app-shell> 顶层布局壳
//
// 纯 light-DOM 布局容器（无 shadow，理由同 ds-sidebar-provider：壳层是装配骨架，
// 需要让子组件经 closest() 找到 provider，shadow 边界会切断该链）。结构：
//   ds-sidebar-provider.app-shell（两列网格，样式在 app-shell.css）
//     ├─ ds-sidebar.app-shell__sidebar      ← 装配层填入 header/content/footer/rail
//     └─ .app-shell__inset（header + main） ← 装配层填入 ds-app-header 与模块挂载
//
// 职责（Layout.md §1 / §1.1）：
// 1. 渲染两列网格骨架 + 注入 app-shell.css（ensurePageStyles → document.head）；
// 2. bindResizeHandle：rail 拖拽调宽 —— rAF 节流「同帧双写」
//    --sidebar-current-width（网格列）与 --sidebar-width（面板令牌），
//    松手持久化 appearance.setSidebarWidth，宽度 < MIN+SNAP 吸附折叠；
// 3. 拖拽宽度数值气泡；
// 4. 订阅 provider store，展开/收起时把网格列同步为对应宽度。

import { define } from "../../shared/ui/base.js";
import { appearance } from "../../shared/lib/appearance.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";
import { SIDEBAR_WIDTH_LIMITS } from "@contracts/constants.js";

const { MIN, MAX, ICON, SNAP } = SIDEBAR_WIDTH_LIMITS;
const DRAG_THRESHOLD = 3; // px：超过才视为拖拽（否则点击透传给 rail 的切换按钮）

const SHELL_HTML = `
  <ds-sidebar-provider class="app-shell">
    <ds-sidebar class="app-shell__sidebar"></ds-sidebar>
    <div class="app-shell__inset">
      <header class="app-shell__header"></header>
      <main class="app-shell__main"></main>
    </div>
  </ds-sidebar-provider>`;

class DsAppShell extends HTMLElement {
  constructor() {
    super();
    this._raf = 0;
    this._dragging = false;
    this._suppressClick = false;
    this._startX = 0;
    this._startY = 0;
    this._lastW = 0;
    this._onMove = (e) => this._handleMove(e);
    this._onUp = () => this._handleUp();
    this._onClickCapture = (e) => {
      if (this._suppressClick) {
        this._suppressClick = false;
        e.stopPropagation(); // 拖拽产生的 click 不透传给 rail 的切换按钮
      }
    };
  }
  connectedCallback() {
    ensurePageStyles(import.meta.url, "./app-shell.css");
    this.innerHTML = SHELL_HTML;
    this._provider = this.querySelector("ds-sidebar-provider");
    this._unsub = this._provider.store.subscribe(() => this._syncWidths());
    this._syncWidths();
    // rail 由装配层稍后填充，用事件委托绑定拖拽（closest 穿透 light DOM 链）
    this.addEventListener(
      "pointerdown",
      this._onDown = (e) => {
        if (this._provider?.isMobile) return;
        if (!e.target.closest?.("ds-sidebar-rail")) return;
        this._startX = e.clientX;
        this._startY = e.clientY;
        try {
          e.target.closest("ds-sidebar-rail").setPointerCapture?.(e.pointerId);
        } catch {
          // 合成事件/部分环境不支持 capture，忽略
        }
        globalThis.addEventListener("pointermove", this._onMove, {
          passive: false,
        });
        globalThis.addEventListener("pointerup", this._onUp);
      },
    );
    this.addEventListener("click", this._onClickCapture, true);
  }
  disconnectedCallback() {
    this._unsub?.();
    globalThis.removeEventListener("pointermove", this._onMove);
    globalThis.removeEventListener("pointerup", this._onUp);
    this.removeEventListener("pointerdown", this._onDown);
    this.removeEventListener("click", this._onClickCapture, true);
    this._bubbleEl?.remove();
    this._bubbleEl = null;
  }
  /** 展开/收起后把网格列宽度写为一致（Layout.md §1.1 双变量同帧写入） */
  _syncWidths() {
    const state = this._provider.store.get();
    const expanded = state.state === "expanded";
    const w = expanded ? appearance.getState().sidebarWidth : ICON;
    this._setWidths(w);
  }
  _setWidths(w) {
    this._provider.style.setProperty("--sidebar-current-width", `${w}px`);
    this._provider.style.setProperty("--sidebar-width", `${w}px`);
    this._lastW = w;
  }
  _handleMove(e) {
    const dx = e.clientX - this._startX;
    const dy = e.clientY - this._startY;
    if (!this._dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!this._dragging) {
      this._dragging = true;
      this._suppressClick = true;
      document.body.classList.add("sidebar-resizing");
    }
    e.preventDefault();
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = 0;
      if (!this._dragging) return;
      const rect = this._provider.getBoundingClientRect();
      const w = Math.min(Math.max(e.clientX - rect.left, MIN), MAX);
      this._setWidths(w);
      const bubble = this._bubble();
      bubble.textContent = `${Math.round(w)}px`;
      bubble.style.setProperty("--bubble-x", `${e.clientX}px`);
    });
  }
  _handleUp() {
    globalThis.removeEventListener("pointermove", this._onMove);
    globalThis.removeEventListener("pointerup", this._onUp);
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    if (!this._dragging) return; // 未拖拽：点击透传（rail 切换）
    this._dragging = false;
    // 拖拽产生的 click 紧随 pointerup 在同一任务派发，先抑制它；
    // 下一宏任务恢复，避免吞掉后续真实点击（合成事件无 click 时也会复位）。
    setTimeout(() => {
      this._suppressClick = false;
    }, 0);
    document.body.classList.remove("sidebar-resizing");
    this._bubbleEl?.remove();
    this._bubbleEl = null;
    const w = this._lastW;
    if (w < MIN + SNAP) {
      // 吸附折叠：先清拖拽内联变量避免残留（Layout.md §1.1）
      this._provider.style.removeProperty("--sidebar-current-width");
      this._provider.setOpen(false);
      appearance.setSidebarOpen(false);
    } else {
      appearance.setSidebarWidth(w);
    }
    this._syncWidths();
  }
  _bubble() {
    if (!this._bubbleEl) {
      this._bubbleEl = document.createElement("div");
      this._bubbleEl.className = "resize-bubble";
      document.body.append(this._bubbleEl);
    }
    return this._bubbleEl;
  }
}
define("ds-app-shell", DsAppShell);
