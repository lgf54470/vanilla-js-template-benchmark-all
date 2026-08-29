# Components.md — 组件库规范

对应 [`ARCHITECTURE.md §6.4`](../ARCHITECTURE.md#6-设计系统nova--zinc) 与
[§5.2](../ARCHITECTURE.md#5-前端架构布局--路由--sidebar)。新增组件前先通读本文件目录，确认没有可复用项。

## 1. 组件authoring 约定

- 位置：`shared/ui/<name>/`，文件拆分：`<name>.js`（`customElements.define` +
  逻辑）、`<name>.css`（样式，`adoptedStyleSheets`
  注入）、`<name>.md`（本组件在画廊页的说明，可选）。
- 单文件 > 500 行时按"逻辑 / 模板 / 事件处理"拆分为 `<name>.component.js` +
  `<name>.template.js` + `<name>.handlers.js`，`<name>.js` 只做组装导出。
- 所有组件必须支持键盘操作与 `aria-*`
  语义，不因为"是自己写的组件"而降低无障碍标准。
- Props 通过 HTML attribute + 对应 property getter/setter 双向暴露（原生 Web
  Components 惯例），复杂数据（数组/对象）走 property，不塞进 attribute 字符串。
- 事件用标准 `CustomEvent`，命名 `<name>-change` / `<name>-select` 等，`detail`
  携带结构化数据。
- 开发模式路由 `/__dev/components`
  渲染本目录下所有组件的可交互画廊（生产构建剔除），替代 Storybook。

## 2. 组件目录

| 组件                                  | 用途                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| `<ds-button>` / `<ds-icon-button>`    | 按钮，`variant`: primary/secondary/ghost/danger        |
| `<ds-input>` / `<ds-textarea>`        | 表单输入                                               |
| `<ds-select>`                         | 下拉选择                                               |
| `<ds-checkbox>` / `<ds-switch>`       | 布尔输入                                               |
| `<ds-segmented-control>`              | 胶囊分段控件，`<ds-theme-switch>` 与会话时长选择器复用 |
| `<ds-tabs>` + `<ds-tab>`              | 标签页（顶栏 tab / 方向键导航 / `ds-tabs-change`）     |
| `<ds-dialog>` / `<ds-confirm-dialog>` | 替代 `alert/confirm`                                   |
| `<ds-sheet>`                          | 抽屉，移动端 Sidebar 与通用侧滑面板复用                |
| `<ds-toast-host>`（`toast.*` API）    | 替代 `alert`，全局单例挂载于 `<body>` 末尾             |
| `<ds-dropdown-menu>`                  | Dropdown/Menu，`WorkspaceSwitcher`/`NavUser` 均基于它  |
| `<ds-card>`                           | 卡片容器                                               |
| `<ds-badge>`                          | 状态徽标                                               |
| `<ds-avatar>`                         | 头像，无图时降级为首字母                               |
| `<ds-tooltip>`                        | 悬浮提示，Sidebar 收起态菜单项复用                     |
| `<ds-skeleton>`                       | 骨架屏（`Design.md §6`）                               |
| `<ds-empty-state>`                    | 空状态                                                 |
| `<ds-page-placeholder>`               | 页面占位（空态/错误态/未实现占位）                     |
| `<ds-breadcrumb>`                     | 面包屑（已实现，当前 Header 未接线，保留组件）         |
| `<ds-workspace-badge>`                | 当前工作空间只读徽标（已实现，当前未接线，保留组件）   |
| `<masked-field>`                      | 敏感字段掩码 + 眼睛图标切换                            |
| `<ds-theme-switch>`                   | 三段胶囊：system/dark/light                            |
| `<ds-lang-switch>`                    | 语言切换                                               |
| `<ds-sidebar-*>` 系列                 | 见 §3                                                  |
| `<ds-workspace-switcher>`             | 见 §4                                                  |
| `<ds-nav-user>`                       | 见 §5                                                  |

> **已实现**：`<ds-tabs>`（`shared/ui/tabs/tabs.js`，行为见 `docs/Components.md §8`）。
>
> **尚未实现**：`<ds-table>` / `<ds-pagination>`。需要时按 §1 的
> authoring 约定新增（Pagination 对接 `Database.md §4.1` keyset 约定），不要在
> 现有组件上叠加变通实现。

## 3. Sidebar 系列（对齐 shadcn `base-nova`）

### 3.1 组合结构

见 [`ARCHITECTURE.md §5.2`](../ARCHITECTURE.md#5-前端架构布局--路由--sidebar)
的组合树。以下补全逐组件属性表。

### 3.2 `<ds-sidebar-provider>`

| 属性/状态                           | 类型                        | 说明                                                                              |
| ----------------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| `defaultOpen`                       | boolean                     | 首次渲染是否展开（读取 `localStorage['pref:sidebar-open']`，无记录时默认 `true`） |
| `state` (只读，反映为 `data-state`) | `'expanded' \| 'collapsed'` |                                                                                   |
| `open` / `setOpen(v)`               | boolean / fn                | 桌面态展开控制                                                                    |
| `openMobile` / `setOpenMobile(v)`   | boolean / fn                | 移动态 Sheet 控制                                                                 |
| `isMobile` (只读)                   | boolean                     | 由 `matchMedia('(max-width: 767px)')` 驱动                                        |
| `toggleSidebar()`                   | fn                          | `Ctrl/Cmd+B` 绑定的方法                                                           |

内部通过 `shared/core/store.js` 的 `createStore` 持有以上状态，子组件用
`element.closest('ds-sidebar-provider').store` 订阅，不用框架 Context。

### 3.3 `<ds-sidebar>`

| 属性          | 取值                           | 说明                                                         |
| ------------- | ------------------------------ | ------------------------------------------------------------ |
| `side`        | `left \| right`                | 默认 `left`                                                  |
| `variant`     | `sidebar \| floating \| inset` | `inset` 需配合 `<ds-sidebar-inset>` 包裹主内容               |
| `collapsible` | `offcanvas \| icon \| none`    | 默认 `icon`：收起后保留窄图标条；`offcanvas`：收起后完全隐藏 |

反映为 `data-side` / `data-variant` / `data-collapsible` / `data-state`
属性，样式规则全部基于这些 `data-*` 选择器（见 `CSS.md`），组件 JS 不计算
className。

### 3.4 子组件

| 组件                                                                                     | 说明                                                                                                                              |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `<ds-sidebar-header>`                                                                    | 承载 `<ds-workspace-switcher>`                                                                                                    |
| `<ds-sidebar-content>`                                                                   | 唯一在 Sidebar 内可滚动的子区域（Sidebar 自身不滚动，Header/Footer 固定）                                                         |
| `<ds-sidebar-group>` + `<ds-sidebar-group-label>`                                        | 菜单分组                                                                                                                          |
| `<ds-sidebar-menu>` / `<ds-sidebar-menu-item>` / `<ds-sidebar-menu-button>`              | 一级菜单（对应模块），`isActive` 属性高亮当前路由，收起态自动显示 `tooltip`（内容取自 `title` 属性）                              |
| `<ds-sidebar-menu-badge>`                                                                | **尚未实现**（预留：如未读数）                                                                                                    |
| `<ds-sidebar-menu-sub>` / `<ds-sidebar-menu-sub-item>`                                   | 子模块列表，外层需要 `<ds-collapsible>` 包裹以支持展开/收起，箭头图标随 `data-state="open"` 旋转 90°（全站 no-motion 下瞬时切换） |
| `<ds-sidebar-footer>`                                                                    | 承载 `<ds-nav-user>`                                                                                                              |
| `<ds-sidebar-rail>`                                                                      | 细边栏，桌面态可拖拽点击切换，移动态隐藏                                                                                          |
| `<ds-sidebar-inset>`                                                                     | shadcn `SidebarInset` 的等价物；本项目用 light-DOM 容器                                                                           |
| `.app-shell__inset`（header + main）承担，`variant="inset"` 的卡片化样式在 app-shell.css |                                                                                                                                   |
| `<ds-sidebar-trigger>`                                                                   | 汉堡图标按钮，置于 Header，`aria-label` 读 `shell.nav.toggleSidebar`                                                              |

### 3.5 键盘与交互

- `Ctrl/Cmd+B`：全局绑定，调用 `toggleSidebar()`。
- `Ctrl/Cmd+1`..`6`：见 §4，切换前 6 个工作空间。
- 移动端（`isMobile=true`）：`<ds-sidebar>` 渲染为 `<ds-sheet side="left">`，由
  `openMobile` 控制。

### 3.6 CSS 变量

尺寸三件套在 `shared/styles/tokens/sidebar.css`（`--sidebar-width: 16rem` /
`--sidebar-width-icon: 3rem` / `--sidebar-width-mobile: 18rem`）；颜色
（`--sidebar/--sidebar-foreground/--sidebar-border/--sidebar-primary/
--sidebar-accent/--sidebar-ring`）由
`themes/palettes-base.css` 的 `base-*`
类提供（oklch，随基色/暗色整体切换）——**不是** shadcn 老文档的 HSL 三元组
形式，组件消费语义层（`docs/CSS.md §2.4`），禁止写死颜色。

## 4. `<ds-workspace-switcher>`

位于 `<ds-sidebar-header>`。触发器展示当前工作空间图标（`icon` 属性对应图标
sprite 名）+ 名称（走 §6 的 i18n key/字面量判定逻辑）。下拉内容（对齐参考
teamItems 结构）：

1. 顶部「工作空间」小字标签（i18n key `sidebar.workspaces`）。
2. 工作空间列表：每项左侧 6×6 图标磁贴（border + `bg-muted/30`）+ 名称
   （`flex-1` 截断）+ **当前项右端 `circle-check` 对勾**（主色）；`Ctrl+1..6`
   快捷切换前 6 个（键盘监听在组件内，`data-shortcut` 属性保留供测试/扩展，
   可见提示文字不展示）。
3. 分隔线。
4. `+ 新建工作空间`（同样带磁贴；打开 `<ds-dialog>` 表单：名称必填、图标可选默认
   `folder`）。

点击列表项 → 触发 `workspace-switcher-select` 事件（`detail: { workspaceId }`）→
`shared/core/event-bus.js` 广播全局 `workspace:changed`（见
`Workspace.md §切换时序`）。

## 5. `<ds-nav-user>`

位于 `<ds-sidebar-footer>`。触发器：`<ds-avatar>` + 用户名（掩码显示，见
`Database.md §5.3`）。下拉菜单：

0. **菜单头**（对齐参考 DropdownMenuLabel）：首字母头像方块 + 用户名 + 次行
   掩码邮箱（壳层 `loadProfile` 从 `/api/settings/account` 拉取经 `maskValue`
   后以 `email` 属性下发；未配置时显示「未绑定邮箱」三语占位）→ 分隔线。
1. 设置 → `/settings`
2. 配置文件 → `/settings/profile`
3. 用户资料 → `/settings/account`
4. 退出登录 → 调用 `/api/auth/logout`，清除本地令牌存储后跳转登录页

菜单头下方与登出项上方各一条分隔线（`-mx-1 my-1 h-px bg-border` 语义；注意
分隔线在包装层内时 `::slotted` 穿不透，需直接样式，见
`docs/bug/2026-08-28-slotted-only-matches-top-level.md`），登出用
`--color-danger`
语义色区分（登出是"结束态"操作，视觉上与普通导航项区分，但不是"危险删除"级别的强警示色）。

## 6. `<masked-field>`

```html
<masked-field value="user@example.com" mask-type="email"></masked-field>
```

| 属性        | 说明                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`     | 明文值（组件内部持有，不反映到可见 DOM 属性，避免明文出现在 devtools Elements 面板的默认展开视图中造成误泄露——通过 property 传入而非 attribute） |
| `mask-type` | `email \| phone \| generic`，决定掩码算法（`Database.md §5.3`）                                                                                  |
| 眼睛图标    | 点击切换 `data-revealed` 属性，触发显隐；组件卸载或路由切换时重置为掩码态                                                                        |

无障碍：切换按钮 `aria-pressed` 反映当前状态，`aria-label`
分别为"显示明文"/"隐藏明文"（走 i18n）。

## 7. `<ds-theme-switch>`（三段胶囊）

基于 `<ds-segmented-control>`：`role="radiogroup"`，三个 `role="radio"`
选项（`system`/`light`/`dark`），选中态背景滑块用 `transform: translateX()`
位移（不是重新布局，避免抖动；全站 no-motion 下瞬时切换）。会话时长选择的 2×4
网格（`Auth.md §2`）复用同一个底层 `<ds-segmented-control>`
组件，仅传入不同的选项集合与网格布局属性。

## 8. Dialog / ConfirmDialog / Toast（禁用浏览器内置对话框的替代品）

- `<ds-dialog>`：遮罩 + 内容区，`Esc` 关闭，聚焦陷阱（focus
  trap），关闭后焦点归还触发元素。
- `<ds-confirm-dialog>`：`<ds-dialog>` 的语义封装，Props
  `title`/`description`/`confirmLabel`/`danger`（危险操作时确认按钮用
  `--color-danger`），返回 Promise
  供命令式调用：`await confirmDialog({ title, description })`（命名避开全局
  `confirm()`，硬规则 4 的治理脚本可据此严格禁止裸 `confirm(`）。
- `<ds-toast-host>`：全局单例元素（`shared/ui/toast/toast-host.js` 挂载一次），
  通过命令式 `toast.success(msg)` / `toast.error(msg)` / `toast.info(msg)`
  触发（不挂在页面上，由 `toast.js` 惰性创建），内部维护渲染队列，
  `--z-toast` 层级永远最高。

## 8. 标签页 `<ds-tabs>`

```html
<ds-tabs value="overview">
  <ds-tab value="overview" label="概览">内容 A</ds-tab>
  <ds-tab value="detail" label="明细">内容 B</ds-tab>
</ds-tabs>
```

- `value`：当前激活 tab 的 id；未设置时默认激活第一个 `<ds-tab>`。
- `<ds-tab value label>`：面板容器，内容即默认槽渲染；`label` 缺失时回退到
  `textContent`。
- **无动效**：激活态用 `box-shadow: inset 0 -2px` 下划线（瞬时），不带
  transition/animation（全站 no-motion，attachStyles 注入）。
- 行为：点击 tab 或 `←/→`、Home/End 方向键切换（roving tabindex）；切换时派发
  `bubbles+composed` 的 `CustomEvent('ds-tabs-change')`，`detail: { value }`。
- 角色语义：`tablist` / `tab`（`aria-selected`）/ `tabpanel`（`aria-labelledby`）。

## 9. 无障碍要求速查

| 组件类型            | 最低要求                                                      |
| ------------------- | ------------------------------------------------------------- |
| 触发下拉/菜单的按钮 | `aria-haspopup` + `aria-expanded`                             |
| 对话框              | `role="dialog"` + `aria-modal="true"` + 聚焦陷阱 + `Esc` 关闭 |
| 单选/分段控件       | `role="radiogroup"` + 子项 `role="radio"` + 方向键切换        |
| 图标按钮            | 必须有 `aria-label`（不能只靠 `title`）                       |
| 表单输入            | `<label>` 与 `id` 关联，错误信息用 `aria-describedby`         |
