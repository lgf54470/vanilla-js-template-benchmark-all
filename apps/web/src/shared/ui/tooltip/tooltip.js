/**
 * ds-tooltip — 悬浮提示（docs/Components.md §3.4，Sidebar 收起态菜单项复用）。
 *
 * <ds-tooltip content="文案" side="right">
 *   <button>…</button>   ← 任意可聚焦触发元素（light DOM slot）
 * </ds-tooltip>
 *
 * hover / focus 显示，离开隐藏；无障碍经 aria-describedby 关联。
 * 定位 fixed + JS 计算（side 带翻面兜底）。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./tooltip.css", import.meta.url).href;

const SIDES = ["top", "bottom", "left", "right"];

class DsTooltip extends HTMLElement {
  static observedAttributes = ["content", "side"];

  #root;
  #triggerSlot;
  /** @type {HTMLDivElement} */
  #tip;
  #active = false;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<slot></slot><div part="tip" role="tooltip" hidden></div>`;
    this.#triggerSlot = this.#root.querySelector("slot");
    this.#tip = this.#root.querySelector('[part="tip"]');
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#syncText();
    this.#triggerSlot.addEventListener("slotchange", () => this.#bindTrigger());
    this.#bindTrigger();
  }

  attributeChangedCallback(name) {
    if (name === "content") this.#syncText();
    else this.#position();
  }

  #syncText() {
    const text = this.getAttribute("content") ?? "";
    this.#tip.textContent = text;
    this.#tip.id = this.#tip.id ||
      `ds-tooltip-${crypto.randomUUID().slice(0, 8)}`;
    const trigger = this.#trigger();
    if (trigger) {
      if (text) trigger.setAttribute("aria-describedby", this.#tip.id);
      else trigger.removeAttribute("aria-describedby");
    }
  }

  #trigger() {
    const el = this.#triggerSlot.assignedElements({ flatten: true })[0];
    return el instanceof HTMLElement ? el : undefined;
  }

  #bindTrigger() {
    const trigger = this.#trigger();
    if (!trigger) return;
    // slot 内容可能替换，重复绑定防护：仅挂在本组件实例上（不重复加同名监听）
    this.onmouseenter = () => this.#show();
    this.onmouseleave = () => this.#hide();
    this.onfocusin = () => this.#show();
    this.onfocusout = () => this.#hide();
  }

  #show() {
    if (!this.getAttribute("content")) return;
    this.#active = true;
    this.#tip.hidden = false;
    this.#position();
  }

  #hide() {
    this.#active = false;
    this.#tip.hidden = true;
  }

  #position() {
    if (this.#tip.hidden || !this.#active) return;
    const trigger = this.#trigger();
    if (!trigger) return;
    const tr = trigger.getBoundingClientRect();
    const tw = this.#tip.offsetWidth;
    const th = this.#tip.offsetHeight;
    const gap = 6;
    let side = SIDES.includes(this.getAttribute("side"))
      ? this.getAttribute("side")
      : "top";

    // 翻面兜底：目标侧空间不足时用对侧
    const fits = {
      top: tr.top - th - gap > 0,
      bottom: tr.bottom + th + gap < innerHeight,
      left: tr.left - tw - gap > 0,
      right: tr.right + tw + gap < innerWidth,
    };
    if (!fits[side]) {
      const opposite = {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left",
      };
      if (fits[opposite[side]]) side = opposite[side];
    }

    let top = 0;
    let left = 0;
    if (side === "top") {
      top = tr.top - th - gap;
      left = tr.left + (tr.width - tw) / 2;
    } else if (side === "bottom") {
      top = tr.bottom + gap;
      left = tr.left + (tr.width - tw) / 2;
    } else if (side === "left") {
      top = tr.top + (tr.height - th) / 2;
      left = tr.left - tw - gap;
    } else {
      top = tr.top + (tr.height - th) / 2;
      left = tr.right + gap;
    }

    this.#tip.style.top = `${Math.round(top)}px`;
    this.#tip.style.left = `${Math.round(left)}px`;
  }
}

customElements.define("ds-tooltip", DsTooltip);
