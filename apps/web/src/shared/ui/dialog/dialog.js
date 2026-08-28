/**
 * ds-dialog — 模态对话框（docs/Components.md §8，替代原生 alert/confirm）。
 *
 * 属性：open / title / description；内容走默认 slot，操作区走 slot="footer"。
 * 行为：Esc 关闭、点击遮罩空白关闭、打开时聚焦首个可聚焦元素、
 * Tab/Shift+Tab 聚焦陷阱（跨 shadow 层按组合树收集）、关闭后焦点归还
 * 打开前的 document.activeElement。
 * 事件：dialog-open-change { open }（bubbles + composed）。
 * 关闭时序走 waitForTransition（全站 no-motion 下立即完成，docs/CSS.md §9）。
 */
import { attachStyles, createIcon } from "../base.js";
import { waitForTransition } from "../../lib/dom.js";

const cssUrl = new URL("./dialog.css", import.meta.url).href;

/** 标题/描述 id 序列（aria-labelledby / aria-describedby 指向 shadow 内元素） */
let uid = 0;

/**
 * 按组合树顺序深度收集可聚焦元素（含嵌套 shadow 与 slot 投影；跨 shadow
 * 判定不能靠 Node.contains/querySelector 直查，docs/CSS.md §9）。
 * 供 ds-dialog / ds-sheet 的聚焦陷阱共用。
 * @param {Element | ShadowRoot} root 起始节点
 * @returns {Element[]}
 */
export function collectFocusables(root) {
  /** @type {Element[]} */
  const out = [];
  visitChildren(root, out);
  return out;
}

/** @param {Element | ShadowRoot} parent @param {Element[]} out */
function visitChildren(parent, out) {
  for (const node of parent.childNodes) {
    if (node.nodeType === 1) visit(node, out);
  }
}

/** @param {Element} el @param {Element[]} out */
function visit(el, out) {
  if (el.localName === "slot") {
    for (const assigned of el.assignedElements({ flatten: true })) {
      visit(assigned, out);
    }
    return;
  }
  if (isFocusable(el)) out.push(el);
  if (el.shadowRoot) visitChildren(el.shadowRoot, out);
  else visitChildren(el, out);
}

/** @param {Element} el @returns {boolean} */
function isFocusable(el) {
  if (el.hasAttribute("hidden")) return false;
  if (el.hasAttribute("disabled")) return false;
  if (el.getAttribute("tabindex") === "-1") return false;
  switch (el.localName) {
    case "a":
    case "area":
      return el.hasAttribute("href");
    case "input":
      return el.getAttribute("type") !== "hidden";
    case "button":
    case "select":
    case "textarea":
      return true;
    default:
      return el.hasAttribute("tabindex");
  }
}

/**
 * 深挖当前真实焦点元素（document.activeElement 每层 shadow 只暴露一层，
 * 需逐层下钻 shadowRoot.activeElement）。
 * @returns {Element | null}
 */
export function deepActiveElement() {
  let el = document.activeElement;
  while (el?.shadowRoot) el = el.shadowRoot.activeElement;
  return el;
}

class DsDialog extends HTMLElement {
  static observedAttributes = ["open", "title", "description"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLDivElement} */
  #overlay;
  /** @type {HTMLDivElement} */
  #panel;
  /** @type {HTMLHeadingElement} */
  #titleEl;
  /** @type {HTMLParagraphElement} */
  #descEl;
  /** @type {HTMLSlotElement} */
  #contentSlot;
  /** @type {HTMLSlotElement} */
  #footerSlot;
  /** @type {HTMLDivElement} */
  #contentEl;
  /** @type {HTMLDivElement} */
  #footerEl;
  /** @type {HTMLButtonElement} */
  #closeBtn;
  /** @type {Element | null} 打开前的焦点元素（关闭时归还） */
  #prevFocus = null;
  /** 当前生效的 open 状态（与 attribute 分离，吸收异步关闭在途） */
  #openState = false;
  /** open 切换序号：防止关闭在途被再次打开时旧任务覆盖新状态 */
  #seq = 0;

  constructor() {
    super();
    uid += 1;
    const titleId = `ds-dialog-title-${uid}`;
    const descId = `ds-dialog-desc-${uid}`;
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="overlay" part="overlay" hidden>
        <div class="dialog" role="dialog" aria-modal="true" tabindex="-1"
          part="base" aria-labelledby="${titleId}" aria-describedby="${descId}">
          <div class="header">
            <h2 class="title" id="${titleId}"></h2>
            <p class="description" id="${descId}"></p>
          </div>
          <button class="close" type="button" aria-label="关闭"></button>
          <div class="content"><slot></slot></div>
          <div class="footer"><slot name="footer"></slot></div>
        </div>
      </div>`;
    this.#overlay = this.#root.querySelector(".overlay");
    this.#panel = this.#root.querySelector(".dialog");
    this.#titleEl = this.#root.querySelector(".title");
    this.#descEl = this.#root.querySelector(".description");
    this.#closeBtn = this.#root.querySelector(".close");
    this.#contentEl = this.#root.querySelector(".content");
    this.#footerEl = this.#root.querySelector(".footer");
    this.#contentSlot = this.#root.querySelector(".content slot");
    this.#footerSlot = this.#root.querySelector(".footer slot");
    this.#closeBtn.append(createIcon("x"));
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#syncMeta();
    this.#syncSlotState();
    this.#overlay.addEventListener(
      "click",
      (event) => this.#onOverlayClick(event),
    );
    this.#panel.addEventListener("keydown", (event) => this.#onKeydown(event));
    this.#closeBtn.addEventListener("click", () => {
      this.open = false;
    });
    this.#contentSlot.addEventListener(
      "slotchange",
      () => this.#syncSlotState(),
    );
    this.#footerSlot.addEventListener(
      "slotchange",
      () => this.#syncSlotState(),
    );
    if (this.hasAttribute("open")) this.#setOpen(true);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "open") {
      if (oldValue !== newValue) this.#setOpen(newValue !== null);
      return;
    }
    this.#syncMeta();
  }

  get open() {
    return this.#openState;
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

  /**
   * open 状态落位：打开=记忆焦点→显示→聚焦并派发事件；
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

  /** 聚焦内容首个可聚焦元素；无候选时聚焦面板本身（保证 Esc/Tab 有落点） */
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
      new CustomEvent("dialog-open-change", {
        detail: { open },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** keydown：Esc 关闭；Tab/Shift+Tab 在对话框内循环（聚焦陷阱） */
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

  /** title/description → 文本、hidden 与 aria-labelledby/describedby 关联 */
  #syncMeta() {
    if (!this.#titleEl) return;
    const title = this.getAttribute("title") ?? "";
    const description = this.getAttribute("description") ?? "";
    this.#titleEl.textContent = title;
    this.#titleEl.hidden = title === "";
    this.#descEl.textContent = description;
    this.#descEl.hidden = description === "";
    if (title) this.#panel.setAttribute("aria-labelledby", this.#titleEl.id);
    else this.#panel.removeAttribute("aria-labelledby");
    if (description) {
      this.#panel.setAttribute("aria-describedby", this.#descEl.id);
    } else this.#panel.removeAttribute("aria-describedby");
  }

  /** 内容/操作区无 slot 内容时整块隐藏（不留空白 gap） */
  #syncSlotState() {
    if (!this.#contentEl) return;
    this.#contentEl.hidden = this.#contentSlot.assignedElements().length === 0;
    this.#footerEl.hidden = this.#footerSlot.assignedElements().length === 0;
  }
}

customElements.define("ds-dialog", DsDialog);
