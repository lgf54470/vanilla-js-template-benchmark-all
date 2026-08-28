/**
 * ds-workspace-badge — 当前工作空间只读徽标（docs/Components.md §2）。
 *
 * icon：sprite 名（缺省不渲染磁贴）；name：工作空间名称（超长省略）。
 * 只读展示，无交互态。
 */
import { attachStyles, createIcon } from "../base.js";

const cssUrl = new URL("./workspace-badge.css", import.meta.url).href;

class DsWorkspaceBadge extends HTMLElement {
  static observedAttributes = ["icon", "name"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLSpanElement} */
  #tile;
  /** @type {HTMLSpanElement} */
  #nameEl;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <span class="badge" part="base">
        <span class="tile" part="tile" hidden></span>
        <span part="name"></span>
      </span>`;
    this.#tile = this.#root.querySelector('[part="tile"]');
    this.#nameEl = this.#root.querySelector('[part="name"]');
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    if (!this.#tile) return;
    const icon = this.getAttribute("icon");
    this.#tile.replaceChildren();
    if (icon) {
      this.#tile.append(createIcon(icon, { size: "sm" }));
      this.#tile.hidden = false;
    } else {
      this.#tile.hidden = true;
    }
    this.#nameEl.textContent = this.getAttribute("name") ?? "";
    this.#nameEl.hidden = this.#nameEl.textContent === "";
  }

  get icon() {
    return this.getAttribute("icon") ?? "";
  }

  set icon(value) {
    if (value == null || value === "") this.removeAttribute("icon");
    else this.setAttribute("icon", value);
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }

  set name(value) {
    if (value == null || value === "") this.removeAttribute("name");
    else this.setAttribute("name", value);
  }
}

customElements.define("ds-workspace-badge", DsWorkspaceBadge);
