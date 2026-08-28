// apps/web/src/shared/ui/sheet/sheet.js — <ds-sheet>
//
// 抽屉（Components.md §2）：移动端 Sidebar 与通用侧滑面板复用。
// side=left|right，全屏遮罩 + 抽屉面板，Esc 关闭，外点关闭。
// no-motion 下开合瞬时；关闭等 waitForTransition 再隐藏（CSS.md §9）。

import { attachStyles, define } from "../base.js";
import { waitForTransition } from "../../lib/dom.js";

const SHEET_CSS = `
:host{display:contents}
.overlay{position:fixed;inset:0;background:var(--color-overlay);
  z-index:var(--z-sheet);pointer-events:none}
.overlay[hidden]{display:none}
.overlay[data-open]{pointer-events:auto}
.panel{position:fixed;top:0;bottom:0;width:min(24rem,calc(100vw - 2rem));
  background:var(--ds-panel-bg);color:var(--ds-panel-fg);
  box-shadow:var(--ds-sheet-shadow);z-index:var(--z-sheet);
  display:flex;flex-direction:column;pointer-events:none}
:host([side="left"]) .panel{left:0}
:host([side="right"]) .panel{right:0}
.overlay[data-open] .panel{pointer-events:auto}
.content{flex:1;overflow:auto;min-height:0}
`;

class DsSheet extends HTMLElement {
  static observedAttributes = ["open", "side"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, SHEET_CSS);
    this._onKeydown = (e) => {
      if (e.key === "Escape") this.close();
    };
    // 外点关闭挂在遮罩上（见 dialog.js 同款注释：关闭态 pointer-events:none
    // 保证"打开它的那次点击"不会立即关掉它）
    this._onOverlayClick = (e) => {
      if (e.target === this._overlay) this.close();
    };
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div class="overlay" hidden>
        <div class="panel" role="dialog" aria-modal="true">
          <div class="content"><slot></slot></div>
        </div>
      </div>`;
    this._overlay = this.shadowRoot.querySelector(".overlay");
    this._panel = this.shadowRoot.querySelector(".panel");
    document.addEventListener("keydown", this._onKeydown);
    this._overlay.addEventListener("click", this._onOverlayClick);
    this._sync();
  }
  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeydown);
  }
  attributeChangedCallback() {
    if (this._overlay) this._sync();
  }
  _sync() {
    const open = this.hasAttribute("open");
    this._overlay.toggleAttribute("hidden", !open);
    this._overlay.toggleAttribute("data-open", open);
  }
  show() {
    this.setAttribute("open", "");
  }
  close() {
    if (!this.hasAttribute("open")) return;
    const panel = this._panel;
    this.removeAttribute("open");
    waitForTransition(panel).then(() => {
      if (!this.hasAttribute("open")) this._overlay.hidden = true;
    });
  }
  get open() {
    return this.hasAttribute("open");
  }
  set open(v) {
    this.toggleAttribute("open", !!v);
  }
}
define("ds-sheet", DsSheet);
