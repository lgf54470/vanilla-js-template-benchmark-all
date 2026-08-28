/**
 * ds-sidebar-inset — shadcn SidebarInset 等价物（docs/Components.md §3.4）。
 *
 * 本项目为 light-DOM 容器（不挂 shadow）：壳层 .app-shell__inset 承担实际
 * 布局（header + main 纵向排列），variant="inset" 的卡片化样式在
 * app-shell.css 由 <html data-sidebar-variant> 驱动。本组件仅提供语义标签
 * 与最小 display 契约，内容直接透传。
 */
class DsSidebarInset extends HTMLElement {
  connectedCallback() {
    if (!this.style.display) this.style.display = "flex";
    if (!this.style.flexDirection) this.style.flexDirection = "column";
  }
}

customElements.define("ds-sidebar-inset", DsSidebarInset);
