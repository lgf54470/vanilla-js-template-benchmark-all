/**
 * ds-dropdown-menu — 下拉菜单（docs/Components.md §2，WorkspaceSwitcher/NavUser 的基座）。
 *
 * 结构：
 *   <ds-dropdown-menu align="start" side="bottom">
 *     <button slot="trigger">…</button>
 *     <ds-dropdown-label>…</ds-dropdown-label>
 *     <ds-dropdown-item>…</ds-dropdown-item>
 *     <ds-dropdown-separator></ds-dropdown-separator>
 *   </ds-dropdown-menu>
 *
 * 行为：trigger 点击开合；Esc / 外点（composedPath）/ 项点击后自动关闭；
 * ArrowUp/Down 在 menuitem 间移动焦点。open 变化派发 dropdown-open-change。
 */
import { attachStyles } from "../base.js";
import { composedPathContains, waitForTransition } from "../../lib/dom.js";

const cssUrl = new URL("./dropdown-menu.css", import.meta.url).href;

const SIDES = ["top", "bottom"];
const ALIGNS = ["start", "center", "end"];

class DsDropdownMenu extends HTMLElement {
  static observedAttributes = ["open", "side", "align"];

  #root;
  /** @type {HTMLSlotElement} */
  #triggerSlot;
  /** @type {HTMLDivElement} */
  #panel;
  /** @type {() => void} */
  #unbindDoc;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<slot name="trigger" part="trigger"></slot><div part="panel" role="menu" hidden></div>`;
    this.#triggerSlot = this.#root.querySelector('[name="trigger"]');
    this.#panel = this.#root.querySelector('[part="panel"]');
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#triggerSlot.addEventListener("click", () => {
      this.open ? this.#close() : this.#open();
    });
    this.#triggerSlot.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          this.#open();
        }
      }
    });
    this.#panel.addEventListener("keydown", (e) => this.#onPanelKey(e));
    this.#panel.addEventListener("click", (e) => {
      const item = e.target instanceof Element &&
        e.target.closest?.("ds-dropdown-item");
      if (item && !item.hasAttribute("data-keep-open")) this.#close();
    });
    this.#panel.append(document.createElement("slot"));
  }

  disconnectedCallback() {
    this.#unbindDoc?.();
    this.#unbindDoc = undefined;
  }

  attributeChangedCallback(name, _old, _new) {
    if (name === "open") {
      if (this.hasAttribute("open")) this.#show();
      else this.#hide();
    } else {
      this.#position();
    }
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(value) {
    if (value) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  #open() {
    this.setAttribute("open", "");
    this.dispatchEvent(
      new CustomEvent("dropdown-open-change", {
        detail: { open: true },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #close() {
    this.removeAttribute("open");
    this.dispatchEvent(
      new CustomEvent("dropdown-open-change", {
        detail: { open: false },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #show() {
    this.#panel.hidden = false;
    this.#position();
    this.#bindDoc();
    const first = this.#menuItems()[0];
    if (first) first.focus();
  }

  async #hide() {
    this.#unbindDoc?.();
    this.#unbindDoc = undefined;
    // no-motion 下立即完成；有动效环境等面板过渡收尾再隐藏
    await waitForTransition(this.#panel, 150);
    this.#panel.hidden = true;
  }

  #bindDoc() {
    const onPointerDown = (e) => {
      if (!composedPathContains(e, this)) this.#close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        this.#close();
        this.#focusTrigger();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    this.#unbindDoc = () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }

  #focusTrigger() {
    const trigger = this.#triggerSlot.assignedElements({ flatten: true })[0];
    if (trigger instanceof HTMLElement) trigger.focus();
  }

  /** @returns {HTMLElement[]} */
  #menuItems() {
    const slot = this.#panel.querySelector("slot");
    return slot
      ?.assignedElements({ flatten: true })
      .filter((el) => el.tagName === "DS-DROPDOWN-ITEM") ?? [];
  }

  #onPanelKey(e) {
    const items = this.#menuItems();
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (current + 1) % items.length;
    else if (e.key === "ArrowUp") {
      next = (current - 1 + items.length) % items.length;
    }
    if (next >= 0) {
      e.preventDefault();
      items[next].focus();
    }
  }

  #position() {
    if (this.#panel.hidden) return;
    const trigger = this.#triggerSlot.assignedElements({ flatten: true })[0];
    if (!(trigger instanceof HTMLElement)) return;
    const tr = trigger.getBoundingClientRect();
    const side = SIDES.includes(this.getAttribute("side"))
      ? this.getAttribute("side")
      : "bottom";
    const align = ALIGNS.includes(this.getAttribute("align"))
      ? this.getAttribute("align")
      : "start";
    const pw = this.#panel.offsetWidth;
    const ph = this.#panel.offsetHeight;
    const gap = 4;

    let top = side === "bottom" ? tr.bottom + gap : tr.top - ph - gap;
    // 翻面：目标方向空间不足时掉头
    if (side === "bottom" && top + ph > innerHeight && tr.top - ph - gap > 0) {
      top = tr.top - ph - gap;
    } else if (
      side === "top" && top < 0 && tr.bottom + gap + ph < innerHeight
    ) {
      top = tr.bottom + gap;
    }

    let left = align === "start"
      ? tr.left
      : align === "end"
      ? tr.right - pw
      : tr.left + (tr.width - pw) / 2;
    left = Math.max(4, Math.min(left, innerWidth - pw - 4));

    this.#panel.style.top = `${Math.round(top)}px`;
    this.#panel.style.left = `${Math.round(left)}px`;
  }
}

/**
 * ds-dropdown-item — 菜单项。原生 button，role="menuitem"。
 * disabled 属性禁用；data-keep-open 点击后不自动关闭菜单。
 */
export class DsDropdownItem extends HTMLElement {
  static observedAttributes = ["disabled"];

  #root;
  #btn;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<button type="button" role="menuitem" part="item"><slot></slot></button>`;
    this.#btn = this.#root.querySelector("button");
  }

  connectedCallback() {
    attachStyles(
      this.#root,
      new URL("./dropdown-menu.css", import.meta.url).href,
    );
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    if (!this.#btn) return;
    const disabled = this.hasAttribute("disabled");
    this.#btn.disabled = disabled;
    this.#btn.setAttribute("aria-disabled", String(disabled));
    if (disabled) this.#btn.removeAttribute("tabindex");
    else this.#btn.tabIndex = -1; // 由菜单 Arrow 键 roving
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  focus() {
    this.#btn?.focus();
  }
}

/** ds-dropdown-separator — 菜单分隔线。 */
export class DsDropdownSeparator extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<div part="separator" role="separator"></div>`;
    attachStyles(root, new URL("./dropdown-menu.css", import.meta.url).href);
  }
}

/** ds-dropdown-label — 菜单分组标签（小字弱化）。 */
export class DsDropdownLabel extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<div part="label"><slot></slot></div>`;
    attachStyles(root, new URL("./dropdown-menu.css", import.meta.url).href);
  }
}

customElements.define("ds-dropdown-menu", DsDropdownMenu);
customElements.define("ds-dropdown-item", DsDropdownItem);
customElements.define("ds-dropdown-separator", DsDropdownSeparator);
customElements.define("ds-dropdown-label", DsDropdownLabel);
