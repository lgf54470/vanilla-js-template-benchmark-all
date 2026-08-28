/**
 * ds-segmented-control / ds-segmented-item — 胶囊分段控件
 * （docs/Components.md §2 / §7 / §9）。
 *
 * 容器 role="radiogroup"，子项 <ds-segmented-item value="...">（slot 承载
 * 文案/图标）；方向键左右（grid 模式含上下）roving tabindex 切换，点击选中。
 *
 * 选中态：
 * - 行模式（默认）：容器背景 --color-muted，滑块（--color-bg + --shadow-xs）
 *   经 transform: translateX 定位到选中项下方（不重排，避免抖动）；
 * - grid 模式（grid="2x4" → 容器 display:grid、repeat(4,1fr)，供会话时长
 *   选择复用）：滑块无法二维定位，选中项由自身 data-active 高亮背景。
 *
 * 属性（control）：value / grid；事件：segmented-change { value }。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./segmented-control.css", import.meta.url).href;
const itemCssUrl = new URL("./segmented-item.css", import.meta.url).href;

/** 子项：纯承载 value 与内容，role/tabindex/aria 由容器统一驱动 */
class DsSegmentedItem extends HTMLElement {
  static observedAttributes = ["value"];

  /** @type {ShadowRoot} */
  #root;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `<slot></slot>`;
  }

  connectedCallback() {
    attachStyles(this.#root, itemCssUrl);
    if (!this.hasAttribute("role")) this.setAttribute("role", "radio");
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "-1");
  }

  get value() {
    return this.getAttribute("value") ?? "";
  }

  set value(value) {
    if (value == null || value === "") this.removeAttribute("value");
    else this.setAttribute("value", value);
  }
}

class DsSegmentedControl extends HTMLElement {
  static observedAttributes = ["value", "grid"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLDivElement} */
  #group;
  /** @type {HTMLDivElement} */
  #slider;
  /** @type {HTMLSlotElement} */
  #slot;
  /** @type {DsSegmentedItem[]} */
  #items = [];
  /** @type {ResizeObserver | null} */
  #ro = null;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="group" role="radiogroup" part="base">
        <div class="slider" part="slider" hidden></div>
        <slot></slot>
      </div>`;
    this.#group = this.#root.querySelector(".group");
    this.#slider = this.#root.querySelector(".slider");
    this.#slot = this.#root.querySelector("slot");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#slot.addEventListener("slotchange", () => this.#syncItems());
    this.addEventListener("keydown", (event) => this.#onKeydown(event));
    this.addEventListener("click", (event) => this.#onClick(event));
    if (typeof ResizeObserver !== "undefined") {
      this.#ro = new ResizeObserver(() => this.#positionSlider());
      this.#ro.observe(this.#group);
    }
    this.#syncItems();
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
    this.#ro = null;
  }

  attributeChangedCallback(name) {
    if (name === "grid") this.#syncGrid();
    else this.#applyValue();
  }

  get value() {
    return this.getAttribute("value") ?? "";
  }

  set value(value) {
    this.setAttribute("value", value ?? "");
  }

  /** grid 布局描述："2x4"（行x列）或纯列数（默认 4 列）；空值回落行模式 */
  get grid() {
    return this.getAttribute("grid");
  }

  set grid(value) {
    if (value == null) this.removeAttribute("grid");
    else this.setAttribute("grid", value);
  }

  /** slot 内容变化：重新收集子项并全量同步 */
  #syncItems() {
    this.#items = this.#slot.assignedElements().filter(
      (el) => el instanceof DsSegmentedItem,
    );
    this.#syncGrid();
    this.#applyValue();
  }

  /** 行/网格模式切换：容器 data-mode + 内联 grid-template-columns */
  #syncGrid() {
    if (!this.#group) return;
    const raw = this.getAttribute("grid");
    const isGrid = raw != null;
    this.#group.dataset.mode = isGrid ? "grid" : "row";
    if (isGrid) {
      const match = /(\d+)\s*[x×]\s*(\d+)/.exec(raw ?? "");
      const cols = match
        ? Number(match[2])
        : Number.parseInt(raw ?? "4", 10) || 4;
      this.#group.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    } else {
      this.#group.style.gridTemplateColumns = "";
    }
    for (const item of this.#items) {
      if (isGrid) item.setAttribute("data-mode", "grid");
      else item.removeAttribute("data-mode");
    }
  }

  /** value → 子项 aria-checked / data-active / roving tabindex / 滑块位置 */
  #applyValue() {
    if (!this.#group) return;
    const value = this.getAttribute("value") ?? "";
    let activeIndex = -1;
    this.#items.forEach((item, index) => {
      const active = activeIndex === -1 && value !== "" &&
        item.value === value;
      if (active) activeIndex = index;
      item.setAttribute("aria-checked", String(active));
      if (active) item.setAttribute("data-active", "");
      else item.removeAttribute("data-active");
    });
    const focusIndex = this.#items.length > 0 && activeIndex === -1
      ? 0
      : activeIndex;
    this.#items.forEach((item, index) => {
      item.setAttribute("tabindex", index === focusIndex ? "0" : "-1");
    });
    this.#positionSlider();
  }

  /** 滑块按选中项实测尺寸/偏移定位（translateX，不触发重排） */
  #positionSlider() {
    if (!this.#slider) return;
    const active = this.#items.find((el) =>
      el.getAttribute("aria-checked") === "true"
    );
    if (!active || this.#group.dataset.mode === "grid") {
      this.#slider.hidden = true;
      return;
    }
    const groupRect = this.#group.getBoundingClientRect();
    const itemRect = active.getBoundingClientRect();
    if (groupRect.width === 0 || itemRect.width === 0) {
      this.#slider.hidden = true;
      return;
    }
    this.#slider.hidden = false;
    this.#slider.style.width = `${itemRect.width}px`;
    this.#slider.style.transform = `translateX(${
      itemRect.left - groupRect.left
    }px)`;
  }

  /** 点击任意子项即选中 */
  #onClick(event) {
    const item = event.composedPath().find(
      (el) => el instanceof DsSegmentedItem,
    );
    if (item) this.#select(item.value, true);
  }

  /** 方向键：行模式左右；网格模式补上下（roving tabindex，循环切换） */
  #onKeydown(event) {
    const keys = ["ArrowLeft", "ArrowRight"];
    if (this.#group?.dataset.mode === "grid") {
      keys.push("ArrowUp", "ArrowDown");
    }
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (this.#items.length === 0) return;
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const current = this.#items.findIndex(
      (item) => item.getAttribute("tabindex") === "0",
    );
    const base = current === -1 ? 0 : current;
    const next = (base + (forward ? 1 : -1) + this.#items.length) %
      this.#items.length;
    this.#select(this.#items[next].value, true);
    this.#items[next].focus();
  }

  /**
   * 选中某个值：写 attribute（驱动 #applyValue），仅用户交互时派发事件。
   * @param {string} value
   * @param {boolean} notify 是否派发 segmented-change
   */
  #select(value, notify) {
    if (value === "" || this.getAttribute("value") === value) return;
    this.setAttribute("value", value);
    if (notify) {
      this.dispatchEvent(
        new CustomEvent("segmented-change", {
          detail: { value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

customElements.define("ds-segmented-item", DsSegmentedItem);
customElements.define("ds-segmented-control", DsSegmentedControl);
