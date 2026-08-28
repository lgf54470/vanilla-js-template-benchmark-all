# Layout.md — 布局规范

对应
[`ARCHITECTURE.md §5.1`](../ARCHITECTURE.md#5-前端架构布局--路由--sidebar)。定义
`sidebar-with-header` 网格的逐像素/逐断点规则，是所有模块 UI 的"容器契约"。

## 1. 顶层网格

```css
/* apps/web/src/app/shell/app-shell.css —— 实际为「侧栏列 + inset 列」两列网格 */
ds-sidebar-provider.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-current-width, var(--sidebar-width)) 1fr;
  grid-template-rows: 100%;
  grid-template-areas: 'sidebar inset';
  block-size: 100dvh;
  overflow: hidden; /* 唯一允许滚动的是 <main> */
}
.app-shell__inset {
  grid-area: inset;
  display: flex;
  flex-direction: column; /* header 固定 + main 弹性滚动 */
  min-inline-size: 0;
  overflow: hidden;
}
.app-shell__header {
  overflow: hidden; /* 高度 3.5rem（模板 h-14） */
}
.app-shell__main {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-4); /* 移动端 --space-3 */
}
```

- `--sidebar-current-width`：拖拽/展开收起时由 appearance 状态写为
  `var(--sidebar-width)`（展开，拖拽中为实时值）或
  `var(--sidebar-width-icon)`（图标条）。过渡声明
  `transition: grid-template-columns var(--motion-fast) var(--ease-standard)`
  目前被全站 no-motion 压制（状态切换瞬时完成，见 `CSS.md §9`）；
  声明本身保留供未来整体恢复动效。
- **变体**：`<html data-sidebar-variant>`（appearance 引擎维护）驱动
  `sidebar`（默认贴边）/ `floating`（侧栏悬浮卡片）/
  `inset`（内容区内嵌卡片）三形态，样式在 `app-shell.css`。
- 移动端（`<768px`）：Sidebar 脱离网格，改为 `<ds-sheet>` 覆盖层； 网格列退化为
  `1fr`（Sidebar 不占列宽）。

### 1.1 拖拽调宽链路（防回归）

ResizeHandle 拖拽必须**逐帧跟手**，以下三点缺一不可，改动前先读懂：

1. **双变量同帧写入**：`bindResizeHandle`（`app-shell.js`）的 rAF apply 同时写
   `--sidebar-current-width`（网格列）与 `--sidebar-width`（面板宽度令牌）。
   面板宽度的解析链是 `ds-sidebar` 内联
   `--sidebar-self-width: var(--sidebar-width)` → 内层 `.sidebar`
   `inline-size: var(--sidebar-self-width, ...)`；**元素内联优先于继承**，
   只改列变量面板不会动，必须改令牌本身。
2. **拖拽中过渡置零**：`.sidebar` 的 `inline-size` 带过渡声明
   （`--sidebar-resize-duration`，默认 `--motion-base`；当前被全站 no-motion
   压制为瞬时，此机制是未来恢复动效时的保命阀）：拖拽中 `body.sidebar-resizing`
   将其置 `0s`，否则每次宽度更新都重启动画， 视觉上宽度追着鼠标、松手才到位。
3. **职责边界**：拖拽期间只写 CSS 变量（不进 store、不写 localStorage）；
   `pointerup` 才 `setSidebarWidth()` 持久化（appearance:changed → provider
   重写令牌，状态归一）。松手宽度 `< min + 24px` 时吸附折叠
   （`provider.setOpen(false)`，先清拖拽内联变量避免残留）。

## 2. 断点表

| 断点 | 值     | 行为                                           |
| ---- | ------ | ---------------------------------------------- |
| `sm` | 640px  | 卡片网格从 1 列变 2 列                         |
| `md` | 768px  | Sidebar 从 Sheet 覆盖模式切换为常驻网格列模式  |
| `lg` | 1024px | 统计/卡片网格可到 3-4 列                       |
| `xl` | 1280px | 卡片网格上限，超出居中留白而非继续拉伸单卡宽度 |

CSS 变量不能进媒体查询，因此**媒体查询直接写 px 值**（如
`@media (max-width: 767px)`，与 `md` 保持同步）；组件 JS 逻辑用
`shared/lib/breakpoints.js` 的常量判断（如 `isMobile`），两处改动必须同步：

```js
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };
```

## 3. Header 规格

固定高度 3.5rem（模板 h-14），内容从左到右：`<ds-sidebar-trigger>`（含
Ctrl/Cmd+B 提示）→ 应用名（vanilla-js-template）→ 弹性空白 → `<ds-lang-switch>`
→ `<ds-theme-switch>`（三段胶囊）→ `<ds-theme-settings>`（主题设置面板入口）→
登出图标按钮。Header 内**不**放模块私有操作按钮——模块级操作放在 `<main>`
顶部的模块自有工具栏里。工作空间的入口在 Sidebar 顶部的
`<ds-workspace-switcher>`（§7.5）；面包屑与工作空间徽标当前未在 Header 接线
（组件保留，需要时按本节位置补回）。

## 4. Main 区域

```css
/* app-shell.css：main 只负责滚动与内边距 */
.app-shell__main {
  padding: var(--space-4);
}

/* style.css：旧的全局 1440px 限宽已移除，限宽职责归页面自己的容器 */
.main-container {
  max-inline-size: none;
  margin-inline: 0;
}

/* 页面容器（模板页面根：mx-auto max-w-5xl flex-col gap-6） */
.page-container {
  max-inline-size: 64rem; /* narrow 变体 48rem（max-w-3xl） */
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
```

新增模块的根元素必须是 `<main>` 的直接或间接子节点，禁止通过
`position: fixed`/`z-index` 手段"溢出"到 Header/Sidebar
视觉区域（对话框/抽屉/Toast 等浮层组件除外，它们本身是 `shared/ui`
提供的框架级组件，走独立的 `--z-*` 层级，见 §6）。

## 5. 信息密度：减少留白的具体做法

反对"大留白 + 少信息"的默认卡片样式，改用以下手段收敛空白：

1. **卡片网格自适应而不是固定列数**：
   ```css
   .card-grid {
     display: grid;
     grid-template-columns: repeat(auto-fit, minmax(var(--card-min-w, 16rem),
       1fr));
     gap: var(--space-3);
   }
   ```
2. **卡片内边距用较小刻度**（`--space-3`/`--space-4`，不用 `--space-6`
   以上），代之以：
   - 更大字号承载层级（标题用 `--text-lg` 而不是靠上边距制造重量感）；
   - 关键数值/状态配图标（`shared/ui` 图标
     sprite），图标本身占位比空白更"有信息量"；
   - 用 1px 边框（`--sidebar-border` 同族的 `--color-border`
     令牌）分隔而不是大间距分隔。
3. **空状态（Empty State）也要克制**：图标 + 一句话 +
   一个操作按钮，不铺满整屏留白，参考 `Design.md#空状态`。

## 6. 层级（Z-index）表

| 令牌                       | 用途                              |
| -------------------------- | --------------------------------- |
| `--z-sidebar-mobile-sheet` | 移动端 Sidebar 抽屉               |
| `--z-dropdown`             | Dropdown/Menu                     |
| `--z-sheet`                | 通用 Sheet（非 Sidebar）          |
| `--z-dialog`               | Dialog/ConfirmDialog 的遮罩与内容 |
| `--z-toast`                | Toast，永远最高                   |

数值定义在 `shared/styles/tokens/zindex.css`，禁止组件内写裸数字。

## 7. RTL 预留

当前三种语言（zh-CN/zh-TW/en）均为 LTR，本轮不实现
RTL，但网格与间距优先使用逻辑属性（`padding-inline`/`margin-inline-start` 而不是
`padding-left`）为未来扩展留口子，具体规则见 `CSS.md#逻辑属性`。
