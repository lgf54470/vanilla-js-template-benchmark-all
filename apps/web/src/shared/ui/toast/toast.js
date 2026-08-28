/**
 * ds-toast — 单条 toast 条目（docs/Components.md §8）。
 *
 * 属性：message / type(success|error|info，默认 info)。
 * 手动关闭按钮派发 toast-dismiss（bubbles + composed）交宿主移除本条；
 * 队列/自动消失等宿主逻辑见同目录 toast-host.js。
 */
import { attachStyles, createIcon } from "../base.js";

const cssUrl = new URL("./toast.css", import.meta.url).href;

const TYPES = ["success", "error", "info"];

/** @type {Record<string, string>} type → public/icons.svg 的 symbol id */
const TYPE_ICONS = {
  success: "circle-check",
  error: "circle-alert",
  info: "info",
};

class DsToast extends HTMLElement {
  static observedAttributes = ["message", "type"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLDivElement} */
  #toast;
  /** @type {HTMLSpanElement} */
  #iconHost;
  /** @type {HTMLDivElement} */
  #msgEl;
  /** @type {HTMLButtonElement} */
  #closeBtn;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="toast" part="base" role="status">
        <span class="icon" part="icon"></span>
        <div class="msg" part="message"></div>
        <button class="close" type="button" aria-label="关闭"></button>
      </div>`;
    this.#toast = this.#root.querySelector(".toast");
    this.#iconHost = this.#root.querySelector(".icon");
    this.#msgEl = this.#root.querySelector(".msg");
    this.#closeBtn = this.#root.querySelector(".close");
    this.#closeBtn.append(createIcon("x"));
    this.#closeBtn.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("toast-dismiss", { bubbles: true, composed: true }),
      );
    });
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  get message() {
    return this.getAttribute("message") ?? "";
  }

  set message(value) {
    if (value == null || value === "") this.removeAttribute("message");
    else this.setAttribute("message", value);
  }

  get type() {
    return TYPES.includes(this.getAttribute("type"))
      ? this.getAttribute("type")
      : "info";
  }

  set type(value) {
    if (value == null) this.removeAttribute("type");
    else this.setAttribute("type", value);
  }

  /** type → data-type/图标/role（error 用 alert 立即播报），message → 文本 */
  #sync() {
    if (!this.#toast) return;
    const type = this.type;
    this.#toast.dataset.type = type;
    this.#toast.setAttribute("role", type === "error" ? "alert" : "status");
    this.#iconHost.replaceChildren(createIcon(TYPE_ICONS[type]));
    this.#msgEl.textContent = this.getAttribute("message") ?? "";
  }
}

customElements.define("ds-toast", DsToast);
