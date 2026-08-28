import { toast } from "../../shared/ui/index.js";

export function getDataDemo(id) {
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

    case "card":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-card style="max-width: 24rem; width: 100%;">
              <div style="font-size: var(--text-lg); font-weight: 600;">项目分析看板</div>
              <div style="font-size: var(--text-sm); color: var(--color-fg-muted);">本周数据指标增长概览。</div>
              <div style="font-size: var(--text-3xl); font-weight: 700; color: var(--color-primary); margin: var(--space-3) 0;">+24.8%</div>
              <div style="display: flex; justify-content: flex-end;">
                <ds-button size="sm" variant="outline">查看明细</ds-button>
              </div>
            </ds-card>
          `;
        },
        code: `<ds-card>\n  <h3>Card Title</h3>\n  <p>Card content</p>\n</ds-card>`,
        slots: `data-slot="card"`,
      };

    case "table":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="width: 100%; max-width: 36rem; overflow-x: auto;">
              <ds-table>
                <table>
                  <thead>
                    <tr>
                      <th>模块名称</th>
                      <th>状态</th>
                      <th>请求延时</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Auth Gateway</td>
                      <td><ds-badge variant="default">Online</ds-badge></td>
                      <td>12ms</td>
                      <td><ds-button size="sm" variant="ghost">配置</ds-button></td>
                    </tr>
                    <tr>
                      <td>Database Scoped API</td>
                      <td><ds-badge variant="secondary">Syncing</ds-badge></td>
                      <td>28ms</td>
                      <td><ds-button size="sm" variant="ghost">配置</ds-button></td>
                    </tr>
                  </tbody>
                </table>
              </ds-table>
            </div>
          `;
        },
        code:
          `<ds-table>\n  <table>\n    <thead><tr><th>Name</th></tr></thead>\n    <tbody><tr><td>Value</td></tr></tbody>\n  </table>\n</ds-table>`,
        slots: `data-slot="table", data-slot="table-header", data-slot="table-row"`,
      };

    case "avatar":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; gap: var(--space-4); align-items: center;">
              <ds-avatar fallback="AD" size="lg"></ds-avatar>
              <ds-avatar fallback="WS" size="default"></ds-avatar>
              <ds-avatar fallback="UI" size="sm"></ds-avatar>
            </div>
          `;
        },
        code: `<ds-avatar fallback="CN" size="default"></ds-avatar>`,
        slots: `data-slot="avatar", data-slot="avatar-fallback"`,
      };

    case "empty":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-empty-state
              icon="inbox"
              title="暂无任何活跃任务"
              description="您可以点击下方按钮创建您的第一个任务。"
            >
              <ds-button icon="plus">新建任务</ds-button>
            </ds-empty-state>
          `;
        },
        code:
          `<ds-empty-state icon="inbox" title="暂无数据" description="...">\n  <ds-button>操作</ds-button>\n</ds-empty-state>`,
        slots: `data-slot="empty", data-slot="empty-icon", data-slot="empty-title"`,
      };

    case "skeleton":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; gap: var(--space-4); width: 100%; max-width: 24rem;">
              <ds-skeleton style="width: 3rem; height: 3rem; border-radius: var(--radius-full);"></ds-skeleton>
              <div style="display: flex; flex-direction: column; gap: var(--space-2); flex: 1;">
                <ds-skeleton style="height: 1rem; width: 60%;"></ds-skeleton>
                <ds-skeleton style="height: 0.75rem; width: 90%;"></ds-skeleton>
              </div>
            </div>
          `;
        },
        code: `<ds-skeleton style="width: 100%; height: 2rem;"></ds-skeleton>`,
        slots: `data-slot="skeleton"`,
      };

    case "progress":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); width: 100%; max-width: 24rem;">
              <div>
                <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); margin-bottom: 4px;">
                  <span>迁移进度</span>
                  <span>65%</span>
                </div>
                <ds-progress value="65"></ds-progress>
              </div>
              <ds-progress value="100"></ds-progress>
            </div>
          `;
        },
        code: `<ds-progress value="65"></ds-progress>`,
        slots: `data-slot="progress", data-slot="progress-indicator"`,
      };

    case "spinner":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; gap: var(--space-4); align-items: center;">
              <ds-spinner size="sm"></ds-spinner>
              <ds-spinner size="default"></ds-spinner>
              <ds-spinner size="lg"></ds-spinner>
            </div>
          `;
        },
        code: `<ds-spinner size="default"></ds-spinner>`,
        slots: `data-slot="spinner"`,
      };

    case "chart":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-chart style="max-width: 28rem; height: 12rem; display: flex; align-items: flex-end; gap: var(--space-2); padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background-color: var(--color-card);">
              <div style="flex: 1; height: 40%; background: var(--color-primary); border-radius: var(--radius-sm);"></div>
              <div style="flex: 1; height: 75%; background: var(--color-primary); border-radius: var(--radius-sm);"></div>
              <div style="flex: 1; height: 55%; background: var(--color-primary); border-radius: var(--radius-sm);"></div>
              <div style="flex: 1; height: 90%; background: var(--color-primary); border-radius: var(--radius-sm);"></div>
              <div style="flex: 1; height: 60%; background: var(--color-primary); border-radius: var(--radius-sm);"></div>
            </ds-chart>
          `;
        },
        code: `<ds-chart></ds-chart>`,
        slots: `data-slot="chart"`,
      };

    case "carousel":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="max-width: 26rem; width: 100%;">
              <ds-carousel>
                <div style="min-width: 100%; height: 8rem; background: var(--color-muted); display: flex; align-items: center; justify-content: center; font-weight: 600; border-radius: var(--radius-lg);">卡片幻灯 1</div>
                <div style="min-width: 100%; height: 8rem; background: var(--color-muted); display: flex; align-items: center; justify-content: center; font-weight: 600; border-radius: var(--radius-lg);">卡片幻灯 2</div>
              </ds-carousel>
            </div>
          `;
        },
        code: `<ds-carousel>\n  <div>Slide 1</div>\n  <div>Slide 2</div>\n</ds-carousel>`,
        slots: `data-slot="carousel", data-slot="carousel-content"`,
      };

    case "aspect-ratio":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="width: 100%; max-width: 22rem;">
              <ds-aspect-ratio ratio="1.7777">
                <div style="width: 100%; height: 100%; background: var(--color-muted); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: var(--text-sm); font-weight: 600;">16 : 9 固定比例容器</div>
              </ds-aspect-ratio>
            </div>
          `;
        },
        code: `<ds-aspect-ratio ratio="1.7777">\n  <img src="..." />\n</ds-aspect-ratio>`,
        slots: `data-slot="aspect-ratio"`,
      };

    case "item":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="max-width: 22rem; width: 100%; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden;">
              <ds-item style="border-bottom: 1px solid var(--color-border);">
                <ds-avatar size="sm" fallback="A"></ds-avatar>
                <div style="flex: 1;"><div style="font-size: var(--text-sm); font-weight: 600;">条目一</div><div style="font-size: var(--text-xs); color: var(--color-fg-muted);">详情说明</div></div>
              </ds-item>
              <ds-item>
                <ds-avatar size="sm" fallback="B"></ds-avatar>
                <div style="flex: 1;"><div style="font-size: var(--text-sm); font-weight: 600;">条目二</div><div style="font-size: var(--text-xs); color: var(--color-fg-muted);">详情说明</div></div>
              </ds-item>
            </div>
          `;
        },
        code: `<ds-item><div>Item content</div></ds-item>`,
        slots: `data-slot="item"`,
      };

    case "attachment":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-2);">
              <ds-attachment filename="ARCHITECTURE.md"></ds-attachment>
              <ds-attachment filename="design-tokens.json"></ds-attachment>
            </div>
          `;
        },
        code: `<ds-attachment filename="document.pdf"></ds-attachment>`,
        slots: `data-slot="attachment"`,
      };

    case "bubble":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-3); width: 100%; max-width: 24rem;">
              <ds-bubble role="assistant">你好！我是智能编码助手，请问有什么可以帮助您？</ds-bubble>
              <div style="display: flex; justify-content: flex-end;">
                <ds-bubble role="user">请帮我检查 Base UI 组件规范。</ds-bubble>
              </div>
            </div>
          `;
        },
        code:
          `<ds-bubble role="assistant">AI 回复</ds-bubble>\n<ds-bubble role="user">用户提问</ds-bubble>`,
        slots: `data-slot="bubble"`,
      };

    case "message":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-message>
              <ds-avatar fallback="AI" size="sm"></ds-avatar>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: var(--text-xs); font-weight: 600;">Antigravity Assistant</span>
                <span style="font-size: var(--text-sm); color: var(--color-fg);">全套 62 款 Shadcn Base UI 原生 Web Components 已就绪。</span>
              </div>
            </ds-message>
          `;
        },
        code:
          `<ds-message>\n  <ds-avatar fallback="U"></ds-avatar>\n  <div>Message</div>\n</ds-message>`,
        slots: `data-slot="message"`,
      };

    case "marker":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; align-items: center; gap: var(--space-4);">
              <div style="display: flex; align-items: center; gap: var(--space-2);"><ds-marker></ds-marker><span style="font-size: var(--text-sm);">活跃在线</span></div>
            </div>
          `;
        },
        code: `<ds-marker></ds-marker>`,
        slots: `data-slot="marker"`,
      };

    case "questionnaire":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-questionnaire style="max-width: 24rem; width: 100%;">
              <div style="font-size: var(--text-sm); font-weight: 600;">1. 您偏好的主题风格？</div>
              <ds-radio-group value="nova">
                <ds-radio-group-item value="nova">Nova 极简风格</ds-radio-group-item>
              </ds-radio-group>
            </ds-questionnaire>
          `;
        },
        code: `<ds-questionnaire>\n  <div>题目...</div>\n</ds-questionnaire>`,
        slots: `data-slot="questionnaire"`,
      };

    case "message-scroller":
      return {
        render: (container) => {
          container.innerHTML = `
            <ds-scroll-area style="width: 100%; max-width: 24rem; height: 10rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-3);">
              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                <ds-bubble role="assistant">消息 1: 对话已连接</ds-bubble>
                <ds-bubble role="user">消息 2: 请求组件列表</ds-bubble>
                <ds-bubble role="assistant">消息 3: 62 款 Base UI 组件已就绪</ds-bubble>
              </div>
            </ds-scroll-area>
          `;
        },
        code:
          `<ds-scroll-area data-slot="message-scroller">\n  <ds-bubble>Message</ds-bubble>\n</ds-scroll-area>`,
        slots: `data-slot="message-scroller"`,
      };

    default:
      return null;
  }
}
