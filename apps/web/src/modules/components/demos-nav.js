import { toast } from "../../shared/ui/index.js";

export function getNavDemo(id) {
  switch (id) {
    case "tabs":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); width: 100%; max-width: 28rem;">
              <ds-tabs id="demo-tabs"></ds-tabs>
              <div id="tabs-pane" style="padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background-color: var(--color-card);">
                当前展示: 个人概览
              </div>
            </div>
          `;
          const tabs = container.querySelector("#demo-tabs");
          if (tabs) {
            tabs.items = [
              { value: "overview", label: "概览" },
              { value: "analytics", label: "分析报告" },
              { value: "reports", label: "导出记录" },
            ];
            tabs.addEventListener("ds-change", (e) => {
              const pane = container.querySelector("#tabs-pane");
              if (pane) pane.textContent = `当前展示选项卡: ${e.detail.value}`;
            });
          }
        },
        code: `<ds-tabs></ds-tabs>`,
        slots: `data-slot="tabs-list", data-slot="tabs-trigger"`,
      };

    case "accordion":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="width: 100%; max-width: 28rem; display: flex; flex-direction: column; gap: var(--space-2);">
              <ds-accordion-item title="零 npm 依赖的实现原理是什么？" open>
                原生 ES Module + 浏览器标准 Web Components，结合 Web Crypto 与原生 Fetch，无需任何客户端打包与运行时 npm 库。
              </ds-accordion-item>
              <ds-accordion-item title="如何支持四平台部署？">
                基于标准化 Hono 适配器层，一套代码一键构建部署到 Cloudflare Pages、Vercel、Deno Deploy 与 Docker。
              </ds-accordion-item>
            </div>
          `;
        },
        code: `<ds-accordion-item title="标题" open>内容...</ds-accordion-item>`,
        slots:
          `data-slot="accordion-item", data-slot="accordion-trigger", data-slot="accordion-content"`,
      };

    case "collapsible":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="width: 100%; max-width: 24rem;">
              <ds-collapsible title="高级网络代理设置">
                <div style="padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-top: var(--space-2);">
                  <ds-input placeholder="https://proxy.internal:8080"></ds-input>
                </div>
              </ds-collapsible>
            </div>
          `;
        },
        code: `<ds-collapsible title="展开高级配置">\n  <div>内容...</div>\n</ds-collapsible>`,
        slots: `data-slot="collapsible", data-slot="collapsible-trigger"`,
      };

    case "breadcrumb":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="padding: var(--space-3); background-color: var(--color-card); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
              <ds-breadcrumb id="demo-bc"></ds-breadcrumb>
            </div>
          `;
          const bc = container.querySelector("#demo-bc");
          if (bc) {
            bc.items = [
              { label: "主工作台", href: "#/dashboard" },
              { label: "组件库", href: "#/components" },
              { label: "Breadcrumb 面包屑" },
            ];
          }
        },
        code: `<ds-breadcrumb></ds-breadcrumb>`,
        slots: `data-slot="breadcrumb", data-slot="breadcrumb-item"`,
      };

    case "pagination":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-pagination total="100" page-size="10" current="3" id="demo-page"></ds-pagination>
          `;
          container.querySelector("#demo-page")?.addEventListener("ds-page-change", (e) => {
            toast.info(`跳转到第 ${e.detail.page} 页`);
          });
        },
        code: `<ds-pagination total="100" page-size="10" current="1"></ds-pagination>`,
        slots: `data-slot="pagination", data-slot="pagination-item"`,
      };

    case "sidebar":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="width: 100%; max-width: 22rem; height: 16rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; display: flex; background-color: var(--color-card);">
              <div style="width: 12rem; border-right: 1px solid var(--color-border); padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-xs); font-weight: 700;">Nova Sidebar</div>
                <ds-sidebar-menu-button icon="layout-dashboard" active>仪表盘</ds-sidebar-menu-button>
                <ds-sidebar-menu-button icon="file-text">笔记</ds-sidebar-menu-button>
                <ds-sidebar-menu-button icon="component">组件库</ds-sidebar-menu-button>
              </div>
              <div style="flex: 1; padding: var(--space-4); font-size: var(--text-xs); color: var(--color-fg-muted);">主内容区域</div>
            </div>
          `;
        },
        code:
          `<ds-sidebar-provider>\n  <ds-sidebar>\n    <ds-sidebar-menu-button icon="folder">Item</ds-sidebar-menu-button>\n  </ds-sidebar>\n</ds-sidebar-provider>`,
        slots: `data-slot="sidebar", data-slot="sidebar-header", data-slot="sidebar-content"`,
      };

    case "menubar":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-menubar>
              <ds-button variant="ghost" size="sm">文件 (File)</ds-button>
              <ds-button variant="ghost" size="sm">编辑 (Edit)</ds-button>
              <ds-button variant="ghost" size="sm">视图 (View)</ds-button>
              <ds-button variant="ghost" size="sm">帮助 (Help)</ds-button>
            </ds-menubar>
          `;
        },
        code: `<ds-menubar>\n  <ds-button variant="ghost">File</ds-button>\n</ds-menubar>`,
        slots: `data-slot="menubar", data-slot="menubar-menu"`,
      };

    case "navigation-menu":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-navigation-menu>
              <ds-button variant="ghost" size="sm">首页</ds-button>
              <ds-button variant="ghost" size="sm">架构设计</ds-button>
              <ds-button variant="ghost" size="sm">文档中心</ds-button>
            </ds-navigation-menu>
          `;
        },
        code:
          `<ds-navigation-menu>\n  <ds-button variant="ghost">Nav Item</ds-button>\n</ds-navigation-menu>`,
        slots: `data-slot="navigation-menu", data-slot="navigation-menu-list"`,
      };

    case "scroll-area":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-scroll-area style="width: 100%; max-width: 20rem; height: 8rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3);">
              <div style="font-size: var(--text-sm); line-height: 1.6;">
                1. 模块化原生 JavaScript<br/>
                2. W3C 原生 Web Components<br/>
                3. Shadow DOM 隔离机制<br/>
                4. 四层 CSS 语义设计令牌<br/>
                5. 零 npm 运行时纯粹构建<br/>
                6. 多工作空间数据隔离<br/>
                7. 敏感字段 AES-GCM 端到端加密<br/>
              </div>
            </ds-scroll-area>
          `;
        },
        code:
          `<ds-scroll-area style="height: 10rem;">\n  <div>Long content...</div>\n</ds-scroll-area>`,
        slots: `data-slot="scroll-area", data-slot="scroll-area-viewport"`,
      };

    case "resizable":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="width: 100%; max-width: 28rem; height: 8rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); display: flex;">
              <div style="flex: 1; background: var(--color-muted); display: flex; align-items: center; justify-content: center; font-size: var(--text-xs);">面板 A (50%)</div>
              <div style="width: 4px; background: var(--color-border); cursor: col-resize;"></div>
              <div style="flex: 1; background: var(--color-card); display: flex; align-items: center; justify-content: center; font-size: var(--text-xs);">面板 B (50%)</div>
            </div>
          `;
        },
        code:
          `<ds-resizable>\n  <ds-resizable-panel>Panel A</ds-resizable-panel>\n  <ds-resizable-handle></ds-resizable-handle>\n  <ds-resizable-panel>Panel B</ds-resizable-panel>\n</ds-resizable>`,
        slots: `data-slot="resizable-panel-group", data-slot="resizable-panel"`,
      };

    case "direction":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-2); max-width: 24rem;">
              <ds-direction dir="ltr"><div style="padding: var(--space-2); background: var(--color-muted); border-radius: var(--radius-sm);">LTR 文本方向: Hello World (从左到右)</div></ds-direction>
              <ds-direction dir="rtl"><div style="padding: var(--space-2); background: var(--color-muted); border-radius: var(--radius-sm);">RTL 文本方向: مرحبا بالعالم (从右到左)</div></ds-direction>
            </div>
          `;
        },
        code: `<ds-direction dir="rtl"><div>RTL Content</div></ds-direction>`,
        slots: `data-slot="direction"`,
      };

    default:
      return null;
  }
}
