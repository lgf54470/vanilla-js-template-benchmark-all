/**
 * ds-confirm-dialog — 确认对话框（docs/Components.md §8）。
 *
 * ds-dialog 的语义封装：内部组合一个 ds-dialog（组合优先，不做 extends）。
 * 属性：title / description / confirm-label(默认「确认」) /
 * cancel-label(默认「取消」) / danger(布尔，确认按钮走 danger 视觉) /
 * open(透传给内部 ds-dialog)。
 * 事件：confirm / cancel（用户点了哪个按钮）+ 透传 dialog-open-change。
 * 确认/取消用原生 button + data-variant 样式（不嵌套 ds-button，避免
 * 跨组件 shadow 嵌套复杂性）。
 * 命令式 API：confirmDialog(options) → Promise<boolean>（见文件末尾）。
 */
import { attachStyles } from "../base.js";
import "../dialog/dialog.js";

const cssUrl = new URL("./confirm-dialog.css", import.meta.url).href;

const DEFAULT_CONFIRM_LABEL = "确认";
const DEFAULT_CANCEL_LABEL = "取消";

class DsConfirmDialog extends HTMLElement {
  static observedAttributes = [
    "open",
    "title",
    "description",
    "confirm-label",
    "cancel-label",
    "danger",
  ];

  /** @type {ShadowRoot} */
  #root;
  /** @type {Element} 内部组合的 ds-dialog */
  #dialog;
  /** @type {HTMLButtonElement} */
  #cancelBtn;
  /** @type {HTMLButtonElement} */
  #confirmBtn;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <ds-dialog>
        <div class="footer" slot="footer">
          <button type="button" class="btn" data-variant="outline"
            data-part="cancel"></button>
          <button type="button" class="btn" data-variant="primary"
            data-part="confirm"></button>
        </div>
      </ds-dialog>`;
    this.#dialog = this.#root.querySelector("ds-dialog");
    this.#cancelBtn = this.#root.querySelector('[data-part="cancel"]');
    this.#confirmBtn = this.#root.querySelector('[data-part="confirm"]');
    this.#cancelBtn.addEventListener("click", () => this.#settle("cancel"));
    this.#confirmBtn.addEventListener("click", () => this.#settle("confirm"));
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
    if (this.hasAttribute("open")) this.#dialog.setAttribute("open", "");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "open") {
      if (newValue !== null) this.#dialog.setAttribute("open", "");
      else this.#dialog.removeAttribute("open");
      return;
    }
    this.#sync();
  }

  get open() {
    return this.#dialog?.hasAttribute("open") ?? false;
  }

  set open(value) {
    if (value) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  get title() {
    return this.getAttribute("title") ?? "";
  }

  set title(value) {
    if (value == null || value === "") this.removeAttribute("title");
    else this.setAttribute("title", value);
  }

  get description() {
    return this.getAttribute("description") ?? "";
  }

  set description(value) {
    if (value == null || value === "") this.removeAttribute("description");
    else this.setAttribute("description", value);
  }

  get confirmLabel() {
    return this.getAttribute("confirm-label") ?? DEFAULT_CONFIRM_LABEL;
  }

  set confirmLabel(value) {
    if (value == null || value === "") {
      this.removeAttribute("confirm-label");
    } else this.setAttribute("confirm-label", value);
  }

  get cancelLabel() {
    return this.getAttribute("cancel-label") ?? DEFAULT_CANCEL_LABEL;
  }

  set cancelLabel(value) {
    if (value == null || value === "") {
      this.removeAttribute("cancel-label");
    } else this.setAttribute("cancel-label", value);
  }

  get danger() {
    return this.hasAttribute("danger");
  }

  set danger(value) {
    if (value) this.setAttribute("danger", "");
    else this.removeAttribute("danger");
  }

  /** 派发 confirm/cancel 事件后关闭内部对话框 */
  #settle(kind) {
    this.dispatchEvent(
      new CustomEvent(kind, { bubbles: true, composed: true }),
    );
    this.open = false;
  }

  /** 属性 → 内部 ds-dialog 属性 + 按钮文案/变体 */
  #sync() {
    if (!this.#dialog) return;
    const pass = (name) => {
      const value = this.getAttribute(name);
      if (value != null) this.#dialog.setAttribute(name, value);
      else this.#dialog.removeAttribute(name);
    };
    pass("title");
    pass("description");
    this.#cancelBtn.textContent = this.cancelLabel;
    this.#confirmBtn.textContent = this.confirmLabel;
    this.#confirmBtn.dataset.variant = this.danger ? "danger" : "primary";
  }
}

customElements.define("ds-confirm-dialog", DsConfirmDialog);

/**
 * 命令式确认框：await confirmDialog({ title, description, danger })。
 * 确认 → resolve(true)；取消 / Esc / 点遮罩 → resolve(false)。
 * 内部动态创建 ds-confirm-dialog 挂 document.body，内部 ds-dialog 关闭
 * 完成（含 waitForTransition 时序）后自动移除节点（命名避开全局
 * confirm()，docs/Components.md §8）。
 * @param {{ title?: string, description?: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} [options]
 * @returns {Promise<boolean>}
 */
export function confirmDialog(options = {}) {
  const {
    title = "",
    description = "",
    confirmLabel = DEFAULT_CONFIRM_LABEL,
    cancelLabel = DEFAULT_CANCEL_LABEL,
    danger = false,
  } = options;
  return new Promise((resolve) => {
    const el = document.createElement("ds-confirm-dialog");
    if (title) el.setAttribute("title", title);
    if (description) el.setAttribute("description", description);
    el.setAttribute("confirm-label", confirmLabel);
    el.setAttribute("cancel-label", cancelLabel);
    if (danger) el.setAttribute("danger", "");
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    el.addEventListener("confirm", () => settle(true));
    el.addEventListener("cancel", () => settle(false));
    // 内部 ds-dialog 关闭完成（含 Esc/遮罩点击路径）后统一收口：结算 + 卸载
    el.addEventListener("dialog-open-change", (event) => {
      if (event.detail?.open === false) {
        settle(false);
        el.remove();
      }
    });
    document.body.append(el);
    el.setAttribute("open", "");
  });
}
