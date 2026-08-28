/**
 * ds-icon-button — 图标按钮（docs/Components.md §2 / §9：必须有 aria-label）。
 *
 * variant 语义同 ds-button；size: sm | default | lg。
 * 图标可用子内容（light DOM svg）或 icon 属性（sprite 名）提供。
 */
import { attachStyles, createIcon } from "../base.js";

const cssUrl = new URL("./icon-button.css", import.meta.url).href;

const VARIANTS = ["primary", "secondary", "outline", "ghost", "danger"];
const SIZES = ["sm", "default", "lg"];

class DsIconButton extends HTMLElement {
  static observedAttributes = ["variant", "size", "disabled", "icon"];

  #root;
  /** @type {HTMLButtonElement} */
  #btn;
  #iconHost;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<button type="button" part="base" aria-label=""><span part="icon" hidden></span><slot></slot></button>`;
    this.#btn = this.#root.querySelector("button");
    this.#iconHost = this.#root.querySelector('[part="icon"]');
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    if (!this.#btn) return;
    const variant = VARIANTS.includes(this.getAttribute("variant"))
      ? this.getAttribute("variant")
      : "ghost";
    const size = SIZES.includes(this.getAttribute("size"))
      ? this.getAttribute("size")
      : "default";
    this.#btn.dataset.variant = variant;
    this.#btn.dataset.size = size;
    const disabled = this.hasAttribute("disabled");
    this.#btn.disabled = disabled;
    this.#btn.setAttribute("aria-disabled", String(disabled));
    this.#btn.setAttribute("aria-label", this.getAttribute("aria-label") ?? "");
    this.#renderIcon();
  }

  #renderIcon() {
    const name = this.getAttribute("icon");
    this.#iconHost.replaceChildren();
    if (name) {
      this.#iconHost.append(createIcon(name));
      this.#iconHost.hidden = false;
    } else {
      this.#iconHost.hidden = true;
    }
  }

  get variant() {
    return this.#btn?.dataset.variant ?? "ghost";
  }

  set variant(value) {
    if (value == null) this.removeAttribute("variant");
    else this.setAttribute("variant", value);
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  get icon() {
    return this.getAttribute("icon") ?? "";
  }

  set icon(value) {
    if (value) this.setAttribute("icon", value);
    else this.removeAttribute("icon");
  }

  focus() {
    this.#btn?.focus();
  }
}

customElements.define("ds-icon-button", DsIconButton);
