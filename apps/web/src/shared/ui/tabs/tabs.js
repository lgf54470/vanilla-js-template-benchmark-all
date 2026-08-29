// apps/web/src/shared/ui/tabs/tabs.js — <ds-tabs> + <ds-tab>（Components.md §7）
//
// 轻量标签页：宿主 <ds-tabs value="a"> 在 shadow 顶栏渲染 tab 按钮（从子
// <ds-tab value="a" label="甲"> 派生的 label/value），面板内容即子元素默认槽
// 内容，激活态切换 hidden。全站 no-motion（attachStyles 注入），UA 样式重置
// 在 attachStyles 内置。行为：点击 / 方向键 / Home / End 切换，冒泡
// composed 的 CustomEvent "ds-tabs-change"，value 为当前激活 tab。角色语义：
// tablist / tab(aria-selected) / tabpanel(aria-labelledby)。
//
// 用法：
//   <ds-tabs value="a">
//     <ds-tab value="a" label="概览">内容 A</ds-tab>
//     <ds-tab value="b" label="明细">内容 B</ds-tab>
//   </ds-tabs>

import { attachStyles, define } from "../base.js";

const TABS_CSS = `
:host{display:block;width:100%}
.tablist{display:flex;gap:var(--space-1);border-bottom:1px solid var(--color-border);
  margin-bottom:var(--space-4);overflow-x:auto}
.tab{display:inline-flex;align-items:center;gap:var(--space-2);
  padding:var(--space-2) var(--space-3);font-size:var(--ds-btn-font-size);
  color:var(--color-fg-muted);cursor:pointer;white-space:nowrap}
.tab:hover{color:var(--color-fg)}
.tab[aria-selected="true"]{color:var(--color-fg);
  box-shadow:inset 0 -2px 0 var(--color-fg)}
.tab:focus-visible{outline:2px solid var(--color-ring);outline-offset:-2px;
  border-radius:var(--ds-btn-radius)}
::slotted(ds-tab){display:block}
::slotted(ds-tab[hidden]){display:none}
`;

let seq = 0;

/** <ds-tab>：面板容器（value + 可选 label；内容为默认槽渲染）。 */
class DsTab extends HTMLElement {
  static observedAttributes = ["value", "label", "icon"];
  connectedCallback() {
    if (!this.hasAttribute("role")) this.setAttribute("role", "tabpanel");
  }
  get value() {
    return this.getAttribute("value") ?? "";
  }
  set value(v) {
    this.setAttribute("value", v);
  }
}
define("ds-tab", DsTab);

/** <ds-tabs>：顶栏标签 + 面板切换。 */
class DsTabs extends HTMLElement {
  static observedAttributes = ["value"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, TABS_CSS);
    this._uid = ++seq;
  }
  connectedCallback() {
    this.shadowRoot.innerHTML =
      '<div class="tablist" role="tablist"></div><div class="panel"><slot></slot></div>';
    this._tablist = this.shadowRoot.querySelector(".tablist");
    this.shadowRoot.addEventListener("click", (e) => {
      const btn = e.composedPath().find((n) =>
        n instanceof HTMLElement && n.dataset?.value !== undefined
      );
      if (btn && btn.dataset.value !== undefined) {
        this._select(btn.dataset.value);
      }
    });
    this.shadowRoot.addEventListener("keydown", (e) => this._onKey(e));
    this._mo = new MutationObserver(() => this._render());
    this._mo.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["label", "value", "icon"],
    });
    this._render();
  }
  disconnectedCallback() {
    this._mo?.disconnect();
  }
  attributeChangedCallback(name) {
    if (name === "value" && this._tablist) this._render();
  }
  _tabs() {
    return [...this.children].filter((c) => c instanceof DsTab);
  }
  get value() {
    const explicit = this.getAttribute("value");
    if (explicit != null) return explicit;
    return this._tabs()[0]?.getAttribute("value") ?? "";
  }
  set value(v) {
    this.setAttribute("value", v);
  }
  _select(value) {
    this.setAttribute("value", value);
    this.dispatchEvent(
      new CustomEvent("ds-tabs-change", {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
    this._render();
  }
  _render() {
    if (!this._tablist) return;
    this._tablist.innerHTML = "";
    const current = this.value;
    this._tabs().forEach((tab, i) => {
      const value = tab.getAttribute("value") ?? "";
      const label = tab.getAttribute("label") ??
        (((tab.textContent ?? "").trim()) || value);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab";
      btn.dataset.value = value;
      btn.setAttribute("role", "tab");
      btn.id = `ds-tabs-${this._uid}-tab-${i}`;
      btn.setAttribute("aria-selected", String(value === current));
      btn.setAttribute(
        "aria-controls",
        btn.id.replace(/-(tab-\d+)$/, "-panel-$1"),
      );
      btn.tabIndex = value === current ? 0 : -1;
      btn.textContent = label;
      this._tablist.append(btn);
      tab.setAttribute("aria-labelledby", btn.id);
      tab.hidden = value !== current;
    });
  }
  _onKey(e) {
    const values = this._tabs().map((t) => t.getAttribute("value") ?? "");
    const idx = values.indexOf(this.value);
    let next = null;
    if (e.key === "ArrowRight") next = idx < values.length - 1 ? idx + 1 : 0;
    else if (e.key === "ArrowLeft") {
      next = idx > 0 ? idx - 1 : values.length - 1;
    } else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = values.length - 1;
    if (next != null) {
      e.preventDefault();
      this._select(values[next]);
      this._tablist?.querySelectorAll(".tab")[next]?.focus();
    }
  }
}
define("ds-tabs", DsTabs);
