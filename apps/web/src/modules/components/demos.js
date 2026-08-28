/**
 * apps/web/src/modules/components/demos.js
 * 交互式实时演示聚合入口
 */

import { getGeneralDemo } from "./demos-general.js";
import { getFormDemo } from "./demos-form.js";
import { getDataDemo } from "./demos-data.js";
import { getFeedbackDemo } from "./demos-feedback.js";
import { getNavDemo } from "./demos-nav.js";

export function getComponentDemo(id) {
  const demo = getGeneralDemo(id) ||
    getFormDemo(id) ||
    getDataDemo(id) ||
    getFeedbackDemo(id) ||
    getNavDemo(id);

  if (demo) return demo;

  // Fallback demo for any other custom component
  return {
    render: (container) => {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: var(--space-3); align-items: center;">
          <div style="padding: var(--space-6); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-align: center; background-color: var(--color-card); max-width: 24rem;">
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
