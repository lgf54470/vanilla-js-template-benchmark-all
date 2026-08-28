import { toast } from "../../shared/ui/index.js";

export function getGeneralDemo(id) {
  switch (id) {
    case "button":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-6); width: 100%;">
              <!-- 变体与尺寸全矩阵 -->
              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                <div style="font-size: var(--text-sm); color: var(--color-fg); font-weight: 600;">变体与尺寸矩阵 (Variants & Sizes)</div>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;">
                  <ds-button size="xs" variant="default">XS Default</ds-button>
                  <ds-button size="xs" variant="secondary">Secondary</ds-button>
                  <ds-button size="xs" variant="outline">Outline</ds-button>
                  <ds-button size="xs" variant="ghost">Ghost</ds-button>
                  <ds-button size="xs" variant="destructive">Destructive</ds-button>
                  <ds-button size="xs" variant="link">Link</ds-button>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;">
                  <ds-button size="sm" variant="default">SM Default</ds-button>
                  <ds-button size="sm" variant="secondary">Secondary</ds-button>
                  <ds-button size="sm" variant="outline">Outline</ds-button>
                  <ds-button size="sm" variant="ghost">Ghost</ds-button>
                  <ds-button size="sm" variant="destructive">Destructive</ds-button>
                  <ds-button size="sm" variant="link">Link</ds-button>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;">
                  <ds-button size="default" variant="default">Default</ds-button>
                  <ds-button size="default" variant="secondary">Secondary</ds-button>
                  <ds-button size="default" variant="outline">Outline</ds-button>
                  <ds-button size="default" variant="ghost">Ghost</ds-button>
                  <ds-button size="default" variant="destructive">Destructive</ds-button>
                  <ds-button size="default" variant="link">Link</ds-button>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;">
                  <ds-button size="lg" variant="default">LG Default</ds-button>
                  <ds-button size="lg" variant="secondary">Secondary</ds-button>
                  <ds-button size="lg" variant="outline">Outline</ds-button>
                  <ds-button size="lg" variant="ghost">Ghost</ds-button>
                  <ds-button size="lg" variant="destructive">Destructive</ds-button>
                  <ds-button size="lg" variant="link">Link</ds-button>
                </div>
              </div>

              <!-- 图标与混排 -->
              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                <div style="font-size: var(--text-sm); color: var(--color-fg); font-weight: 600;">图标前后置与纯图标按钮 (Icons & Icon-Only)</div>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;">
                  <ds-button size="sm" variant="default" icon="plus" icon-position="start">新建项目</ds-button>
                  <ds-button size="sm" variant="outline" icon="arrow-right" icon-position="end">继续下一步</ds-button>
                  <ds-button size="sm" variant="secondary" icon="download" icon-position="start">导出数据</ds-button>
                  <ds-button size="sm" variant="destructive" icon="trash" icon-position="start">删除记录</ds-button>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;">
                  <ds-button size="icon-xs" variant="outline" icon="settings" title="设置 (XS)"></ds-button>
                  <ds-button size="icon-sm" variant="outline" icon="settings" title="设置 (SM)"></ds-button>
                  <ds-button size="icon" variant="outline" icon="settings" title="设置 (Default)"></ds-button>
                  <ds-button size="icon-lg" variant="outline" icon="settings" title="设置 (LG)"></ds-button>
                  <ds-button size="icon" variant="default" icon="check" title="确认"></ds-button>
                  <ds-button size="icon" variant="secondary" icon="bell" title="通知"></ds-button>
                  <ds-button size="icon" variant="ghost" icon="sparkles" title="AI 助理"></ds-button>
                  <ds-button size="icon" variant="destructive" icon="trash" title="删除"></ds-button>
                </div>
              </div>

              <!-- 禁用状态 -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); color: var(--color-fg); font-weight: 600;">禁用态 (Disabled)</div>
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;">
                  <ds-button variant="default" disabled icon="lock">禁用按钮</ds-button>
                  <ds-button variant="outline" disabled>禁用轮廓</ds-button>
                  <ds-button size="icon" variant="outline" disabled icon="settings"></ds-button>
                </div>
              </div>
            </div>
          `;
          container.querySelectorAll("ds-button").forEach((btn) => {
            btn.addEventListener("click", () => {
              if (!btn.hasAttribute("disabled")) {
                toast.success(`点击了 ${btn.getAttribute("variant") || "default"} 按钮`);
              }
            });
          });
        },
        code:
          `<ds-button variant="default">Default</ds-button>\n<ds-button size="sm" variant="outline" icon="plus">新建</ds-button>\n<ds-button size="icon" variant="outline" icon="settings"></ds-button>\n<ds-button variant="destructive">Destructive</ds-button>`,
        slots: `data-slot="button"`,
      };

    case "badge":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
              <ds-badge variant="default">Default</ds-badge>
              <ds-badge variant="secondary">Secondary</ds-badge>
              <ds-badge variant="outline">Outline</ds-badge>
              <ds-badge variant="destructive">Destructive</ds-badge>
              <ds-badge variant="default">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M20 6 9 17l-5-5"/></svg>
                Verified
              </ds-badge>
            </div>
          `;
        },
        code:
          `<ds-badge variant="default">Default</ds-badge>\n<ds-badge variant="secondary">Secondary</ds-badge>\n<ds-badge variant="outline">Outline</ds-badge>\n<ds-badge variant="destructive">Destructive</ds-badge>`,
        slots: `data-slot="badge"`,
      };

    case "button-group":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-6); width: 100%;">
              <!-- 1. 基础按钮组 Basic -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">基础横向按钮组 (Basic)</div>
                <ds-button-group>
                  <ds-button variant="outline">Button</ds-button>
                  <ds-button variant="outline">Another Button</ds-button>
                </ds-button-group>
              </div>

              <!-- 2. 与输入框组合 With Input -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">与输入框无缝拼接 (With Input)</div>
                <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                  <ds-button-group style="max-width: 24rem;">
                    <ds-button variant="outline" icon="search">搜索</ds-button>
                    <ds-input placeholder="输入关键字..."></ds-input>
                  </ds-button-group>
                  <ds-button-group style="max-width: 24rem;">
                    <ds-input placeholder="输入邮箱地址..."></ds-input>
                    <ds-button variant="default">订阅</ds-button>
                  </ds-button-group>
                </div>
              </div>

              <!-- 3. 带文本前缀 With Text -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">带文本前缀 (With Text / Label)</div>
                <ds-button-group style="max-width: 20rem;">
                  <ds-button-group-text>GPU Size</ds-button-group-text>
                  <ds-input placeholder="24 GB VRAM"></ds-input>
                </ds-button-group>
              </div>

              <!-- 4. 图标工具栏 With Icons -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">富文本 / 工具栏 (With Icons)</div>
                <ds-button-group>
                  <ds-button variant="outline" size="icon" icon="bold" title="加粗"></ds-button>
                  <ds-button variant="outline" size="icon" icon="italic" title="斜体"></ds-button>
                  <ds-button variant="outline" size="icon" icon="underline" title="下划线"></ds-button>
                </ds-button-group>
              </div>

              <!-- 5. 分页拼接条 Pagination Bar -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">分页拼接导航 (Pagination Bar)</div>
                <ds-button-group>
                  <ds-button variant="outline" size="sm" icon="chevron-left">Previous</ds-button>
                  <ds-button variant="outline" size="sm">1</ds-button>
                  <ds-button variant="outline" size="sm">2</ds-button>
                  <ds-button variant="outline" size="sm">3</ds-button>
                  <ds-button variant="outline" size="sm">4</ds-button>
                  <ds-button variant="outline" size="sm">5</ds-button>
                  <ds-button variant="outline" size="sm" icon="chevron-right" icon-position="end">Next</ds-button>
                </ds-button-group>
              </div>

              <!-- 6. 纵向按钮组 Vertical -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">纵向按钮组 (Vertical)</div>
                <ds-button-group orientation="vertical">
                  <ds-button variant="outline" size="icon" icon="plus" title="放大"></ds-button>
                  <ds-button variant="outline" size="icon" icon="minus" title="缩小"></ds-button>
                </ds-button-group>
              </div>
            </div>
          `;
        },
        code:
          `<ds-button-group>\n  <ds-button variant="outline">Button</ds-button>\n  <ds-button variant="outline">Another Button</ds-button>\n</ds-button-group>\n\n<ds-button-group orientation="vertical">\n  <ds-button variant="outline" size="icon" icon="plus"></ds-button>\n  <ds-button variant="outline" size="icon" icon="minus"></ds-button>\n</ds-button-group>`,
        slots:
          `data-slot="button-group", data-slot="button-group-text", data-slot="button-group-separator"`,
      };

    case "toggle":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; gap: var(--space-3); align-items: center;">
              <ds-toggle id="t-bold" variant="outline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h8a4 4 0 0 0 0-8H6v8Zm0 0h9a4 4 0 0 1 0 8H6v-8Z"/></svg>
                <span>加粗 (Bold)</span>
              </ds-toggle>
              <ds-toggle id="t-italic" variant="default" pressed>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>
                <span>斜体 (Italic)</span>
              </ds-toggle>
            </div>
          `;
          container.querySelector("#t-bold")?.addEventListener("ds-change", (e) => {
            toast.info(`加粗状态: ${e.detail.pressed ? "已激活" : "未激活"}`);
          });
        },
        code: `<ds-toggle variant="outline">加粗</ds-toggle>`,
        slots: `data-slot="toggle"`,
      };

    case "toggle-group":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-toggle-group>
              <ds-toggle variant="outline" pressed>日</ds-toggle>
              <ds-toggle variant="outline">周</ds-toggle>
              <ds-toggle variant="outline">月</ds-toggle>
              <ds-toggle variant="outline">年</ds-toggle>
            </ds-toggle-group>
          `;
        },
        code:
          `<ds-toggle-group>\n  <ds-toggle pressed>日</ds-toggle>\n  <ds-toggle>周</ds-toggle>\n  <ds-toggle>月</ds-toggle>\n</ds-toggle-group>`,
        slots: `data-slot="toggle-group", data-slot="toggle-group-item"`,
      };

    case "kbd":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              <div style="display: flex; align-items: center; gap: var(--space-2);">
                <span style="font-size: var(--text-sm);">全局搜索指令:</span>
                <ds-kbd>⌘</ds-kbd>
                <ds-kbd>K</ds-kbd>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-2);">
                <span style="font-size: var(--text-sm);">保存当前文件:</span>
                <ds-kbd>Ctrl</ds-kbd>
                <ds-kbd>S</ds-kbd>
              </div>
            </div>
          `;
        },
        code: `<ds-kbd>⌘</ds-kbd> + <ds-kbd>K</ds-kbd>`,
        slots: `data-slot="kbd"`,
      };

    case "separator":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="width: 100%; max-width: 24rem;">
              <div style="font-size: var(--text-sm); font-weight: 600;">Vanilla JS Template</div>
              <div style="font-size: var(--text-xs); color: var(--color-fg-muted);">零依赖模块化前端架构</div>
              <ds-separator style="margin: var(--space-3) 0;"></ds-separator>
              <div style="display: flex; height: 1.25rem; align-items: center; gap: var(--space-3); font-size: var(--text-xs); color: var(--color-fg-muted);">
                <span>文档</span>
                <ds-separator orientation="vertical"></ds-separator>
                <span>源码</span>
                <ds-separator orientation="vertical"></ds-separator>
                <span>社区</span>
              </div>
            </div>
          `;
        },
        code: `<ds-separator></ds-separator>\n<ds-separator orientation="vertical"></ds-separator>`,
        slots: `data-slot="separator"`,
      };

    case "typography":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-3); max-width: 32rem;">
              <ds-typography variant="h2">排版系统 Typography</ds-typography>
              <ds-typography variant="lead">遵循设计系统规范的一致字阶与行高排版标准。</ds-typography>
              <ds-typography variant="p">这是一个标准正文字段段落，采用语义化设计令牌，保证在浅色与深色模式下均具备极佳的可读性与对比度。</ds-typography>
              <ds-typography variant="muted">提示信息或注脚副标题（Muted Text）。</ds-typography>
            </div>
          `;
        },
        code:
          `<ds-typography variant="h1">标题</ds-typography>\n<ds-typography variant="p">正文段落...</ds-typography>`,
        slots: `data-slot="typography"`,
      };

    default:
      return null;
  }
}
