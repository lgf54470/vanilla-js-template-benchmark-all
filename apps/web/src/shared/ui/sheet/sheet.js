/**
 * ds-sheet — 侧滑抽屉（docs/Components.md §8，移动端 Sidebar 复用）。
 *
 * 属性：open / side(left|right|top|bottom，默认 left) / title。
 * 行为：Esc 关闭、遮罩点击关闭、聚焦陷阱（跨 shadow 层）与关闭后焦点归还
 * ——与 ds-dialog 相同的聚焦契约，复用其导出的组合树焦点工具。
 * 事件：sheet-open-change { open }。
 * 关闭时序走 waitForTransition（no-motion 下立即完成，docs/CSS.md §9）。
 */
import { attachStyles, createIcon } from "../base.js";
import { waitForTransition } from "../../lib/dom.js";
import { collectFocusables, deepActiveElement } from "../dialog/dialog.js";

const cssUrl = new URL("./sheet.css", import.meta.url).href;

const SIDES = ["left", "right", "top", "bottom"];

/** 标题 id 序列（aria-labelledby 指向 shadow 内标题元素） */
let uid = 0;

class DsSheet extends HTMLElement {
  static observedAttributes = ["open", "side", "title"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLDivElement} */
  #overlay;
  /** @type {HTMLElement} */
  #panel;
  /** @type {HTMLHeadingElement} */
  #titleEl;
  /** @type {HTMLButtonElement} */
  #closeBtn;
  /** @type {Element | null} 打开前的焦点元素（关闭时归还） */
  #prevFocus = null;
  /** 当前生效的 open 状态（吸收异步关闭在途） */
  #openState = false;
  /** open 切换序号：防止关闭在途被再次打开时旧任务覆盖新状态 */
  #seq = 0;

  constructor() {
    super();
    uid += 1;
    const titleId = `ds-sheet-title-${uid}`;
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="overlay" part="overlay" hidden>
        <aside class="sheet" role="dialog" aria-modal="true" tabindex="-1"
          part="base" aria-labelledby="${titleId}">
          <header class="header">
            <h2 class="title" id="${titleId}"></h2>
            <button class="close" type="button" aria-label="关闭"></button>
          </header>
          <div class="content"><slot></slot></div>
        </aside>
      </div>`;
    this.#overlay = this.#root.querySelector(".overlay");
    this.#panel = this.#root.querySelector(".sheet");
    this.#titleEl = this.#root.querySelector(".title");
    this.#closeBtn = this.#root.querySelector(".close");
    this.#closeBtn.append(createIcon("x"));
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#syncMeta();
    this.#syncSide();
    this.#overlay.addEventListener(
      "click",
      (event) => this.#onOverlayClick(event),
    );
    this.#panel.addEventListener("keydown", (event) => this.#onKeydown(event));
    this.#closeBtn.addEventListener("click", () => {
      this.open = false;
    });
    if (this.hasAttribute("open")) this.#setOpen(true);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "open") {
      if (oldValue !== newValue) this.#setOpen(newValue !== null);
    } else if (name === "side") {
      this.#syncSide();
    } else {
      this.#syncMeta();
    }
  }

  get open() {
    return this.#openState;
  }

  set open(value) {
    if (value) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  get side() {
    return SIDES.includes(this.getAttribute("side"))
      ? this.getAttribute("side")
      : "left";
  }

  set side(value) {
    if (value == null) this.removeAttribute("side");
    else this.setAttribute("side", value);
  }

  get title() {
    return this.getAttribute("title") ?? "";
  }

  set title(value) {
    if (value == null || value === "") this.removeAttribute("title");
    else this.setAttribute("title", value);
  }

  /**
   * open 状态落位（同 ds-dialog 契约）：打开=记忆焦点→显示→聚焦并派发事件；
   * 关闭=等过渡收尾→隐藏→归还焦点→派发事件。
   * @param {boolean} open
   */
  async #setOpen(open) {
    if (open === this.#openState) return;
    this.#openState = open;
    const seq = ++this.#seq;
    if (open) {
      this.#prevFocus = document.activeElement instanceof Element
        ? document.activeElement
        : null;
      this.#overlay.hidden = false;
      this.#focusFirst();
      this.#emit(true);
      return;
    }
    await waitForTransition(this.#overlay, 180);
    if (seq !== this.#seq) return; // 关闭在途被重新打开，放弃本次收尾
    this.#overlay.hidden = true;
    this.#restoreFocus();
    this.#emit(false);
  }

  /** 聚焦首个可聚焦元素；无候选时聚焦面板本身（保证 Esc/Tab 有落点） */
  #focusFirst() {
    const first = collectFocusables(this.#panel)[0];
    if (first) first.focus();
    else this.#panel.focus();
  }

  #restoreFocus() {
    const el = this.#prevFocus;
    this.#prevFocus = null;
    if (el?.isConnected) el.focus?.();
  }

  /** @param {boolean} open */
  #emit(open) {
    this.dispatchEvent(
      new CustomEvent("sheet-open-change", {
        detail: { open },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** keydown：Esc 关闭；Tab/Shift+Tab 在抽屉内循环（聚焦陷阱） */
  #onKeydown(event) {
    if (!this.#openState) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.open = false;
      return;
    }
    if (event.key === "Tab") this.#trapTab(event);
  }

  /** @param {KeyboardEvent} event */
  #trapTab(event) {
    const focusables = collectFocusables(this.#panel);
    if (focusables.length === 0) {
      event.preventDefault();
      this.#panel.focus();
      return;
    }
    const index = focusables.indexOf(deepActiveElement());
    if (event.shiftKey) {
      if (index <= 0) {
        event.preventDefault();
        focusables[focusables.length - 1].focus();
      }
      return;
    }
    if (index === -1 || index === focusables.length - 1) {
      event.preventDefault();
      focusables[0].focus();
    }
  }

  /** 点击遮罩空白处关闭（composedPath 判定真实点击源，跨 shadow 安全） */
  #onOverlayClick(event) {
    if (event.composedPath()[0] === this.#overlay) this.open = false;
  }

  /** title → 文本/hidden/aria-labelledby 关联 */
  #syncMeta() {
    if (!this.#titleEl) return;
    const title = this.getAttribute("title") ?? "";
    this.#titleEl.textContent = title;
    this.#titleEl.hidden = title === "";
    if (title) this.#panel.setAttribute("aria-labelledby", this.#titleEl.id);
    else this.#panel.removeAttribute("aria-labelledby");
  }

  /** side → data-side 驱动贴边定位（逻辑属性，RTL 预留） */
  #syncSide() {
    if (!this.#panel) return;
    this.#panel.dataset.side = this.side;
  }
}

customElements.define("ds-sheet", DsSheet);
