# AGENTS.md

给 AI 编码助手（Claude Code
等）和人类协作者的速查表。**这里只列硬规则和命令，原理与细节一律看
[`ARCHITECTURE.md`](./ARCHITECTURE.md) 或对应 `docs/*.md`。**
改动前先定位到具体章节，不要凭记忆猜测约定。

## 核心思想

- 以第一性原理思考问题。理解需求背后的真实目标，而不是直接套用已有模式或技术方案。
- 优先解决本质问题，避免为假设中的未来需求提前设计复杂系统。
- 在保证长期可维护性的前提下，选择当前最简单、可靠、清晰的实现方案。

## 代码质量原则

- 保持模块职责明确，避免一个模块承担过多职责。
- 优先使用成熟、稳定、维护良好的第三方库，而不是重复造轮子。
- 使用项目已有依赖解决问题之前，不要随意新增依赖。
- 在引入新方案前，先检查已有代码、依赖、文档和能力。

## 简洁与设计原则

- 遵循 KISS（Keep It Simple, Stupid）原则：优先选择简单直接的实现，避免不必要的复杂度。
- 遵循 DRY（Don't Repeat Yourself）原则：避免重复逻辑，但不要为了消除少量重复而创建过度抽象。
- 遵循 SOLID 思想：保持职责清晰、降低模块耦合，提高代码可维护性和扩展能力。
- 避免为了“看起来更优雅”而增加实际复杂度。

## 工程决策原则

- 优先选择长期可维护的方案，而不是只能临时运行的解决方案。
- 代码应该服务于业务目标，而不是为了展示技术复杂度。
- 如果简单方案已经满足需求，不要主动升级为复杂方案。

## 架构原则

- 不要为了保持向后兼容而长期保留废弃方案。优先删除过时代码，而不是增加兼容层、fallback 或临时迁移逻辑。
- 不要进行未经验证的架构设计。避免提前引入抽象、配置和间接层。
- 从最小可工作的版本开始，逐步演进系统。每次修改都应该建立在已有可运行系统之上。
- 永远不要用未来可能需要的复杂性，牺牲当前产品的可用性。



## 项目一句话

零 npm 依赖的原生 JS 模块化应用模板：Web Components 前端 + Hono 后端（源码
vendored），侧栏每个菜单 = 一个模块，数据按「工作空间」隔离，支持
Cloudflare/Vercel/Deno/Docker 四平台部署。

## 十条硬规则（违反任意一条 = 需要重写，不是"下次改进"）

1. 禁止 `npm install`/`bun install` 拉取运行时依赖。仅
   `packages/lib/hono`、`packages/lib/libsql-client` 是 vendored 例外 →
   [ARCHITECTURE §2](./ARCHITECTURE.md#2-技术栈与依赖边界关键决策) /
   `docs/Vendoring.md`
2. 禁止跨模块 `import`。跨模块只能走 `shared/core/event-bus.js` 或
   `shared/core/module-registry.js` →
   [§4](./ARCHITECTURE.md#4-模块系统与解耦规则)
3. 禁止硬编码颜色/圆角/间距字面量，一律用 CSS 变量；组件只引用语义层 `--color-*`
   与风格层 `--ds-*`，禁止直引 `--background`/`--zinc-*` 原始层 →
   [§6.2](./ARCHITECTURE.md#6-设计系统nova--zinc) / `docs/CSS.md §2`
4. 禁止 `alert()`/`confirm()`/`prompt()`，用 `shared/ui` 里的
   `<ds-dialog>`/`<ds-toast>` → [§6.4](./ARCHITECTURE.md#6-设计系统nova--zinc)
5. 禁止字符串拼接 SQL，一律参数化 → [§9.4](./ARCHITECTURE.md#9-数据库架构) /
   `docs/Database.md`
6. **所有 `[module]_xxx` 业务表必须带 `workspace_id` 并通过
   `createScopedRepository(...).forWorkspace(id)` 访问**，不允许裸查询 →
   [§7](./ARCHITECTURE.md#7-工作空间workspace与数据隔离) / `docs/Workspace.md`
7. 单文件源码 ≤ 500 行，超限按业务逻辑拆分 → `scripts/check-file-length.js`
8. 只有 `<main>` 可滚动；新模块 UI 只能出现在 `<main>` 内，不碰 Header/Sidebar →
   [§5.1](./ARCHITECTURE.md#5-前端架构布局--路由--sidebar) / `docs/Layout.md`
9. 敏感字段（邮箱/手机/密码/API Key/Token/DB 凭据等）必须加密存储 + 前端掩码显示
   → [§9.4](./ARCHITECTURE.md#9-数据库架构)
10. 提交信息遵循 Conventional Commits，正文逐文件说明改动（到方法/组件级）→
    [§17](./ARCHITECTURE.md#17-git-提交规范摘要) / `docs/Commit.md`

> **Shadow 组件附加约束**（见 `docs/CSS.md §9`）：全站无动效——组件禁止自带
> 生效的 `transition`/`animation`（no-motion 由 `attachStyles` 注入）； shadow
> 内原生 button/input 必须重置 UA 样式；document 级“外点关闭”用
> `composedPath()`（嵌套 shadow 下 `contains()` 恒 false）；弹层等待动画用
> `waitForTransition()`，禁止裸 `setTimeout(固定ms)`。踩坑实录见 `docs/bug/`。

## 新增一个模块的最小步骤

1. `apps/web/src/modules/<id>/` 建 `module.json`（菜单元数据）+
   `index.js`（入口）+ `i18n/{zh-CN,zh-TW,en}.json`（key 三语一致，
   `scripts/check-i18n-keys.js` 强制）。
2. **有数据需求**才建后端：`apps/server/src/modules/<id>/` 建 `routes.js` +
   `service.js` + `repository.js` + `migrations/0001_init.sql`（表名
   `<id>_xxx`， 带 `workspace_id`）；纯展示模块（如 dashboard）跳过本步。
3. 组件/工具函数先查 `shared/ui`、`shared/lib` 是否已有，不重复造轮子 →
   `docs/Components.md`；light-DOM 页面样式用
   `ensurePageStyles(import.meta.url, "./styles/<page>.css")` 注入（孤儿
   样式文件不会报错，见 `docs/bug/2026-08-28-orphan-page-css.md`）。
4. 不要改 `app/shell` 里的任何文件——侧栏由 `module.json` 自动驱动。

## 常用命令（全部基于 Deno，脚手架阶段以 `justfile` 为准）

```
just dev              # 本地开发（Deno + SQLite）
just fmt / just lint   # deno fmt / deno lint + scripts/ 治理脚本
just fmt-check         # 仅检查格式（CI 第一步用）
just test              # 全量测试（单元/集成/UI 冒烟）
just db-migrate        # 执行迁移
just build-web         # 组装前端静态产物 dist/web（平台发布用）
just deploy-<target>   # cloudflare | vercel | deno | docker
```

## 文档地图

| 想知道...                       | 看这里                                  |
| ------------------------------- | --------------------------------------- |
| 整体架构、每一项决策的"为什么"  | `ARCHITECTURE.md`                       |
| 布局网格细节                    | `docs/Layout.md`                        |
| 设计令牌 / 视觉规范             | `docs/Design.md`、`docs/CSS.md`         |
| 组件 API（含 Sidebar 全量属性） | `docs/Components.md`                    |
| 数据库 schema / 工作空间隔离    | `docs/Database.md`、`docs/Workspace.md` |
| 鉴权时序                        | `docs/Auth.md`                          |
| 多语言 key 规则                 | `docs/i18n.md`                          |
| 测试怎么写                      | `docs/Testing.md`                       |
| 日志格式/颜色                   | `docs/Logging.md`                       |
| 部署 runbook                    | `docs/Deployment.md`                    |
| vendored 第三方库怎么更新       | `docs/Vendoring.md`                     |
| 某次事故/性能问题的调查记录     | `docs/bug/`、`docs/perf/`               |
| 某个架构决定的完整背景          | `docs/decisions/`                       |
| **从零重建本项目的初始指令**    | `docs/INITIAL-PROMPT.md`                |

## 不确定时

`ARCHITECTURE.md` 末尾
[§20 开放决策](./ARCHITECTURE.md#20-需你确认的开放决策review-checklist)
列出了尚未最终拍板的点；涉及这些点的改动，先在 PR
描述里标注引用哪一条，不要默默按自己理解实现。
