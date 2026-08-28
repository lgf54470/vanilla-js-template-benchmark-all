// apps/web/src/shared/ui/dialog/dialog.js — <ds-dialog> / <ds-confirm-dialog>
//
// 替代 alert/confirm（硬规则 4）。特性（Components.md §8）：遮罩 + 内容区、
// Esc 关闭、聚焦陷阱、关闭后焦点归还触发元素。no-motion 下开合瞬时。
// 命令式调用：confirmDialog({ title, description, confirmLabel, danger }) → Promise<boolean>
//
// 遮罩关闭态必须 pointer-events:none；带 display 声明时必须同步 [hidden]{display:none}
// （CSS.md §9：author 规则压过 UA hidden）。

import { attachStyles, define } from "../base.js";
import { waitForTransition } from "../../lib/dom.js";

const DIALOG_CSS = `
:host{display:contents}
.overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
  background:var(--color-overlay);z-index:var(--z-modal);pointer-events:none}
.overlay[hidden]{display:none}
.overlay[data-open]{pointer-events:auto}
.panel{width:min(28rem,calc(100vw - 2rem));max-height:calc(100vh - 4rem);overflow:auto;
  display:flex;flex-direction:column;gap:var(--ds-dialog-gap);
  padding:var(--ds-dialog-padding);border-radius:var(--ds-dialog-radius);
  background:var(--ds-panel-bg);color:var(--ds-panel-fg);
  box-shadow:var(--ds-overlay-shadow);border:1px solid var(--color-border)}
.title{font-size:1.05rem;font-weight:600}
.desc{font-size:.85rem;color:var(--color-fg-muted)}
.actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.25rem}
::slotted(svg){width:1rem;height:1rem}
`;

class DsDialog extends HTMLElement {
  static observedAttributes = ["open", "title", "description"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, DIALOG_CSS);
    this._lastFocus = null;
    this._onKeydown = (e) => {
      if (e.key === "Escape") this.close();
      if (e.key === "Tab") this._trapFocus(e);
    };
    // 外点关闭挂在遮罩上而非 document：关闭态遮罩 pointer-events:none，
    // 打开它的那次点击穿透过遮罩不会命中；后续点击遮罩空白处才关闭。
    // （document 级监听会在同一次 dispatch 里把刚打开的弹层立即关掉，
    //   dropdown 触发器用 stopPropagation 规避，dialog/sheet 用遮罩点击方案）
    this._onOverlayClick = (e) => {
      if (e.target === this._overlay) this.close();
    };
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div class="overlay" hidden>
        <div class="panel" role="dialog" aria-modal="true">
          <div class="title"></div>
          <div class="desc"></div>
          <slot></slot>
          <slot name="actions"></slot>
        </div>
      </div>`;
    this._overlay = this.shadowRoot.querySelector(".overlay");
    this._panel = this.shadowRoot.querySelector(".panel");
    this._titleEl = this.shadowRoot.querySelector(".title");
    this._descEl = this.shadowRoot.querySelector(".desc");
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
    this._titleEl.textContent = this.getAttribute("title") ?? "";
    this._descEl.textContent = this.getAttribute("description") ?? "";
    if (open) {
      this._lastFocus = document.activeElement;
      // 等待面板渲染后聚焦内部首个可聚焦元素
      requestAnimationFrame(() => {
        const focusable = this._panel.querySelectorAll(
          "button,input,select,textarea,a[href],[tabindex]:not([tabindex='-1'])",
        );
        (focusable[0] ?? this._panel).focus();
      });
    } else if (this._lastFocus) {
      this._lastFocus.focus?.();
      this._lastFocus = null;
    }
  }
  _trapFocus(e) {
    if (!this.hasAttribute("open")) return;
    const focusable = [...this._panel.querySelectorAll(
      "button,input,select,textarea,a[href],[tabindex]:not([tabindex='-1'])",
    )];
    if (focusable.length === 0) {
      e.preventDefault();
      this._panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  show() {
    this.setAttribute("open", "");
  }
  close() {
    if (!this.hasAttribute("open")) return;
    const panel = this._panel;
    this.removeAttribute("open");
    // no-motion 下立即完成；有动效时等过渡结束再隐藏
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
define("ds-dialog", DsDialog);

const CONFIRM_CSS = `
:host{display:contents}
:host([danger]) .confirm-btn{background:var(--color-danger);color:var(--color-danger-fg)}
:host([danger]) .confirm-btn:hover{background:var(--color-danger)}
`;

class DsConfirmDialog extends DsDialog {
  constructor() {
    super();
    // 在 attachStyles 之后再注入 confirm 专用样式
    queueMicrotask(() => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(CONFIRM_CSS);
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        sheet,
      ];
    });
    this._resolve = null;
    this._confirmLabel = "确认";
    this._cancelLabel = "取消";
  }
  static get observedAttributes() {
    return [
      ...DsDialog.observedAttributes,
      "confirm-label",
      "cancel-label",
      "danger",
    ];
  }
  attributeChangedCallback(name, old, value) {
    if (name === "confirm-label") this._confirmLabel = value ?? "确认";
    if (name === "cancel-label") this._cancelLabel = value ?? "取消";
    super.attributeChangedCallback(name, old, value);
  }
  connectedCallback() {
    super.connectedCallback();
    // 重放渲染以加入 action 按钮（DsDialog.connectedCallback 已 sync 一次）
    this._ensureActions();
  }
  _ensureActions() {
    const slot = this.shadowRoot.querySelector('slot[name="actions"]');
    if (this.shadowRoot.querySelector(".actions")) return;
    const actions = document.createElement("div");
    actions.className = "actions";
    const cancel = document.createElement("button");
    cancel.className = "cancel-btn";
    cancel.textContent = this._cancelLabel;
    cancel.addEventListener("click", () => this._settle(false));
    const confirm = document.createElement("button");
    confirm.className = "confirm-btn";
    confirm.textContent = this._confirmLabel;
    confirm.addEventListener("click", () => this._settle(true));
    actions.append(cancel, confirm);
    slot.before(actions);
  }
  _settle(result) {
    this.close();
    this._resolve?.(result);
    this._resolve = null;
  }
  /** 命令式调用：resolve(true/false) */
  request() {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this.show();
    });
  }
}
define("ds-confirm-dialog", DsConfirmDialog);

/** 全局 confirmDialog 助手：挂在 body 上一次性实例（Components.md §8） */
let confirmInstance = null;
export function confirmDialog(
  {
    title,
    description,
    confirmLabel = "确认",
    cancelLabel = "取消",
    danger = false,
  } = {},
) {
  if (!confirmInstance) {
    confirmInstance = document.createElement("ds-confirm-dialog");
    document.body.append(confirmInstance);
  }
  confirmInstance.setAttribute("title", title ?? "");
  confirmInstance.setAttribute("description", description ?? "");
  confirmInstance.setAttribute("confirm-label", confirmLabel);
  confirmInstance.setAttribute("cancel-label", cancelLabel);
  confirmInstance.toggleAttribute("danger", !!danger);
  return confirmInstance.request();
}
