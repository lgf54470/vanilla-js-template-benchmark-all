# ADR 0004: Sidebar 组件对齐 shadcn base-nova 规格

- 状态：已采纳
- 日期：2026-08-27
- 相关模块/文档：`ARCHITECTURE.md §5.2`、`docs/Components.md §3`

## 背景

项目要求 UI 风格统一为 "shadcn base UI nova style zinc theme"，且 Sidebar
样式明确要求参考 `ui.shadcn.com/docs/components/base/sidebar`。shadcn
官方实现基于 React + Base UI（`render` 组合模式），本项目是零依赖原生 Web
Components，无法直接复用其代码，需要决定"照抄多少、自研多少"。

## 考虑过的选项

1. **只借用视觉观感（颜色/圆角/间距），交互与组合结构自行设计**：实现自由度高，但容易与
   shadcn 原版的交互细节（键盘快捷键、收起态 tooltip、移动端 Sheet
   行为等）产生不一致，用户体验打折扣。
2. **完整移植组合树、状态模型、CSS 变量与交互细节，仅把实现语言从 React+Base UI
   换成原生 Web
   Components**：忠实还原文档中列出的每一层组件（Provider/Sidebar/Header/Content/Group/Menu/Footer/Rail/Inset/Trigger）、状态模型（`state`/`open`/`openMobile`/`isMobile`）、CSS
   变量（含亮暗两套 HSL 值）与交互（`Ctrl/Cmd+B`、收起态 tooltip、data-*
   驱动样式）。

## 决定

采用**选项 2**：在 `docs/Components.md §3` 与 `ARCHITECTURE.md §5.2`
中逐组件对照落地 shadcn 文档给出的组合结构、状态模型、CSS
变量与交互细节，仅将底层实现从 React/Base UI 换成原生 Custom Elements + `data-*`
属性驱动的纯 CSS 选择器（后者与 shadcn 自身依赖 Tailwind 任意值选择器
`data-[state=...]` 的思路高度同构，移植成本低于预期）。

## 后果

- Sidebar 相关组件数量较多（约 15
  个自定义元素），但每个都很薄（组合装配为主，逻辑集中在 `<ds-sidebar-provider>`
  一处的状态存储），符合"单文件 ≤ 500 行"约束。
- 后续 shadcn 官方若调整 `base-nova`
  细节，本项目不会自动同步（因为不是运行时依赖），需要人工比对文档差异后决定是否跟进，属于主动接受的维护成本。
- 团队/贡献者可以直接参照 shadcn
  官方文档理解交互预期，降低了"这个组件应该怎么表现"的沟通成本。
