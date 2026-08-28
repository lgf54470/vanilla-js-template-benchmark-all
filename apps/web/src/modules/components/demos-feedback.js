import { toast } from "../../shared/ui/index.js";

export function getFeedbackDemo(id) {
  switch (id) {
    case "dialog":
      return {
        render: (container) => {
          container.innerHTML = `
            <div>
              <ds-button id="btn-open-dlg" variant="default">打开 Dialog 对话框</ds-button>
              <ds-dialog id="demo-dlg">
                <div style="font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2);">编辑个人资料</div>
                <div style="font-size: var(--text-sm); color: var(--color-fg-muted); margin-bottom: var(--space-4);">修改您的显示名称与公开个人信息。</div>
                <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                  <ds-input placeholder="请输入用户名" value="Developer"></ds-input>
                  <ds-input placeholder="请输入电子邮箱" value="alex@example.com"></ds-input>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-4);">
                  <ds-button variant="outline" id="dlg-cancel">取消</ds-button>
                  <ds-button variant="default" id="dlg-save">保存更改</ds-button>
                </div>
              </ds-dialog>
            </div>
          `;
          const dlg = container.querySelector("#demo-dlg");
          container.querySelector("#btn-open-dlg")?.addEventListener(
            "click",
            () => dlg.open = true,
          );
          container.querySelector("#dlg-cancel")?.addEventListener("click", () => dlg.open = false);
          container.querySelector("#dlg-save")?.addEventListener("click", () => {
            dlg.open = false;
            toast.success("个人资料已成功保存！");
          });
        },
        code:
          `<ds-button id="open-btn">打开弹窗</ds-button>\n<ds-dialog id="my-dlg">\n  <h2>标题</h2>\n  <p>内容...</p>\n</ds-dialog>`,
        slots: `data-slot="dialog", data-slot="dialog-overlay", data-slot="dialog-close"`,
      };

    case "alert-dialog":
      return {
        render: (container) => {
          container.innerHTML = `
            <div>
              <ds-button variant="destructive" id="btn-alert-dlg">删除工作空间 (Alert Dialog)</ds-button>
              <ds-alert-dialog id="demo-alert-dlg">
                <div style="font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2); color: var(--color-danger);">确定要彻底删除该空间吗？</div>
                <div style="font-size: var(--text-sm); color: var(--color-fg-muted); margin-bottom: var(--space-4);">此操作不可逆，空间下的所有笔记和任务将被永久擦除。</div>
                <div style="display: flex; justify-content: flex-end; gap: var(--space-2);">
                  <ds-button variant="outline" id="ad-cancel">取消</ds-button>
                  <ds-button variant="destructive" id="ad-confirm">确认删除</ds-button>
                </div>
              </ds-alert-dialog>
            </div>
          `;
          const ad = container.querySelector("#demo-alert-dlg");
          container.querySelector("#btn-alert-dlg")?.addEventListener(
            "click",
            () => ad.open = true,
          );
          container.querySelector("#ad-cancel")?.addEventListener("click", () => ad.open = false);
          container.querySelector("#ad-confirm")?.addEventListener("click", () => {
            ad.open = false;
            toast.success("工作空间已执行删除操作");
          });
        },
        code:
          `<ds-alert-dialog>\n  <h3>确认操作？</h3>\n  <p>此操作无法撤销。</p>\n</ds-alert-dialog>`,
        slots: `data-slot="alert-dialog", data-slot="alert-dialog-content"`,
      };

    case "alert":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-3); width: 100%; max-width: 28rem;">
              <ds-alert variant="default" title="系统升级通知" description="平台已全面支持 Shadcn Base UI 规范与 W3C Web Components。"></ds-alert>
              <ds-alert variant="destructive" title="凭据已过期" description="您的会话凭据已过期，请重新验证密码登录。"></ds-alert>
            </div>
          `;
        },
        code: `<ds-alert variant="default" title="通知" description="内容..."></ds-alert>`,
        slots: `data-slot="alert", data-slot="alert-title", data-slot="alert-description"`,
      };

    case "sheet":
      return {
        render: (container) => {
          container.innerHTML = `
            <div>
              <ds-button variant="outline" id="btn-open-sheet">打开侧边抽屉 (Sheet)</ds-button>
              <ds-sheet side="right" id="demo-sheet">
                <div style="font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2);">侧边属性面板</div>
                <div style="font-size: var(--text-sm); color: var(--color-fg-muted); margin-bottom: var(--space-4);">从屏幕侧边滑出的全高度抽屉。</div>
                <ds-input placeholder="属性配置项..."></ds-input>
              </ds-sheet>
            </div>
          `;
          const sheet = container.querySelector("#demo-sheet");
          container.querySelector("#btn-open-sheet")?.addEventListener(
            "click",
            () => sheet.open = true,
          );
        },
        code: `<ds-sheet side="right">\n  <h2>抽屉标题</h2>\n  <p>内容...</p>\n</ds-sheet>`,
        slots: `data-slot="sheet", data-slot="sheet-content"`,
      };

    case "drawer":
      return {
        render: (container) => {
          container.innerHTML = `
            <div>
              <ds-button variant="outline" id="btn-open-drawer">打开底部抽屉 (Drawer)</ds-button>
              <ds-drawer id="demo-drawer">
                <div style="font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2);">底部抽屉面板</div>
                <div style="font-size: var(--text-sm); color: var(--color-fg-muted);">移动端/响应式友好的底部操作抽屉。</div>
              </ds-drawer>
            </div>
          `;
          const drawer = container.querySelector("#demo-drawer");
          container.querySelector("#btn-open-drawer")?.addEventListener(
            "click",
            () => drawer.open = true,
          );
        },
        code: `<ds-drawer>\n  <div>底部抽屉内容</div>\n</ds-drawer>`,
        slots: `data-slot="drawer", data-slot="drawer-handle"`,
      };

    case "toast":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-3);">
              <ds-button variant="default" id="t-success">触发 Success Toast</ds-button>
              <ds-button variant="destructive" id="t-error">触发 Error Toast</ds-button>
              <ds-button variant="secondary" id="t-info">触发 Info Toast</ds-button>
            </div>
          `;
          container.querySelector("#t-success")?.addEventListener(
            "click",
            () => toast.success("操作执行成功！"),
          );
          container.querySelector("#t-error")?.addEventListener(
            "click",
            () => toast.error("请求失败，请检查网络设置。"),
          );
          container.querySelector("#t-info")?.addEventListener(
            "click",
            () => toast.info("系统将于今晚进行常规维护。"),
          );
        },
        code:
          `import { toast } from "@ui";\n\ntoast.success("操作成功！");\ntoast.error("发生错误！");`,
        slots: `data-slot="toast"`,
      };

    case "tooltip":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; gap: var(--space-4); align-items: center;">
              <ds-tooltip content="添加至快捷收藏">
                <ds-button variant="outline" icon="bookmark"></ds-button>
              </ds-tooltip>
              <ds-tooltip content="系统设置与偏好">
                <ds-button variant="ghost" icon="settings"></ds-button>
              </ds-tooltip>
            </div>
          `;
        },
        code: `<ds-tooltip content="提示文字">\n  <ds-button>悬浮查看</ds-button>\n</ds-tooltip>`,
        slots: `data-slot="tooltip", data-slot="tooltip-content"`,
      };

    case "popover":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-popover>
              <ds-button slot="trigger" variant="outline">点击打开 Popover</ds-button>
              <div style="width: 14rem;">
                <div style="font-size: var(--text-sm); font-weight: 600; margin-bottom: 4px;">尺寸规格</div>
                <div style="font-size: var(--text-xs); color: var(--color-fg-muted);">宽度: 100%, 高度: 自动计算。</div>
              </div>
            </ds-popover>
          `;
        },
        code:
          `<ds-popover>\n  <ds-button slot="trigger">触发</ds-button>\n  <div>浮层内容</div>\n</ds-popover>`,
        slots: `data-slot="popover", data-slot="popover-content"`,
      };

    case "hover-card":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-hover-card>
              <span slot="trigger" style="text-decoration: underline; font-weight: 600; cursor: pointer; color: var(--color-primary);">@antigravity</span>
              <div style="display: flex; gap: var(--space-3);">
                <ds-avatar fallback="AG" size="sm"></ds-avatar>
                <div>
                  <div style="font-size: var(--text-sm); font-weight: 600;">Google Antigravity</div>
                  <div style="font-size: var(--text-xs); color: var(--color-fg-muted);">Advanced Agentic AI Assistant.</div>
                </div>
              </div>
            </ds-hover-card>
          `;
        },
        code:
          `<ds-hover-card>\n  <span slot="trigger">@username</span>\n  <div>卡片内容</div>\n</ds-hover-card>`,
        slots: `data-slot="hover-card", data-slot="hover-card-trigger"`,
      };

    case "dropdown-menu":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-dropdown-menu>
              <ds-button slot="trigger" variant="outline" icon="more-horizontal">更多操作</ds-button>
              <div style="display: flex; flex-direction: column; min-width: 10rem; padding: 4px;">
                <ds-button variant="ghost" size="sm" style="justify-content: flex-start;">复制链接</ds-button>
                <ds-button variant="ghost" size="sm" style="justify-content: flex-start;">导出为 JSON</ds-button>
                <ds-button variant="ghost" size="sm" style="justify-content: flex-start; color: var(--color-danger);">删除条目</ds-button>
              </div>
            </ds-dropdown-menu>
          `;
        },
        code:
          `<ds-dropdown-menu>\n  <ds-button slot="trigger">菜单</ds-button>\n  <div>选项...</div>\n</ds-dropdown-menu>`,
        slots: `data-slot="dropdown-menu", data-slot="dropdown-menu-trigger"`,
      };

    case "context-menu":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="width: 100%; max-width: 24rem; height: 8rem; border: 2px dashed var(--color-border); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: var(--text-sm); color: var(--color-fg-muted);">
              请在此区域点击鼠标右键 (Context Menu)
              <ds-context-menu>
                <div style="padding: 4px; display: flex; flex-direction: column;">
                  <ds-button variant="ghost" size="sm" style="justify-content: flex-start;">重新加载</ds-button>
                  <ds-button variant="ghost" size="sm" style="justify-content: flex-start;">查看属性</ds-button>
                </div>
              </ds-context-menu>
            </div>
          `;
        },
        code: `<ds-context-menu>\n  <div>右键菜单内容</div>\n</ds-context-menu>`,
        slots: `data-slot="context-menu"`,
      };

    case "command":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="width: 100%; max-width: 28rem;">
              <ds-command>
                <div style="display: flex; flex-direction: column; gap: 2px; padding: 4px;">
                  <div style="font-size: var(--text-2xs); color: var(--color-fg-muted); padding: 4px 8px;">建议指令</div>
                  <ds-button variant="ghost" size="sm" icon="calendar" style="justify-content: flex-start;">跳转到日历组件</ds-button>
                  <ds-button variant="ghost" size="sm" icon="file-text" style="justify-content: flex-start;">新建工作空间笔记</ds-button>
                </div>
              </ds-command>
            </div>
          `;
        },
        code: `<ds-command>\n  <div>搜索项目...</div>\n</ds-command>`,
        slots: `data-slot="command", data-slot="command-input", data-slot="command-list"`,
      };

    default:
      return null;
  }
}
