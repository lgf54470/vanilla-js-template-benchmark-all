/**
 * apps/web/src/modules/components/demos.js
 * 交互式实时演示与代码生成器
 */

import { toast } from "@ui";

export function getComponentDemo(id) {
  switch (id) {
    case "calendar":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-4);">
              <ds-calendar id="demo-cal"></ds-calendar>
              <div id="demo-cal-val" style="font-size: var(--text-sm); color: var(--color-fg-muted);">请点击日历中的日期</div>
            </div>
          `;
          container.querySelector("#demo-cal")?.addEventListener("ds-select", (e) => {
            const valEl = container.querySelector("#demo-cal-val");
            if (valEl) valEl.textContent = `已选择日期: ${e.detail.date}`;
            toast.info(`选择了日期: ${e.detail.date}`);
          });
        },
        code:
          `<ds-calendar></ds-calendar>\n\n<script>\n  document.querySelector("ds-calendar").addEventListener("ds-select", (e) => {\n    console.log("Selected date:", e.detail.date);\n  });\n</script>`,
        slots: `data-slot="calendar", data-slot="calendar-header", data-slot="calendar-grid"`,
      };

    case "button":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
              <ds-button variant="default">Default</ds-button>
              <ds-button variant="secondary">Secondary</ds-button>
              <ds-button variant="outline">Outline</ds-button>
              <ds-button variant="ghost">Ghost</ds-button>
              <ds-button variant="destructive">Destructive</ds-button>
              <ds-button variant="link">Link</ds-button>
              <ds-button variant="default" size="sm" icon="check">With Icon</ds-button>
              <ds-button variant="default" disabled>Disabled</ds-button>
            </div>
          `;
          container.querySelectorAll("ds-button").forEach((btn) => {
            btn.addEventListener(
              "click",
              () => toast.success(`点击了 ${btn.getAttribute("variant") || "default"} 按钮`),
            );
          });
        },
        code:
          `<ds-button variant="default">Default</ds-button>\n<ds-button variant="secondary">Secondary</ds-button>\n<ds-button variant="outline">Outline</ds-button>\n<ds-button variant="destructive">Destructive</ds-button>`,
        slots: `data-slot="button"`,
      };

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
          `import { toast } from "@ui";\n\ntoast.success("操作成功！");\ntoast.error("发生错误！");\ntoast.info("通知信息");`,
        slots: `data-slot="toast", data-slot="toast-container"`,
      };

    case "badge":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; gap: var(--space-2); align-items: center;">
              <ds-badge variant="default">Default</ds-badge>
              <ds-badge variant="secondary">Secondary</ds-badge>
              <ds-badge variant="outline">Outline</ds-badge>
              <ds-badge variant="destructive">Destructive</ds-badge>
            </div>
          `;
        },
        code: `<ds-badge variant="default">Badge</ds-badge>`,
        slots: `data-slot="badge"`,
      };

    case "card":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-card style="max-width: 24rem;">
              <div style="font-size: var(--text-lg); font-weight: 600;">项目分析看板</div>
              <div style="font-size: var(--text-sm); color: var(--color-fg-muted);">本周数据指标增长概览。</div>
              <div style="font-size: var(--text-3xl); font-weight: 700; color: var(--color-primary);">+24.8%</div>
              <div style="display: flex; justify-content: flex-end;">
                <ds-button size="sm" variant="outline">查看明细</ds-button>
              </div>
            </ds-card>
          `;
        },
        code: `<ds-card>\n  <h3>Card Title</h3>\n  <p>Card content</p>\n</ds-card>`,
        slots: `data-slot="card"`,
      };

    case "tabs":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4);">
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
              { value: "settings", label: "偏好配置" },
            ];
            tabs.addEventListener("ds-change", (e) => {
              const pane = container.querySelector("#tabs-pane");
              if (pane) pane.textContent = `当前展示选项卡: ${e.detail.value}`;
            });
          }
        },
        code:
          `<ds-tabs></ds-tabs>\n\n<script>\n  const tabs = document.querySelector("ds-tabs");\n  tabs.items = [\n    { value: "tab1", label: "标签一" },\n    { value: "tab2", label: "标签二" }\n  ];\n</script>`,
        slots: `data-slot="tabs-list", data-slot="tabs-trigger"`,
      };

    default:
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              <div style="padding: var(--space-6); border: 1px dashed var(--color-border); border-radius: var(--radius-lg); text-align: center; background-color: var(--color-card);">
                <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-1);">${id} 组件展示</div>
                <div style="font-size: var(--text-sm); color: var(--color-fg-muted);">已对齐 Shadcn Base UI 官方规范实现。</div>
              </div>
            </div>
          `;
        },
        code: `<ds-${id}></ds-${id}>`,
        slots: `data-slot="${id}"`,
      };
  }
}
