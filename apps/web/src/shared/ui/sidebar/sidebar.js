/**
 * ds-sidebar — 侧栏面板（docs/Components.md §3.3，对齐 shadcn nova sidebar）。
 *
 * 属性：side(left|right，默认 left)、variant(sidebar|floating|inset)、
 * collapsible(offcanvas|icon|none，默认 icon)。全部反射为 data-*，样式由
 * data-* 选择器驱动（CSS.md 约定，组件 JS 不计算 className）。
 *
 * 桌面态：常驻列（宽度解析链见 Layout.md §1.1：
 *   :host 内联 --sidebar-self-width: var(--sidebar-width) → .sidebar 消费）。
 * 移动态（provider.isMobile）：同一个 slot 移入 <ds-sheet side> 覆盖层。
 * data-state 由 provider store 驱动；无 provider 时默认 expanded。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./sidebar.css", import.meta.url).href;

const SIDES = ["left", "right"];
const VARIANTS = ["sidebar", "floating", "inset"];
const COLLAPSIBLES = ["offcanvas", "icon", "none"];

class DsSidebar extends HTMLElement {
  static observedAttributes = ["side", "variant", "collapsible"];

  #root;
  /** @type {HTMLElement} */
  #sidebar;
  /** @type {import("../sheet/sheet.js").DsSheet} */
  #sheet;
  /** @type {HTMLSlotElement} */
  #slot;
  #provider;
  #unsubscribe;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="sidebar" part="sidebar">
        <div class="sidebar-inner"><slot></slot></div>
      </div>
      <ds-sheet part="mobile-sheet"></ds-sheet>
    `;
    this.#sidebar = this.#root.querySelector(".sidebar");
    this.#sheet = this.#root.querySelector("ds-sheet");
    this.#slot = this.#root.querySelector("slot");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#provider = this.closest("ds-sidebar-provider");
    this.#syncAttrs();
    if (this.#provider) {
      this.#unsubscribe = this.#provider.store.subscribe((s) =>
        this.#syncState(s)
      );
      this.#syncState(this.#provider.store.get());
    } else {
      this.#syncState({
        state: "expanded",
        isMobile: false,
        openMobile: false,
      });
    }
    // sheet 关闭（Esc/遮罩）时回写 provider.openMobile
    this.#sheet.addEventListener("sheet-open-change", (e) => {
      if (!e.detail.open) this.#provider?.setOpenMobile(false);
    });
  }

  disconnectedCallback() {
    this.#unsubscribe?.();
  }

  attributeChangedCallback() {
    this.#syncAttrs();
  }

  #syncAttrs() {
    if (!this.#sidebar) return;
    const side = SIDES.includes(this.getAttribute("side"))
      ? this.getAttribute("side")
      : "left";
    const variant = VARIANTS.includes(this.getAttribute("variant"))
      ? this.getAttribute("variant")
      : "sidebar";
    const collapsible = COLLAPSIBLES.includes(this.getAttribute("collapsible"))
      ? this.getAttribute("collapsible")
      : "icon";
    this.dataset.side = side;
    this.dataset.variant = variant;
    this.dataset.collapsible = collapsible;
    this.#sidebar.dataset.side = side;
    this.#sidebar.dataset.variant = variant;
    this.#sidebar.dataset.collapsible = collapsible;
    this.#sheet.setAttribute("side", side);
  }

  /**
   * @param {{ state?: string, isMobile?: boolean, openMobile?: boolean }} s
   */
  #syncState(s) {
    const state = s.state ?? "expanded";
    this.dataset.state = state;
    this.#sidebar.dataset.state = state;

    if (s.isMobile) {
      this.dataset.mobile = "true";
      this.#sheet.setAttribute("open", s.openMobile ? "" : "false");
      // slot 移入 sheet 面板（同一 slot 不能同时投影两处）
      if (!this.#sheet.contains(this.#slot)) {
        this.#sheet.append(this.#slot);
      }
    } else {
      delete this.dataset.mobile;
      if (!this.#sidebar.querySelector(".sidebar-inner").contains(this.#slot)) {
        this.#root.querySelector(".sidebar-inner").append(this.#slot);
      }
    }
  }
}

customElements.define("ds-sidebar", DsSidebar);
