import { toast } from "../../shared/ui/index.js";

export function getGeneralDemo(id) {
  switch (id) {
    case "button":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); width: 100%;">
              <div style="font-size: var(--text-xs); color: var(--color-fg-muted); font-weight: 600;">变体 (Variants)</div>
              <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
                <ds-button variant="default">Default</ds-button>
                <ds-button variant="secondary">Secondary</ds-button>
                <ds-button variant="outline">Outline</ds-button>
                <ds-button variant="ghost">Ghost</ds-button>
                <ds-button variant="destructive">Destructive</ds-button>
                <ds-button variant="link">Link</ds-button>
              </div>
              <div style="font-size: var(--text-xs); color: var(--color-fg-muted); font-weight: 600;">尺寸与图标 (Sizes & Icons)</div>
              <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
                <ds-button size="sm" variant="default" icon="plus">Small</ds-button>
                <ds-button size="default" variant="default" icon="check">Default</ds-button>
                <ds-button size="lg" variant="default" icon="arrow-right">Large</ds-button>
                <ds-button size="icon" variant="outline" icon="settings" title="Settings"></ds-button>
                <ds-button variant="default" disabled icon="lock">Disabled</ds-button>
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
          `<ds-button variant="default">Default</ds-button>\n<ds-button variant="secondary">Secondary</ds-button>\n<ds-button variant="outline" size="sm" icon="plus">With Icon</ds-button>\n<ds-button variant="destructive">Destructive</ds-button>`,
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><use href="/icons.svg#check"></use></svg>
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
            <div style="display: flex; flex-direction: column; gap: var(--space-4);">
              <ds-button-group>
                <ds-button variant="outline" size="sm" icon="bold"></ds-button>
                <ds-button variant="outline" size="sm" icon="italic"></ds-button>
                <ds-button variant="outline" size="sm" icon="underline"></ds-button>
              </ds-button-group>
              <ds-button-group>
                <ds-button variant="default" size="sm">年付 8 折</ds-button>
                <ds-button variant="secondary" size="sm">月付</ds-button>
              </ds-button-group>
            </div>
          `;
        },
        code:
          `<ds-button-group>\n  <ds-button variant="outline">左</ds-button>\n  <ds-button variant="outline">中</ds-button>\n  <ds-button variant="outline">右</ds-button>\n</ds-button-group>`,
        slots: `data-slot="button-group", data-slot="button-group-separator"`,
      };

    case "toggle":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; gap: var(--space-3); align-items: center;">
              <ds-toggle id="t-bold" variant="outline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="/icons.svg#bold"></use></svg>
                <span>加粗 (Bold)</span>
              </ds-toggle>
              <ds-toggle id="t-italic" variant="default" pressed>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="/icons.svg#italic"></use></svg>
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
