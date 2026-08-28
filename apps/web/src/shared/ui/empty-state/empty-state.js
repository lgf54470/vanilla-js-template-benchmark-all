/**
 * ds-empty-state — 空状态（docs/Components.md §2）。
 *
 * title / description / icon（默认 "inbox"，对应 public/icons.svg
 * 的 symbol id）；操作按钮放 name="action" 的具名 slot。
 */
import { attachStyles, createIcon } from "../base.js";

const cssUrl = new URL("./empty-state.css", import.meta.url).href;

const DEFAULT_ICON = "inbox";

class DsEmptyState extends HTMLElement {
  static observedAttributes = ["title", "description", "icon"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLSpanElement} */
  #iconHost;
  /** @type {HTMLDivElement} */
  #titleEl;
  /** @type {HTMLDivElement} */
  #descEl;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="empty" part="base">
        <span class="icon-circle" part="icon"></span>
        <div class="body" part="body">
          <div part="title"></div>
          <div part="description"></div>
        </div>
        <div part="action"><slot name="action"></slot></div>
      </div>`;
    this.#iconHost = this.#root.querySelector('[part="icon"]');
    this.#titleEl = this.#root.querySelector('[part="title"]');
    this.#descEl = this.#root.querySelector('[part="description"]');
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    if (!this.#iconHost) return;
    const icon = this.getAttribute("icon") || DEFAULT_ICON;
    this.#iconHost.replaceChildren(createIcon(icon, { size: "lg" }));
    this.#titleEl.textContent = this.getAttribute("title") ?? "";
    this.#descEl.textContent = this.getAttribute("description") ?? "";
    this.#titleEl.hidden = this.#titleEl.textContent === "";
    this.#descEl.hidden = this.#descEl.textContent === "";
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

  get icon() {
    return this.getAttribute("icon") ?? DEFAULT_ICON;
  }

  set icon(value) {
    if (value == null || value === "") this.removeAttribute("icon");
    else this.setAttribute("icon", value);
  }
}

customElements.define("ds-empty-state", DsEmptyState);
