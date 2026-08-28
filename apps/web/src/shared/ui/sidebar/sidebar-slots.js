/**
 * sidebar 结构槽组件 — header / footer / content / group / group-label /
 * menu / menu-item / menu-sub / menu-sub-item（docs/Components.md §3.4）。
 *
 * 全部为布局容器：shadow 只含一个槽 + 对应样式；行为组件（menu-button、
 * provider、sidebar）各自独立文件。同族零行为小组件集中定义，避免目录碎片。
 *
 * 各槽订阅 provider 状态并把 {state, collapsible} 反射到自身 dataset——
 * shadow 内 CSS 无法感知 ds-sidebar 祖先状态（:host-context 已废弃），
 * 组件级反射是收起态样式（group-label/menu-sub 隐藏等）的唯一可靠通道。
 */
import { attachStyles } from "../base.js";

/** 通用槽容器工厂。 */
function defineSlot(tag, cssFile) {
  class SlotElement extends HTMLElement {
    #unsubscribe;

    constructor() {
      super();
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `<div part="base"><slot></slot></div>`;
      attachStyles(root, new URL(`./${cssFile}`, import.meta.url).href);
    }

    connectedCallback() {
      const provider = this.closest("ds-sidebar-provider");
      const sidebar = this.closest("ds-sidebar");
      const sync = (s) => {
        this.dataset.state = s.state ?? "expanded";
        this.dataset.collapsible = sidebar?.getAttribute("collapsible") ??
          "icon";
      };
      if (provider) {
        sync(provider.store.get());
        this.#unsubscribe = provider.store.subscribe(sync);
      } else {
        sync({});
      }
    }

    disconnectedCallback() {
      this.#unsubscribe?.();
    }
  }
  customElements.define(tag, SlotElement);
}

defineSlot("ds-sidebar-header", "sidebar-slots.css");
defineSlot("ds-sidebar-footer", "sidebar-slots.css");
defineSlot("ds-sidebar-content", "sidebar-slots.css");
defineSlot("ds-sidebar-group", "sidebar-slots.css");
defineSlot("ds-sidebar-group-label", "sidebar-slots.css");
defineSlot("ds-sidebar-menu", "sidebar-slots.css");
defineSlot("ds-sidebar-menu-item", "sidebar-slots.css");
defineSlot("ds-sidebar-menu-sub", "sidebar-slots.css");
defineSlot("ds-sidebar-menu-sub-item", "sidebar-slots.css");
