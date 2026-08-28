// apps/web/src/shared/ui/segmented-control/segmented-control.js — <ds-segmented-control>
//
// 胶囊分段控件（Components.md §7）：role=radiogroup + 子项 role=radio + 方向键切换。
// <ds-theme-switch> 与会话时长选择 2×4 网格复用（后者走 grids="2x4"）。
// 用法：
//   <ds-segmented-control value="system">
//     <ds-segmented-control-item value="system" label="system"></...>
//     ...
//   </ds-segmented-control>

import { attachStyles, define } from "../base.js";

const CSS = `
:host{display:inline-flex}
.group{display:grid;grid-auto-flow:column;gap:.125rem;padding:.125rem;
  border-radius:var(--ds-btn-radius);background:var(--color-muted)}
.group[grids="2x4"]{grid-auto-flow:row;grid-template-columns:repeat(4,1fr);width:100%}
button{display:inline-flex;align-items:center;justify-content:center;gap:.3rem;
  padding:.3rem .8rem;border-radius:calc(var(--ds-btn-radius) - .125rem);
  font-size:var(--ds-btn-font-size);color:var(--color-fg-muted);cursor:pointer;
  white-space:nowrap}
button[aria-checked="true"]{background:var(--color-bg);color:var(--color-fg);
  box-shadow:var(--ds-card-ring)}
button:focus-visible{outline:2px solid var(--color-ring);outline-offset:-2px}
::slotted(svg){width:.9rem;height:.9rem}
`;

class DsSegmentedControlItem extends HTMLElement {
  static observedAttributes = ["value", "label", "icon", "aria-checked"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(
      this,
      `
      :host{display:contents}
      button{all:unset}
    `,
    );
  }
  connectedCallback() {
    this.setAttribute("role", "radio");
    this.tabIndex = -1;
  }
}
define("ds-segmented-control-item", DsSegmentedControlItem);

class DsSegmentedControl extends HTMLElement {
  static observedAttributes = ["value", "grids"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, CSS);
    this._items = [];
  }
  connectedCallback() {
    this.setAttribute("role", "radiogroup");
    this.shadowRoot.innerHTML = '<div class="group"></div>';
    this._group = this.shadowRoot.querySelector(".group");
    this.addEventListener("click", (e) => {
      const item = e.composedPath().find((n) =>
        n instanceof DsSegmentedControlItem
      );
      if (item) this._select(item.getAttribute("value"));
    });
    this.addEventListener("keydown", (e) => {
      const values = this._items.map((i) => i.getAttribute("value"));
      const idx = values.indexOf(this.value);
      if (e.key === "ArrowRight" && idx < values.length - 1) {
        this._select(values[idx + 1]);
      }
      if (e.key === "ArrowLeft" && idx > 0) this._select(values[idx - 1]);
    });
    this._render();
  }
  attributeChangedCallback(name) {
    if (this._group && (name === "value" || name === "grids")) this._render();
  }
  _render() {
    if (!this._group) return;
    const grids = this.getAttribute("grids");
    this._group.setAttribute("grids", grids ?? "");
    this._group.innerHTML = "";
    this._items = [...this.children];
    for (const item of this._items) {
      const value = item.getAttribute("value") ?? "";
      const label = item.getAttribute("label") ?? "";
      const icon = item.getAttribute("icon");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(value === this.value));
      if (icon) {
        btn.innerHTML =
          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#i-${icon}"></use></svg>`;
      }
      if (label) btn.append(document.createTextNode(label));
      btn.addEventListener("click", () => this._select(value));
      btn.addEventListener("keydown", (e) => {
        const values = this._items.map((i) => i.getAttribute("value"));
        const idx = values.indexOf(this.value);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          if (idx < values.length - 1) this._select(values[idx + 1]);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (idx > 0) this._select(values[idx - 1]);
        }
      });
      this._group.append(btn);
      item.tabIndex = -1;
    }
    // 宿主自身按键（radiogroup 焦点在宿主时方向键可用）
    this.tabIndex = 0;
  }
  _select(value) {
    this.setAttribute("value", value);
    this.dispatchEvent(
      new CustomEvent("ds-segmented-control-change", {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
    this._render();
  }
  get value() {
    return this.getAttribute("value") ?? "";
  }
  set value(v) {
    this.setAttribute("value", v);
  }
}
define("ds-segmented-control", DsSegmentedControl);
