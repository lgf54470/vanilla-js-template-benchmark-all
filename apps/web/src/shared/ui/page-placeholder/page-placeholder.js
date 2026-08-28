/**
 * ds-page-placeholder — 页面占位（docs/Components.md §2）。
 *
 * state: empty | error | unimplemented；title / description。
 * empty 态图标 inbox；error 态 circle-alert 配 --color-danger
 * （圆底 danger 软色）；unimplemented 态 loader-circle（icons.svg
 * 无 construction 类 symbol，按约定降级选用）。
 */
import { attachStyles, createIcon } from "../base.js";

const cssUrl = new URL("./page-placeholder.css", import.meta.url).href;

const STATES = ["empty", "error", "unimplemented"];

/** 各 state 的图标 sprite 名 */
const STATE_ICONS = {
  empty: "inbox",
  error: "circle-alert",
  unimplemented: "loader-circle",
};

class DsPagePlaceholder extends HTMLElement {
  static observedAttributes = ["state", "title", "description"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLDivElement} */
  #base;
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
      <div class="placeholder" part="base" data-state="empty">
        <span class="icon-circle" part="icon"></span>
        <div class="body" part="body">
          <div part="title"></div>
          <div part="description"></div>
        </div>
      </div>`;
    this.#base = this.#root.querySelector('[part="base"]');
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
    if (!this.#base) return;
    const state = STATES.includes(this.getAttribute("state"))
      ? this.getAttribute("state")
      : "empty";
    this.#base.dataset.state = state;
    this.#iconHost.replaceChildren(
      createIcon(STATE_ICONS[state], { size: "lg" }),
    );
    this.#titleEl.textContent = this.getAttribute("title") ?? "";
    this.#descEl.textContent = this.getAttribute("description") ?? "";
    this.#titleEl.hidden = this.#titleEl.textContent === "";
    this.#descEl.hidden = this.#descEl.textContent === "";
  }

  get state() {
    return this.#base?.dataset.state ?? "empty";
  }

  set state(value) {
    if (value == null) this.removeAttribute("state");
    else this.setAttribute("state", value);
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
}

customElements.define("ds-page-placeholder", DsPagePlaceholder);
