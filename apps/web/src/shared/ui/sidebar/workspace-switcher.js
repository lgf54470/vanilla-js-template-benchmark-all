// apps/web/src/shared/ui/sidebar/workspace-switcher.js — <ds-workspace-switcher>
//
// 位于 <ds-sidebar-header>（ARCHITECTURE.md §7.5 / Components.md §4）：
// 触发器 = 当前工作空间图标 + 名称；下拉内容 = 「工作空间」小字标签 → 列表
// （6×6 磁贴 + 名称 + 当前项 circle-check 对勾，data-shortcut 保留）→ 分隔线 →
// + 新建工作空间。点击列表项 → workspace-switcher-select 事件（detail:
// { workspaceId }）→ 壳层经 event-bus 广播 workspace:changed。
// Ctrl+1..6 快捷切换前 6 个（组件内全局注册）。
//
// 工作空间数据由壳层经属性下发：items='[{"id","name","icon"}]'、value=当前 id。

import { attachStyles, define } from "../base.js";
import { iconSvg } from "../../lib/icons.js";
import { t } from "../../lib/i18n.js";

const CSS = `
:host{display:block}
.trigger{display:flex;align-items:center;gap:.5rem;width:100%;
  padding:.35rem .5rem;border-radius:var(--ds-sidebar-menu-item-radius);
  color:var(--color-sidebar-fg);cursor:pointer;background:transparent;text-align:left}
.trigger:hover{background:var(--color-sidebar-accent);color:var(--color-sidebar-accent-fg)}
.tile{display:flex;align-items:center;justify-content:center;width:1.75rem;height:1.75rem;
  border-radius:var(--ds-icon-btn-radius);background:var(--color-sidebar-accent);
  color:var(--color-sidebar-accent-fg);flex:none}
.name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.9rem;
  font-weight:600}
.chevron{display:inline-flex;color:var(--color-sidebar-fg);opacity:.6}
.item-tile{display:flex;align-items:center;justify-content:center;width:1.5rem;height:1.5rem;
  border-radius:var(--ds-icon-btn-radius);border:1px solid var(--color-border);
  background:var(--color-muted);color:var(--color-fg-muted);flex:none}
`;

class DsWorkspaceSwitcher extends HTMLElement {
  static observedAttributes = ["items", "value"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, CSS);
    this._items = [];
    this._value = "";
    this._onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const m = e.key.match(/^([1-6])$/);
      if (!m) return;
      const idx = Number(m[1]) - 1;
      const item = this._items[idx];
      if (item) {
        e.preventDefault();
        this._select(item.id);
      }
    };
  }
  connectedCallback() {
    this._parseAttrs();
    this.shadowRoot.innerHTML = `
      <ds-dropdown-menu class="menu">
        <button slot="trigger" type="button" class="trigger">
          <span class="tile" id="trigger-tile"></span>
          <span class="name" id="trigger-name"></span>
          <span class="chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#i-chevron-down"></use></svg></span>
        </button>
        <div slot="content" class="content-slot">
          <div class="menu-head">${t("shell.nav.workspace")}</div>
          <div class="ws-list"></div>
          <div class="separator"></div>
          <button type="button" class="new-ws">
            <span class="item-tile"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#i-plus"></use></svg></span>
            <span>${t("shell.nav.newWorkspace")}</span>
          </button>
        </div>
      </ds-dropdown-menu>`;
    this._menu = this.shadowRoot.querySelector("ds-dropdown-menu");
    this._list = this.shadowRoot.querySelector(".ws-list");
    this._renderList();
    this._list.addEventListener("click", (e) => {
      const row = e.target.closest?.(".ws-row");
      if (row) this._select(row.dataset.id);
    });
    this.shadowRoot.querySelector(".new-ws").addEventListener("click", () => {
      this._menu.close();
      this.dispatchEvent(
        new CustomEvent("workspace-switcher-create", {
          bubbles: true,
          composed: true,
        }),
      );
    });
    document.addEventListener("keydown", this._onKey);
  }
  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKey);
  }
  attributeChangedCallback() {
    if (this._list) {
      this._parseAttrs();
      this._renderList();
    }
  }
  _parseAttrs() {
    try {
      this._items = JSON.parse(this.getAttribute("items") ?? "[]");
    } catch {
      this._items = [];
    }
    this._value = this.getAttribute("value") ?? "";
  }
  _renderList() {
    if (!this._list) return;
    const current = this._items.find((i) => i.id === this._value);
    const tile = this.shadowRoot.querySelector("#trigger-tile");
    const name = this.shadowRoot.querySelector("#trigger-name");
    if (current) {
      tile.innerHTML = iconSvg(current.icon ?? "folder", 15);
      name.textContent = current.name;
    } else {
      tile.innerHTML = iconSvg("folder", 15);
      name.textContent = "";
    }
    this._list.innerHTML = "";
    this._items.forEach((item, idx) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "ws-row";
      row.dataset.id = item.id;
      row.style.cssText = `
        display:flex;align-items:center;gap:.5rem;width:100%;
        padding:var(--ds-menu-item-padding-y) var(--ds-menu-item-padding-x);
        border-radius:var(--ds-menu-item-radius);cursor:pointer;text-align:left;
        color:var(--color-fg);background:transparent;font-size:.85rem`;
      if (idx < 6) row.setAttribute("data-shortcut", String(idx + 1));
      row.addEventListener("mouseenter", () => {
        row.style.background = "var(--color-muted)";
      });
      row.addEventListener("mouseleave", () => {
        row.style.background = "transparent";
      });
      const tileEl = document.createElement("span");
      tileEl.className = "item-tile";
      tileEl.innerHTML = iconSvg(item.icon ?? "folder", 13);
      const labelEl = document.createElement("span");
      labelEl.style.cssText =
        "flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
      labelEl.textContent = item.name;
      row.append(tileEl, labelEl);
      if (item.id === this._value) {
        const check = document.createElement("span");
        check.style.cssText =
          "display:inline-flex;color:var(--color-primary);flex:none";
        check.innerHTML = iconSvg("circle-check", 15);
        row.append(check);
      }
      this._list.append(row);
    });
  }
  _select(workspaceId) {
    if (workspaceId === this._value) {
      this._menu.close();
      return;
    }
    this.setAttribute("value", workspaceId);
    this._menu.close();
    this.dispatchEvent(
      new CustomEvent("workspace-switcher-select", {
        bubbles: true,
        composed: true,
        detail: { workspaceId },
      }),
    );
  }
  get value() {
    return this._value;
  }
  set value(v) {
    this.setAttribute("value", v);
  }
}
define("ds-workspace-switcher", DsWorkspaceSwitcher);
