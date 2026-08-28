# ARCHITECTURE.md — vanilla-js-template 架构总纲

> 本文档是项目的**唯一真源（Single Source of Truth）**。`AGENTS.md` 是给
> AI/人类协作者的极简速查表，所有细节都指回本文件或
> `docs/*.md`。当两者冲突时，以本文件为准；当本文件与 `docs/*.md`
> 冲突时，以更具体的 `docs/*.md` 为准（并应提 PR 修正本文件）。
>
> 版本：v0.2（在 v0.1 基础上合并「工作空间隔离 / Deno 工具链 / 依赖 vendoring /
> shadcn Sidebar 规格」四项变更决策）

## 目录

0. [变更记录](#0-变更记录)
1. [项目哲学与不可协商项](#1-项目哲学与不可协商项)
2. [技术栈与依赖边界（关键决策）](#2-技术栈与依赖边界关键决策)
3. [Monorepo 目录结构](#3-monorepo-目录结构)
4. [模块系统与解耦规则](#4-模块系统与解耦规则)
5. [前端架构：布局 / 路由 / Sidebar](#5-前端架构布局--路由--sidebar)
6. [设计系统（Nova / Zinc）](#6-设计系统nova--zinc)
7. [工作空间（Workspace）与数据隔离](#7-工作空间workspace与数据隔离)
8. [后端架构（Hono）](#8-后端架构hono)
9. [数据库架构](#9-数据库架构)
10. [鉴权系统（x-auth-password）](#10-鉴权系统x-auth-password)
11. [国际化（i18n）](#11-国际化i18n)
12. [缓存与性能](#12-缓存与性能)
13. [测试策略](#13-测试策略)
14. [日志系统](#14-日志系统)
15. [多平台部署与适配器](#15-多平台部署与适配器)
16. [代码质量门禁（零依赖静态检查）](#16-代码质量门禁零依赖静态检查)
17. [Git 提交规范摘要](#17-git-提交规范摘要)
18. [安全基线](#18-安全基线)
19. [文档体系](#19-文档体系)
20. [需你确认的开放决策（Review Checklist）](#20-需你确认的开放决策review-checklist)

---

## 0. 变更记录

| 版本 | 变更                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 初始架构：18 项需求落地，Node 中心工具链假设                                                                                                                                                                                                                                                                                                                                                                                       |
| v0.2 | ① 前端根目录布局对齐 `vite-vanilla` 基准结构（不引入 Vite 依赖）；② 全平台开发/构建/测试工具链改为 **Deno**；③ Hono、`@libsql/client` 改为**源码 vendoring** 至 `packages/lib/`，彻底移除 `npm install`；④ Sidebar 组件规格对齐 shadcn `base-nova` 风格（含 CSS 变量、组合树、键盘快捷键）；⑤ 新增**工作空间（Workspace）**作为全局数据隔离边界，侧栏「团队切换器」→「工作空间切换器」；⑥ 数据库设计改为以 `workspace_id` 强制隔离 |
| v0.3 | 实现后全量文档-代码审计：① 色彩体系权威化为四层（palettes 原始层/语义映射层/style-* 风格集/消费规则，`CSS.md` 重写）；② §5.2 修正为调色板驱动变量（废弃 HSL 三元组）+ 拖拽调宽 + inset 壳容器；③ §3 目录树对齐实际（themes/fonts/主题面板/5 平台入口/net/static/模块条件后端）；④ §6.2-6.4 重写（四层令牌表、.dark 机制、组件清单勘误）；⑤ 新增 `docs/INITIAL-PROMPT.md`（从零重建初始指令）                                       |

---

## 1. 项目哲学与不可协商项

`vanilla-js-template` 是一个**零运行时依赖**的个人/小团队自托管应用模板：不用
React/Vue/Tailwind/shadcn 的 React 实现，而是用原生 Web Components + CSS
变量手工实现同等观感与工程质感；后端只允许极少数、经过 vendoring
的必要依赖（详见 §2）。

以下是贯穿全文档、不可通过局部决策绕过的硬规则：

1. **禁止 `npm install` / `bun install` / `pnpm install` 拉取任何运行时依赖。**
   唯二例外（Hono、`@libsql/client`）以**源码 vendoring**
   方式进入仓库，不经过包管理器解析（见 §2.3）。
2. **禁止跨模块直接 `import`。** 模块只能 `import` `shared/*` 或通过事件总线 /
   能力注册表通信（见 §4）。
3. **禁止硬编码颜色 / 圆角 / 间距字面量。** 一律使用设计令牌（CSS
   自定义属性），由脚本静态扫描拦截（见 §16）。
4. **禁止使用浏览器内置对话框**（`alert/confirm/prompt`）。一律使用
   `<ds-dialog>` / `<ds-toast>` 等设计系统组件。
5. **禁止字符串拼接 SQL。** 一律参数化查询，由脚本静态扫描拦截。
6. **单文件 ≤ 500 行**（源码文件；文档类 `.md` 不受此约束，但鼓励按主题拆分）。
7. **只有 `<main>` 区域可以滚动**，Header / Sidebar 始终固定。
8. **敏感字段（见 §9.4）必须加密存储，前端必须掩码显示 + 眼睛图标切换。**
9. **每个数据表（`core_*` 除外的业务表）必须携带 `workspace_id`
   并强制按工作空间隔离**（见 §7）。

---

## 2. 技术栈与依赖边界（关键决策）

### 2.1 为什么是 Deno，而不是 Node/npm

| 需求                 | Node 生态方案               | Deno 方案                                                                                                                              |
| -------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 格式化               | Prettier（依赖）            | `deno fmt`（内置）                                                                                                                     |
| Lint（含自定义规则） | ESLint + 插件（依赖）       | `deno lint` + 自定义 lint 插件（内置）                                                                                                 |
| 测试                 | Jest/Vitest（依赖）         | `deno test`（内置，支持 `--coverage`）                                                                                                 |
| TS/JS 执行           | ts-node 等（依赖）          | 原生支持（内置）                                                                                                                       |
| 打包                 | esbuild/rollup/vite（依赖） | 视 Deno 当前版本能力而定，见下方"待定项"                                                                                               |
| 单文件可执行产物     | pkg/nexe 等（依赖）         | `deno compile`（内置，直接产出 Docker/VPS 部署的独立二进制）                                                                           |
| 权限模型             | 无                          | 显式 `--allow-net/--allow-read` 等，天然最小权限，契合安全基线                                                                         |
| 依赖解析             | `node_modules` 落盘         | 全局内容寻址缓存，零 `node_modules`；配合 `deno.json` `imports` 字段做**导入映射**，天然适合"引用 vendored 源码但保持自然 import 语法" |

**结论：Deno 是本项目开发 / 构建 / 测试 / 部署的统一 CLI**，替代此前假设的 Node
中心工具链。Node 不再作为一等公民出现在任何 `just` 脚本中；Docker/VPS
目标运行的也是 Deno（见 §15.4），不是 Node。

> ⚠️ 待定项（在脚手架阶段以当时 Deno
> 实际版本为准，不在本文档写死承诺）：生产环境 JS
> 是否需要独立"打包/压缩"步骤。`deno bundle` 在 Deno
> 历史版本中经历过弃用/重做，状态不稳定。默认策略：**开发环境零构建**（浏览器原生
> ESM + import map 直接跑源码），**生产环境优先依赖各平台边缘节点的 Brotli/Gzip
> 压缩**而不是手搓压缩器；如需真正的合并/压缩，通过
> `deno run -A npm:esbuild ...`（临时执行，不落盘依赖，见 2.3）在 CI
> 中一次性产出静态资源，不写入仓库。此项列入 §20 待你确认。

### 2.2 前端：零依赖 Web Components

- 无框架、无虚拟 DOM、无编译期 JSX。使用原生 `customElements.define`，模板用
  `<template>` + 手写 `render()`，或轻量字符串模板函数（`shared/lib/html.js`
  提供的 tagged template `html\`...\`` 工具，仅做转义与 DOM diff
  的最小实现，本身是本项目源码，不算"依赖"）。
- 状态管理：无 Redux/Zustand。使用 `shared/core/store.js` 提供的极简
  `createStore(initialState)`（发布订阅 + `EventTarget`），全局仅用于 theme /
  locale / auth / **workspace** 四类跨模块状态；模块内部状态自管理。
- 路由：`shared/core/router.js`，History API + 每模块 `dynamic import()`
  懒加载，零依赖。

### 2.3 后端：Hono（vendored，非 npm 依赖）

- `Hono` 本身是 fetch 标准、零依赖的路由框架，非常适合作为**唯一**跨 Cloudflare
  Workers / Vercel Edge / Deno Deploy / Docker(Deno 运行时)
  的统一后端框架——这也是它被选中而不是自己手撸路由器的原因（自建路由器的收益不足以抵消
  4 套边缘运行时的行为差异带来的维护成本）。
- **落地方式：不通过 `npm install` 引入。** 将 Hono 核心 +
  我们实际用到的平台适配子模块（`hono/cloudflare-workers`、`hono/deno`、`hono/vercel`）的源码快照下载后放入
  `packages/lib/hono/`，随仓库版本管理，不在构建期联网拉取。
- **`@libsql/client`（用于 Turso）同理 vendoring**：仅 vendoring 其
  **`/web`（HTTP/WebSocket，无原生绑定）构建产物**，因为本项目在边缘运行时上不具备
  Node 原生模块能力，也用不到本地文件模式（本地开发走 `node:sqlite`/Deno 的
  SQLite 能力，见 §9.2），只需要能对 Turso 发起 HTTP/WebSocket 请求的纯 JS
  客户端。
- 每个 vendored 库在 `packages/lib/<name>/VENDOR.md`
  记录：上游仓库地址、vendoring 时的具体 commit/tag、原始
  LICENSE（随文件一起保留)、vendoring 日期、`just vendor-update <name>`
  的手动同步流程（**手动、可审查，不自动升级**，避免供应链风险）。
- 应用代码里依然写自然的 `import { Hono } from "hono"`：通过根 `deno.json` 的
  `imports` 字段把裸标识符映射到 vendored 本地路径：

```jsonc
// deno.json（节选）
{
  "imports": {
    "hono": "./packages/lib/hono/mod.js",
    "hono/": "./packages/lib/hono/",
    "@libsql/client/web": "./packages/lib/libsql-client/web.js"
  }
}
```

### 2.4 部署期 CLI 工具（wrangler / vercel）不算"依赖"

`wrangler`（Cloudflare）、`vercel`（Vercel）是**开发者/CI
机器上的一次性部署工具**，不是应用运行时代码，因此不违反"禁止 npm
install"原则——它们通过 `deno run -A npm:wrangler@<版本锁定> deploy`
之类的方式**临时执行**（Deno 会缓存到全局缓存目录，不写入项目
`node_modules`，效果等价于 `npx`，用完即弃），版本号在 `justfile`
中显式锁定，避免"隐式升级"。

### 2.5 技术栈总表

| 层            | 选型                                                                        | 依赖状态                      |
| ------------- | --------------------------------------------------------------------------- | ----------------------------- |
| 运行时/工具链 | Deno（最新 LTS 级稳定版）                                                   | 系统级工具，非项目依赖        |
| 前端          | 原生 Web Components + ES Modules                                            | 零依赖                        |
| 后端框架      | Hono                                                                        | vendored 源码                 |
| 本地数据库    | SQLite（Deno 内置 `node:sqlite` 兼容层 / `Deno.openKv` 不使用，明确走 SQL） | Deno 内置                     |
| 边缘数据库    | Cloudflare D1                                                               | 平台原生绑定，非依赖          |
| 远端数据库    | Turso（libSQL）                                                             | vendored `@libsql/client/web` |
| 任务运行器    | `just`（justfile）                                                          | 系统级工具                    |
| CI            | GitHub Actions                                                              | 平台服务                      |

---

## 3. Monorepo 目录结构

前端根目录布局参考并对齐了 `bun create vite`（vanilla / JavaScript
变体）产出的最小基准结构（`index.html` 置于应用根、`public/`
存放静态资源、`src/main.js` 作为入口、`src/style.css`
作为入口样式表、`src/assets/`
存放图片等资源）——**仅借用其目录命名与位置直觉，不引入 Vite
本身作为依赖**（构建工具替换为 Deno，见 §2.1）。

```
vanilla-js-template/
├── apps/
│   ├── web/                              # 前端应用
│   │   ├── index.html                    # 含 PREPAINT 内联脚本（首帧前应用持久化外观，防主题闪白）
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   ├── icons.svg                 # 复用的 SVG sprite（图标库，见 §6.5）
│   │   │   └── fonts/                    # 自托管可变字体 woff2（Inter/Manrope/Geist）
│   │   ├── src/
│   │   │   ├── main.js                   # 应用入口：未登录渲染独立登录页，登录后挂载 AppShell
│   │   │   ├── style.css                 # 入口样式：只 @import shared/styles/index.css + 页面容器
│   │   │   ├── app/                      # 应用壳（Shell）
│   │   │   │   ├── shell/app-shell.js    # Sidebar+Inset 布局装配 + 拖拽调宽 + 登出
│   │   │   │   ├── shell/app-shell.css   # 壳网格/变体/拖拽手柄样式
│   │   │   │   ├── shell/theme-settings.js|.css   # 主题设置面板（风格/基色/图表色/圆角/字体/侧栏）
│   │   │   │   ├── shell/preview-icons.js # 主题面板图表色磁贴预览
│   │   │   │   ├── shell/not-found.js    # 路由级 404 视图
│   │   │   │   ├── router/router.js
│   │   │   │   └── i18n/bootstrap.js     # 字典 fetch 加载 + loadLocaleDictionaries（§11）
│   │   │   ├── modules/                  # 每个子目录 = 侧栏一个菜单
│   │   │   │   └── <module-id>/
│   │   │   │       ├── module.json       # 菜单元数据（见 §4.2；子模块也在本文件内声明）
│   │   │   │       ├── index.js          # 模块入口（唯一允许被 shell 动态 import 的文件）
│   │   │   │       ├── components/       # 模块组件
│   │   │   │       ├── services/         # 调用本模块自己的后端路由
│   │   │   │       ├── store/            # 本地状态时管理
│   │   │   │       ├── styles/           # 页面样式，经 ensurePageStyles 注入
│   │   │   │       ├── i18n/{zh-CN,zh-TW,en}.json
│   │   │   │       └── tests/            # 模块级测试
│   │   │   │   # 注：子模块 = module.json 内 submodules[] 声明（如 docs 的四个子页），
│   │   │   │   # 不强制独立目录；仅当子模块体量大时才拆 submodules/<submodule-id>/
│   │   │   └── shared/                   # 唯一允许被跨模块 import 的目录
│   │   │       ├── ui/                   # 设计系统 Web Components（Nova 风格，见 §6）
│   │   │       ├── lib/                  # 纯函数工具库（appearance/dom/i18n/mask/page-styles/…）
│   │   │       ├── styles/               # 四层设计令牌（见 §6.2 与 docs/CSS.md §1）
│   │   │       │   ├── tokens/           # 结构令牌 + 语义色映射层
│   │   │       │   ├── themes/           # palettes（原始变量层）+ style-*（风格令牌集）
│   │   │       │   ├── base/             # reset / motion / no-motion
│   │   │       │   └── index.css         # 唯一 @import 入口
│   │   │       ├── i18n/                 # 全局文案（common/shell 级）
│   │   │       └── core/                 # event-bus / module-registry / store / router / http-client / auth-client / workspace-client
│   │   ├── deno.json
│   │   └── tests/
│   └── server/                           # 后端应用（目录结构与 web 镜像对称）
│       ├── src/
│       │   ├── app.js                    # 平台无关的 Hono App 实例（路由 + 中间件装配）
│       │   ├── modules/                  # 只为**有数据需求**的前端模块建（当前
│       │   │   └── <module-id>/          #   auth/notes/settings；纯展示模块无后端）
│       │   │       ├── routes.js
│       │   │       ├── service.js
│       │   │       ├── repository.js     # 唯一允许写 SQL 的地方，强制参数化 + workspace_id
│       │   │       ├── migrations/0001_init.sql
│       │   │       └── tests/
│       │   ├── shared/
│       │   │   ├── db/                   # adapter.js + sqlite/d1/turso 三实现 + resolve.js
│       │   │   ├── auth/                 # x-auth-password 中间件、会话签发
│       │   │   ├── workspace/            # workspace 中间件、seed 数据
│       │   │   ├── crypto/               # 字段级 AES-GCM 加解密
│       │   │   ├── cache/                # 进程内 LRU/TTL 缓存
│       │   │   ├── logger/
│       │   │   ├── net/                  # serveWithPortHint（端口占用报错含进程信息）
│       │   │   ├── static/               # 静态资源服务（ETag/缓存头）
│       │   │   └── i18n/
│       │   └── platform-adapters/
│       │       ├── local.entry.js        # 本地开发入口（just dev）
│       │       ├── cloudflare.entry.js
│       │       ├── vercel.entry.js
│       │       ├── deno.entry.js
│       │       └── docker.entry.js       # deno compile 的入口
│       ├── deno.json
│       └── tests/
├── packages/
│   ├── lib/                              # vendored 第三方源码（唯二例外）
│   │   ├── hono/            (+ VENDOR.md, LICENSE)
│   │   └── libsql-client/   (+ VENDOR.md, LICENSE)
│   └── contracts/                        # web/server 共享的 JSDoc typedef、常量、枚举（无逻辑）
├── docs/
│   ├── decisions/                        # ADR：0001-xxx.md
│   ├── bug/                              # 事故复盘：YYYY-MM-DD-slug.md
│   ├── deploy/                           # 部署 runbook
│   ├── perf/                             # 性能调查记录
│   └── Layout.md / Design.md / Commit.md / Database.md / CSS.md / i18n.md /
│       Components.md / Auth.md / Workspace.md / Testing.md / Logging.md /
│       Deployment.md / Vendoring.md      # 见 §19，脚手架阶段逐步补全
├── scripts/                              # 零依赖治理脚本（Deno 脚本，见 §16）
├── .githooks/commit-msg                  # 提交信息校验（git config core.hooksPath .githooks）
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml                        # workflow_dispatch 手动选择目标，或按分支自动
├── justfile
├── deno.json                             # 根 workspace 配置（Deno workspace + imports 映射）
├── ARCHITECTURE.md
├── AGENTS.md
└── README.md
```

---

## 4. 模块系统与解耦规则

### 4.1 模块 = 侧栏菜单，子模块 = 子菜单

一个"模块"是 `apps/web/src/modules/<id>/` 与 `apps/server/src/modules/<id>/`
的组合，二者通过约定的 REST 前缀 `/api/<id>/...`
对应，**没有任何共享代码**（只共享 `shared/*`）。

### 4.2 模块清单（module.json）驱动侧栏

```jsonc
// apps/web/src/modules/notes/module.json
{
  "id": "notes",
  "order": 20,
  "icon": "notebook-pen",
  "labelKey": "notes.menu.title",
  "route": "/notes",
  "submodules": [
    { "id": "all", "labelKey": "notes.menu.all", "route": "/notes/all" },
    { "id": "tags", "labelKey": "notes.menu.tags", "route": "/notes/tags" }
  ]
}
```

应用启动时，`app/shell` 扫描所有 `modules/*/module.json`（构建期通过
`import.meta.glob` 等价的手写扫描脚本生成一份 `modules/registry.generated.js`
清单，避免运行时目录遍历），据此渲染 `<ds-sidebar-menu>`；点击菜单项触发
`router` 做 `import(`./modules/${id}/index.js`)`
懒加载。**新增模块只需新增该目录 + 清单文件，不需要改动 shell 任何一行代码。**

### 4.3 禁止跨模块 import 的执行方式

- **模块 → `shared/*`**：允许。
- **模块 A → 模块 B**：**禁止**，包括 B 的 `index.js` 公开入口。
- 跨模块协作的两条合法通道：
  1. **事件总线**（`shared/core/event-bus.js`，基于 `EventTarget` 的
     `emit(type, detail)` / `on(type, handler)`）——用于"通知类"协作（如
     workspace 切换、主题切换）。
  2. **能力注册表**（`shared/core/module-registry.js`，`registerCapability(id, api)`
     / `getCapability(id)`）——用于"调用类"协作，模块在自己的 `index.js`
     里主动注册一个**冻结对象**作为公开能力，其他模块运行时按 id
     查表调用，而不是编译期静态 import，天然支持懒加载 +
     可选依赖（对方模块未加载时 `getCapability` 返回
     `undefined`，调用方必须容错）。
- **强制手段**：`scripts/check-module-boundaries.js`（Deno 脚本，正则 +
  相对路径解析，零依赖）扫描所有 `modules/*/**/*.js` 的 `import` 语句，任何形如
  `import ... from "../../<other-module-id>/..."` 的路径直接判定 CI
  失败。此脚本同时覆盖前后端两侧。

### 4.4 组件/函数库/样式复用纪律

- 新写一个 UI 组件前，先检索 `shared/ui/`（`docs/Components.md`
  维护组件目录索引）；确认没有可复用项才新建。
- `shared/lib/` 只放**纯函数**（无副作用、无 DOM
  依赖），便于零依赖单元测试与跨前后端复用（`packages/contracts`
  里的纯逻辑也可下沉到这里）。
- 开发模式下提供 `/__dev/components` 路由（生产构建剔除），渲染 `shared/ui`
  所有组件的可交互画廊，替代 Storybook（零依赖约束下自建的最小方案）。

---

## 5. 前端架构：布局 / 路由 / Sidebar

### 5.1 布局约定

整体 `sidebar-with-header`：CSS Grid「侧栏列 + inset 列」两列
（`grid-template-areas: 'sidebar inset'`，逐像素规则见 `docs/Layout.md §1`），
inset 列内纵向排列固定 Header 与 `<main>`，`<main>`
是唯一可滚动区域（`overflow-y: auto`；`html body` 及 Header/Sidebar 均
`overflow: hidden`）。**新增模块的所有 UI 只能出现在 `<main>` 内**，不得往
Header/Sidebar 塞入模块私有内容（Sidebar 的菜单项本身由 module.json
驱动，属于框架层，不算"模块 UI"）。

响应式断点（值表与 JS 常量见 `docs/Layout.md §2`）：`< md` 时 Sidebar 收起为
Sheet 抽屉（覆盖式，非挤压布局）；`>= md` 时可在 `expanded / icon-collapsed`
两态之间切换。信息卡片布局遵循「减少留白」原则：用
`grid-template-columns: repeat(auto-fit, minmax(var(--card-min-w), 1fr))`
让卡片自适应填满行宽，卡片内边距使用较小的间距令牌 +
更大字号/图标去承载视觉密度，而不是靠留白撑版面。

### 5.2 Sidebar 组件规格（对齐 shadcn `base-nova` 风格）

参考 shadcn `ui.shadcn.com/docs/components/base/sidebar`（`base-nova`
样式）的组合树与状态模型，用原生 Web Components 等价实现，并把 shadcn 示例中的
**Team Switcher 重构为 Workspace Switcher**（见 §7）：

```
<ds-sidebar-provider class="app-shell">        ← 即顶层网格容器
├── <ds-sidebar collapsible="icon" side="left" variant="sidebar">
│   ├── <ds-sidebar-header>          ← <ds-workspace-switcher>（原 TeamSwitcher）
│   ├── <ds-sidebar-content>         ← 可滚动；内含 <ds-sidebar-group>
│   │   └── <ds-sidebar-group>
│   │       ├── <ds-sidebar-group-label>（主菜单）
│   │       └── <ds-sidebar-menu>
│   │           └── <ds-sidebar-menu-item>
│   │               ├── <ds-sidebar-menu-button>      ← 对应模块/子模块
│   │               └── <ds-sidebar-menu-sub>          ← 子模块列表（module.json 声明）
│   ├── <ds-sidebar-footer>          ← <ds-nav-user>（见 §7.6）
│   └── <ds-sidebar-rail>
├── .app-shell__resize                ← 右缘 12px 拖拽手柄（app-shell 层，非 ds 组件）
└── .app-shell__inset                 ← 对应 shadcn SidebarInset，本项目用 light-DOM 容器
    ├── <header>                     ← trigger + 应用名 + 语言/主题/主题设置 + 登出
    └── <main>                       ← 唯一滚动区域
```

**状态模型**（等价于 shadcn `useSidebar`）：由 `<ds-sidebar-provider>` 持有
`{ state: 'expanded'|'collapsed', open, openMobile, isMobile }`，通过
`shared/core/store.js` 的 `createStore` 暴露；子组件通过
`closest('ds-sidebar-provider')` 拿到 store 引用订阅，不用框架
Context。移动端（`isMobile`）时 Sidebar 渲染为 `<ds-sheet side="left">` 覆盖层。

**尺寸与宽度**（`shared/styles/tokens/sidebar.css` 只放尺寸，颜色在调色板层）：

```css
:root {
  --sidebar-width: 16rem; /* 展开态 256px，可拖拽 160–480px（SIDEBAR_WIDTH_LIMITS） */
  --sidebar-width-icon: 3rem; /* 图标条 */
  --sidebar-width-mobile: 18rem;
}
```

拖拽链路（`bindResizeHandle`，app-shell 层）：rAF 节流**同帧双写**
`--sidebar-current-width`（网格列）与 `--sidebar-width`（面板令牌）、宽度数值
气泡、松手 `setSidebarWidth()` 持久化；宽度 `< min + 24px`
自动吸附折叠。完整契约见 `docs/Layout.md §1.1`。

**侧栏颜色**（禁止组件内写死）：`--sidebar/--sidebar-foreground/--sidebar-border/
--sidebar-primary/--sidebar-accent/--sidebar-ring`
等原始变量由 `themes/palettes-base.css` 的 `base-*`
类提供（随基色/暗色整体切换），组件消费 语义层或 `--ds-sidebar-*`。**旧版 HSL
三元组（`240 5.3% 26.1%` 形式）已废弃， 不要按 shadcn 老文档抄**。

**状态驱动样式**：完全照搬 shadcn 的思路——用 `data-*` 属性 + 纯 CSS
选择器表达视觉状态（`[data-collapsible="icon"]` 控制图标条、`data-variant` 控制
sidebar/floating/inset 三形态、`data-state` 表达展开收起），**不需要任何
className 计算逻辑**，这与"零框架"高度契合。

**交互细节**（从 shadcn 文档移植的具体行为，非臆造）：

- 键盘快捷键 `Ctrl/Cmd+B` 切换展开/收起。
- `SidebarMenuButton` 收起为图标态时显示 `tooltip`；支持 `isActive`
  高亮当前路由（精确匹配 + 子路径）。
- 折叠子分组用 `<ds-collapsible>` 包裹 `<ds-sidebar-menu-sub>`，箭头图标依
  `data-state=open` 切换（全站无动效下瞬时）。
- `SidebarRail` 提供一条可点击的细边栏用于切换（移动端隐藏）。
- 变体 `floating/inset` 由 appearance 引擎写 `<html data-sidebar-variant>`，
  壳层 CSS 据此给侧栏/内容区加卡片化样式；`collapsible=offcanvas` 时收起完全
  隐藏侧栏。

组件级 API 细节、逐个属性表、无障碍（ARIA `role="navigation"`/`aria-current`）在
`docs/Components.md#sidebar` 中展开，本节只落地骨架与令牌。

---

## 6. 设计系统（Nova / Zinc）

### 6.1 命名说明

"Nova" 是本项目对 shadcn 组件视觉语言的**自有实现代号**——shadcn 官方在其 Base UI
组件源（如 Sidebar 文档的 `styleName="base-nova"`）中确实存在名为 _nova_
的样式变体；本项目据此还原其间距节奏、圆角、阴影与排版比例，但不依赖
shadcn/Radix/Base UI/Tailwind 本身（那些是 React 生态产物），改用等价的原生
CSS + Web Components 实现，中性色采用 Tailwind/shadcn 通用的 **Zinc** 色阶。

### 6.2 设计令牌：四层体系（`shared/styles/tokens/` + `themes/`）

完整描述见 `docs/CSS.md`（唯一权威），此处是总览。**颜色不走单一 Zinc 色阶，
而是 shadcn 同构的调色板体系**：

| 层         | 位置                                                                  | 内容                                                                                                                                                                             | 消费者                        |
| ---------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 原始变量层 | `themes/palettes-{base,chart,swatches}.css`                           | `base-*` 类 ×7 基色（zinc/red/orange/green/blue/violet/rose）× light/dark 的 shadcn 同名变量（`--background/--primary/--sidebar-*`…，oklch）；`chart-*` 类 ×12 的 `--chart-1..5` | 仅语义层引用                  |
| 语义映射层 | `tokens/colors.css`                                                   | `--color-bg/--color-fg/--color-primary/--color-border/--color-danger/…` = `var(--原始变量, oklch 兜底)`；`.dark:not([class*='base-'])` 无类兑底                                  | 组件/页面唯一直引用的颜色出口 |
| 风格令牌层 | `themes/style-*.css`                                                  | `--ds-<component>-<property>`：nova 全集基准 + 7 个 delta 风格（大圆角/填充输入等差异化）                                                                                        | 组件 CSS `var(--ds-*, 默认)`  |
| 结构令牌层 | `tokens/{spacing,radius,shadow,typography,zindex,motion,sidebar}.css` | `--space-*`（刻度跳号：无 7/9/11）、`--radius` 基准 + sm..4xl calc 档位、`--shadow-xs..2xl`、`--text-2xs..3xl`、`--z-*`、`--sidebar-{width,width-icon,width-mobile}` 尺寸三件套  | 全体                          |

外观引擎（`shared/lib/appearance.js`）在 `<html>` 上维护
`style-* / base-* / chart-* / menu-*` 类与 `data-sidebar-*` 属性并写
`--radius/--font-*` 内联变量；`index.html` 的 PREPAINT
内联脚本在首帧前做同一件事（防主题闪白）。

### 6.3 暗黑模式与外观切换

**暗色机制**：`<html>` 上的 `.dark` 类（appearance 引擎同时双写
`data-theme="dark|light"` 与 `style.colorScheme`
兼容旧规则与表单控件原生渲染）。 亮暗只翻转调色板变量，语义层/组件层零改动。

`<ds-theme-switch>`：`role="radiogroup"`，三个 `role="radio"`
选项拼接为一个胶囊（`border-radius: var(--radius-full)`，选中态滑块用
`transform` 位移；全站无动效（`docs/CSS.md §9`）下瞬时切换）。`system` 时监听
`matchMedia('(prefers-color-scheme: dark)')`；选择结果持久化到
`localStorage`（键名
`pref:theme`，客户端偏好，不进数据库——数据库只存**跨设备**该同步的东西，见
§9.3）。

**主题设置面板**（`app/shell/theme-settings`）：风格（8 个 `style-*`）/ 基色（7
个 `base-*`）/ 图表色（12 个 `chart-*`）/ 圆角（写 `--radius`）/
正文字体与标题字体（写 `--font-*-base`）/ 菜单外观 /
侧栏变体与折叠模式。全部偏好即改即存 （`pref:*` 键，见
`packages/contracts/constants.js`）。

### 6.4 组件目录（`shared/ui/`，全部已实现）

Button · IconButton · Input · Textarea · Select · Checkbox · Switch ·
SegmentedControl(胶囊 RadioGroup，主题切换/会话时长复用) · Dialog ·
ConfirmDialog · Sheet(移动端抽屉) · Toast · DropdownMenu · Card · Badge · Avatar
· Tooltip · Skeleton · EmptyState · Breadcrumb ·
**MaskedField**(眼睛图标掩码切换) · ThemeSwitch · LangSwitch ·
PagePlaceholder(页面占位/空态) · Sidebar 系列(§5.2) · **WorkspaceSwitcher** ·
**WorkspaceBadge**(当前工作空间只读徽标，当前壳未接线，保留组件) ·
**NavUser**。逐组件 Props/事件/无障碍表在
`docs/Components.md`；**Tabs/Table/Pagination 尚未实现**， 需要时按同一
authoring 约定新增（Pagination 对接 `Database.md §4.1` keyset 约定）。

### 6.5 图标

使用**单一 SVG sprite**（`public/icons.svg`，手工挑选/裁剪的一组线性图标，MIT 或
CC0 来源，随文件保留出处），组件通过 `<svg><use href="/icons.svg#name"/></svg>`
引用，零依赖、零运行时图标库体积。

---

## 7. 工作空间（Workspace）与数据隔离

### 7.1 概念

`vanilla-js-template` 面向**单一使用者的多情境隔离**（不是多租户 SaaS
的"团队协作"）：同一把 `x-auth-password`
密钥下，用户在不同"工作空间"里各自维护互不干扰的数据集。这是把 shadcn 示例里的
**Team Switcher** 语义收窄为 **Workspace Switcher**。

### 7.2 种子数据

首次初始化（迁移脚本
`apps/server/src/shared/workspace/migrations/0001_seed.sql`）写入 6
个系统工作空间：

| id                 | 显示名（i18n key）                     | 图标             | order |
| ------------------ | -------------------------------------- | ---------------- | ----- |
| `ws_default`       | `workspace.seed.default`（默认）       | `home`           | 0     |
| `ws_work`          | `workspace.seed.work`（工作）          | `briefcase`      | 1     |
| `ws_study`         | `workspace.seed.study`（学习）         | `graduation-cap` | 2     |
| `ws_life`          | `workspace.seed.life`（生活）          | `heart`          | 3     |
| `ws_entertainment` | `workspace.seed.entertainment`（娱乐） | `gamepad-2`      | 4     |
| `ws_travel`        | `workspace.seed.travel`（旅游）        | `plane`          | 5     |

系统工作空间
`is_system=1`：可重命名/换图标/调序，**不可删除**；用户可自由新增/删除自定义工作空间（`is_system=0`）。

### 7.3 数据库落地（详见 §9.3）

- 新增核心表 `core_workspaces`（前缀 `core_` 表示"跨模块基础设施表"，区别于
  `[module]_xxx` 的业务表，属于对原命名规范的显式扩展，见 §9.1）。
- **所有 `[module]_xxx` 业务表新增
  `workspace_id TEXT NOT NULL REFERENCES core_workspaces(id)`
  列**，并建立复合索引 `(workspace_id, <该表主要查询列>)`。
- Repository 层禁止裸写 `db.query(sql, params)`；必须通过
  `createScopedRepository(db, table).forWorkspace(workspaceId)`
  包装器，工作空间过滤条件由封装器统一拼接参数化谓词，业务代码**无法遗漏**
  `workspace_id` 过滤（`scripts/check-workspace-scope.js` 对
  `modules/**/repository.js` 做启发式扫描兜底）。

### 7.4 前后端上下文传递

- 客户端当前选中的 workspace 存 `localStorage`（键 `pref:workspace`），每次 API
  请求附加请求头 `x-workspace-id`（与 `x-auth-password`
  同级的"每请求上下文头"）。
- 后端 `shared/workspace/context-middleware.js`：读取 `x-workspace-id` →
  校验存在性（命中进程内缓存的 workspace 列表，见 §12.1）→
  `c.set('workspaceId', id)`；缺失或非法时**默认回退到
  `ws_default`**（保证健壮性，不因前端一时的状态丢失而 500）。
- 同时把"最近一次使用的工作空间"冗余写入 `app_settings` 的 `settings:workspace`
  键，作为新设备/新会话下的初始默认值（客户端 header 优先，`app_settings`
  仅做兜底）。
- **切换约定**：切换工作空间 = 触发事件总线 `workspace:changed` → Shell
  对当前挂载模块执行 `unmount()` 再
  `mount()`（不要求模块自身实现"响应式重新拉取"）。**规则：模块只允许在
  `mount()` 时读取一次当前 workspace 上下文，不得跨生命周期缓存。**

### 7.5 Workspace Switcher UI

沿用 shadcn `TeamSwitcher` 交互并按本项目语义落地：Sidebar Header
内一个下拉，触发器展示当前工作空间图标 + 名称；下拉内容：顶部「工作空间」
小字标签 → 工作空间列表（每项 6×6 图标磁贴 + 名称，**当前项右端 `circle-check`
对勾**，对齐参考 teamItems 结构；`Ctrl+1..6` 快捷键保留为数据 属性
`data-shortcut`，可见提示文字不展示）→ 分隔线 → `+ 新建工作空间`（磁贴
样式一致）。快捷键监听在组件内全局注册。

### 7.6 用户头像弹出菜单（`<ds-nav-user>`，Sidebar Footer）

**菜单头**（对齐参考 DropdownMenuLabel）：首字母头像方块（`bg-sidebar-primary`）

- 用户名 + 次行邮箱（从 `/api/settings/account` 拉取，按 §9.4 **掩码显示**；
  未配置时显示「未绑定邮箱」三语占位）+ 分隔线。

菜单项（按你给定顺序）：

1. **设置**（Settings）→ `/settings`：主题、语言、会话时长等应用级配置。
2. **配置文件**（Profile）→ `/settings/profile`：昵称、头像等展示性资料。
3. **用户资料**（用户信息）→ `/settings/account`：邮箱、手机号等敏感联系方式（走
   §9.4 掩码 + 加密）。
4. **退出登录**（清除本地 token + 调用 `/api/auth/logout` 使会话失效；Header
   右端也有一枚同动线的登出图标按钮）。

---

## 8. 后端架构（Hono）

- `apps/server/src/app.js` 导出一个**平台无关**的 `Hono`
  实例：注册全局中间件顺序为
  `securityHeaders → cors(按需) → authMiddleware(x-auth-password) → workspaceMiddleware(x-workspace-id) → i18nMiddleware(Accept-Language 兜底) → 路由`。
- 各模块 `routes.js` 以 `app.route('/api/<module-id>', moduleRouter)`
  挂载，模块路由内部只能调用**本模块自己的** `service.js`/`repository.js`，禁止
  import 其他模块的 repository（同 §4.3 的静态扫描规则覆盖后端）。
- 平台适配器（`platform-adapters/*.entry.js`）只做"把 `app.fetch`
  接到该平台的入口协议上 + 注入该平台的 env/bindings +
  选择数据库适配器"，**不包含业务逻辑**：
  - `cloudflare.entry.js`：Workers `export default { fetch: app.fetch }`，注入
    `env.DB`（D1 binding）。
  - `vercel.entry.js`：Vercel Edge Function 标准 fetch 处理器。
  - `deno.entry.js`：`Deno.serve(app.fetch)`。
  - `docker.entry.js`：同样是 `Deno.serve(app.fetch)`，用于 `deno compile`
    产出的独立二进制（见 §15.4）。
- 统一响应包络：成功 `{ ok: true, data, meta? }`；失败
  `{ ok: false, error: { code, message } }`，错误 code 用
  `SCREAMING_SNAKE_CASE`（如 `AUTH_INVALID_PASSWORD`、`WORKSPACE_NOT_FOUND`）。

---

## 9. 数据库架构

### 9.1 命名规范（扩展版）

| 前缀/表                        | 含义                                                       | 示例                                                           |
| ------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------- |
| `app_settings`（单表，键值对） | 全局配置/账号密钥等"设置类"数据                            | key: `settings:profile`、`settings:display`、`accounts:webdav` |
| `core_*`                       | **跨模块基础设施表**（本次新增的扩展约定，非业务模块所有） | `core_workspaces`、`core_sessions`(会话吊销表，见 §10)         |
| `[module]_xxx`                 | 业务模块表，**必须**带 `workspace_id`                      | `notes_tags`、`notes_data`、`chat_conversations`               |

`app_settings`
表结构：`key TEXT PRIMARY KEY, value TEXT(JSON), is_encrypted INTEGER DEFAULT 0, updated_at TEXT`。

### 9.2 三数据库适配器 + 环境自动选择

```js
// shared/db/adapter.js —— 契约（JSDoc，无 TS 编译）
/**
 * @typedef {Object} DbAdapter
 * @property {(sql:string, params?:any[]) => Promise<any[]>} query
 * @property {(sql:string, params?:any[]) => Promise<{changes:number,lastInsertRowid?:number|bigint}>} execute
 * @property {(fn:(tx:DbAdapter)=>Promise<void>) => Promise<void>} transaction
 */
```

选择矩阵（`shared/db/resolve.js`，读取显式 `DEPLOY_TARGET`
环境变量，**不做运行时探测猜测**，由各 `platform-adapters/*.entry.js`
在启动时写死传入，避免"猜错运行时"的隐性 bug）：

| `DEPLOY_TARGET`                | 默认数据库                                                    | 可覆盖为                                                                             |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `local`（本地开发）            | SQLite（Deno 内置 SQLite 能力，文件位于 `.data/dev.sqlite3`） | —                                                                                    |
| `cloudflare`                   | D1（`env.DB` binding）                                        | 设置 `FORCE_TURSO=1` + `TURSO_URL/TURSO_AUTH_TOKEN` 后改用 Turso                     |
| `vercel` / `deno`(Deno Deploy) | Turso                                                         | —                                                                                    |
| `docker`(VPS)                  | Turso（保持与其余非 Cloudflare 平台一致）                     | 设置 `LOCAL_SQLITE_PATH` 后改用本机磁盘 SQLite（VPS 有持久盘，属于合理例外，见 §20） |

### 9.3 workspace 隔离表结构示例

```sql
-- core_workspaces
CREATE TABLE core_workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,              -- 以 "i18n:" 前缀表示引用 i18n key，否则为用户输入的字面量
  icon TEXT NOT NULL DEFAULT 'folder',
  color_token TEXT NOT NULL DEFAULT 'zinc',   -- 引用语义色令牌名，不存 hex
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 业务表示例：notes_data
CREATE TABLE notes_data (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES core_workspaces(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_notes_data_workspace ON notes_data(workspace_id, updated_at DESC);
```

### 9.4 敏感字段与掩码

敏感字段清单：邮箱、姓名、性别、年龄、地址、电话、用户名、密码、大模型 API
Key、Token、数据库账户/密码。

- **加密**：`shared/crypto/field-crypto.js`，`crypto.subtle`
  AES-GCM，密钥来自平台机密 `APP_ENCRYPTION_KEY`（各平台的 secret 管理，见
  §15），Repository 层写入前 `encryptField`，读出后
  `decryptField`，业务代码不感知加密细节。
- **参数化**：所有 SQL 一律 `?` 占位符 + 参数数组，`scripts/check-sql-concat.js`
  正则拦截模板字符串拼接 SQL 的模式。
- **前端掩码**：`<masked-field value="..." mask-type="email|phone|generic">`，默认掩码显示，眼睛图标切换明文，切换状态不持久化（每次刷新默认掩码）。

---

## 10. 鉴权系统（x-auth-password）

### 10.1 流程

1. `POST /api/auth/login { password }`：后端用
   PBKDF2（`crypto.subtle.deriveBits`，零依赖）派生哈希，与
   `app_settings['settings:auth']`
   中存储的哈希做**常数时间比较**；失败计数存入进程内缓存，超过阈值指数退避锁定（见
   §12.1、§18）。
2. 成功后签发 **HMAC 签名的会话令牌**（payload 含 `exp`/`iat`），返回给客户端。
3. **约定**：`x-auth-password`
   请求头在首次登录请求中携带明文密码；**登录成功后的所有后续请求，同一个请求头名
   `x-auth-password`
   改为携带签发出的会话令牌**，不再重复传输明文密码——这是对你给定的表头命名的忠实沿用，同时避免明文密码在每次请求中往返（此点在
   §20 中列出供确认，如你希望严格区分，可改为登录后统一使用新头名
   `x-auth-token`）。
4. 后端中间件对除 `/api/auth/login` 外的所有路由校验该令牌的签名与有效期。

### 10.2 会话时长选择 UI

2×4 网格 + 底部大按钮：

```
[ 4 小时 ] [ 8 小时 ] [ 12 小时 ] [ 24 小时 ]
[ 7 天   ] [ 14 天  ] [ 30 天   ] [ 90 天   ]
[        保持登录直到下次浏览器打开        ]
```

- 8 个固定时长选项 → 令牌 `exp` = 签发时刻 + 对应时长，存
  `localStorage`（跨浏览器重启存活）。
- 底部大按钮 → 令牌**不设固定 `exp`**（或设一个很长的上限如 30
  天作为兜底），但存储位置改为
  `sessionStorage`（浏览器关闭即清除），语义上对应"下次浏览器打开"需要重新登录。

---

## 11. 国际化（i18n）

- 支持简体中文（`zh-CN`，默认）、繁体中文（`zh-TW`）、英文（`en`）。
- 字典一律 `fetch` + `JSON.parse` 加载（**禁止动态 `import()` JSON**—— import
  attributes 在旧浏览器被整体拒绝，曾致整屏裸 key，见
  `docs/bug/2026-08-28-i18n-import-attributes.md`）。
- `app/i18n/bootstrap.js` 启动即加载 shared + **全部模块**的当前语言字典；
  运行时切语言（lang-switch）由壳层先 `await loadLocaleDictionaries(目标语言)`
  再重建壳并重挂当前路由（`docs/i18n.md §1`）。
- 每模块自带 `i18n/{locale}.json`；`shared/i18n/` 存放 Shell 级通用文案
  （按钮、通用错误提示等），key 三语一致性由 `scripts/check-i18n-keys.js` 强制。
- `t(key, params)`：极简实现，`{name}` 占位符插值，找不到 key 时回退顺序
  `当前语言 → zh-CN → 原样返回 key`（并在开发模式下用日志系统标红提示缺失翻译，见
  §14）。
- Locale 存储：客户端 `localStorage`（`pref:locale`），跨设备同步则写入
  `app_settings['settings:display']` 的 `locale` 字段。
- `core_workspaces.name` 的 `i18n:` 前缀约定见 §9.3，是本次新增的"数据库字段引用
  i18n key"范式，写入 `docs/i18n.md`
  时需要单独说明这个跨界约定（数据一般不建议存 i18n
  key，这里是刻意为系统种子数据做的例外，用户自建工作空间一律存字面量）。

---

## 12. 缓存与性能

### 12.1 进程内缓存

`shared/cache/memory-cache.js`：极简 TTL + LRU（Map +
双向链表或简化的定时清理），用于缓存**每请求必读的热数据**：

- `core_workspaces` 全量列表（变更少、读取频繁，workspace 中间件每请求都要校验
  `x-workspace-id` 合法性）。
- 当前登录失败计数（用于限流锁定）。
- `app_settings` 中的显示配置类键。

> 说明边缘运行时的限制：Cloudflare Workers / Vercel Edge 的每个 isolate
> 生命周期不保证跨请求复用，进程内缓存是"尽力而为"的优化而非强一致缓存，真正的一致性来自数据库本身（D1
> 的低延迟读 / Turso 的边缘副本），本节缓存策略要在 `docs/perf/`
> 中记录各平台的实测命中率差异。

### 12.2 查询优化

- 所有 `[module]_xxx` 表的外键列与常用查询列建索引（尤其 `workspace_id`
  复合索引，见 §9.3）。
- 分页一律 **keyset
  分页**（`WHERE (updated_at, id) < (?, ?) ORDER BY updated_at DESC, id DESC LIMIT ?`），禁止
  `OFFSET` 大偏移分页。
- 批量按 ID 查询用参数化的
  `WHERE id IN (?,?,...)`（占位符数量与参数数组长度动态生成，仍然是参数化，不是拼接值）。

### 12.3 前端体积

- 模块级代码分割（`import()`），只加载当前激活模块 + 已展开子模块。
- 静态资源走平台 CDN 边缘缓存 + `ETag`；`deno.json`
  任务里在部署前对静态资源生成内容哈希文件名（cache busting）。

---

## 13. 测试策略

测试金字塔，全部基于 **Deno 内置 `Deno.test`**（零依赖）：

| 层级        | 覆盖对象                                                                                                                                                                                 | 工具                                                                                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 单元测试    | `shared/lib` 纯函数、`repository.js`（对内存/临时文件 SQLite）                                                                                                                           | `Deno.test` + 内置 `assert`                                                                                                                                                                                                    |
| 集成测试    | `service.js` + 真实 SQLite adapter，覆盖 workspace 隔离是否生效（关键回归点：跨 workspace 查询必须为空）                                                                                 | `Deno.test`                                                                                                                                                                                                                    |
| 组件测试    | Web Components 的逻辑部分（属性→状态映射、事件派发），通过 `happy-dom` 替代方案——**不引入第三方 DOM 模拟库**，改为把组件的"纯逻辑"（状态机、格式化）与"渲染"拆开测试，渲染部分留给下一层 | `Deno.test`                                                                                                                                                                                                                    |
| UI 冒烟/E2E | 真实浏览器中的关键路径（登录、切换工作空间、暗黑模式切换）                                                                                                                               | **自研极简 CDP 驱动**（`scripts/testing/cdp-client.js`，基于 Deno/浏览器均原生支持的 `WebSocket` 全局对象，手写 ~150 行直连 Chrome DevTools Protocol，不依赖 Playwright/Puppeteer），CI 用 GitHub Actions runner 预装的 Chrome |

`docs/Testing.md` 记录目录约定（`tests/` 镜像 `src/`
结构）、覆盖率阈值、如何本地跑 `just test`。

---

## 14. 日志系统

`shared/logger/logger.js`（同构：浏览器用 `%c` CSS 上色，Node/Deno/Workers 用
ANSI，检测不支持颜色的边缘运行时时自动降级为无色但保留结构化前缀）。

**输出格式**：

```
[2026-08-27T10:22:31.512Z] [ERROR] [vanilla-js-template] [module:notes] [component:NoteEditor]
  [apps/web/src/modules/notes/components/note-editor.js:142] (NoteEditor#save)
  Failed to persist note: NetworkError: fetch failed
  <stack trace>
```

- 六级：`trace`(灰) `debug`(青) `info`(绿) `warn`(黄底) `error`(红)
  `fatal`(红底加粗白字)。
- 每条日志自动携带：项目名 → 模块 id → 组件/文件名 → 文件路径:行号 →
  函数/方法名——**文件:行号通过解析 `new Error().stack`
  自动提取**，调用方不需要手写。
- 后端日志额外携带
  `requestId`（每请求生成，贯穿该请求内所有下游调用，便于跨模块问题定位）。
- `docs/Logging.md` 给出颜色对照表、如何在生产环境降噪（默认生产只输出 `warn`
  以上）。

---

## 15. 多平台部署与适配器

### 15.1 统一适配器模式

`apps/server/src/app.js` 是唯一的业务逻辑入口；4 个
`platform-adapters/*.entry.js` 只做协议桥接 + 环境变量注入（见
§8）。前端产物（静态文件）对 4
个目标是**同一份构建输出**，差异只在"怎么把静态文件 serve 出去 + API 怎么路由"。

### 15.2 环境变量矩阵

| 变量                             | 说明                                      | 适用范围                                                |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `DEPLOY_TARGET`                  | `local\|cloudflare\|vercel\|deno\|docker` | 全部                                                    |
| `APP_ENCRYPTION_KEY`             | 字段加密密钥                              | 全部                                                    |
| `TURSO_URL` / `TURSO_AUTH_TOKEN` | Turso 连接信息                            | vercel/deno/docker，及 cloudflare 的 `FORCE_TURSO` 场景 |
| `FORCE_TURSO`                    | Cloudflare 上强制改用 Turso               | cloudflare                                              |
| `LOCAL_SQLITE_PATH`              | VPS 上改用本机磁盘 SQLite                 | docker                                                  |

### 15.3 `justfile` 规划（脚手架阶段落地，此处先定接口）

`dev` · `fmt` · `lint` · `test` · `db-migrate` · `db-seed` ·
`vendor-update <name>` · `build` · `deploy-cloudflare` · `deploy-vercel` ·
`deploy-deno` · `deploy-docker` · `docker-build`。全部基于
`deno task`/`deno run` 组合，不出现 `npm`/`node` 字样（除非部署 CLI 需要临时
`npm:` specifier，见 §2.4）。

### 15.4 Docker/VPS 目标

**架构师延伸决策**（你的指示只明确提到 cloudflare/vercel/deno 三者用
Deno，未提及 docker——为保持全项目工具链一致，建议 Docker/VPS 目标同样运行 Deno
运行时，而不是引入 Node）：`docker.entry.js` 经
`deno compile --output dist/server` 产出**单一静态可执行文件**，Dockerfile
基于极小基础镜像（`distroless` 或 `scratch` + 必要 CA 证书）直接 `COPY`
该二进制运行，不在镜像内安装任何包管理器，是本项目"零依赖"哲学在部署形态上的最终体现。此项列入
§20 供你确认。

### 15.5 GitHub Actions

- `ci.yml`：PR 触发，`deno fmt --check` + `deno lint` + `just test` +
  自定义治理脚本（§16）。
- `deploy.yml`：`workflow_dispatch`
  手动指定目标（`cloudflare|vercel|deno|docker`）触发对应
  `just deploy-*`；也可配置按分支/tag 自动触发，具体策略脚手架阶段与你确认。

---

## 16. 代码质量门禁（零依赖静态检查）

不引入 ESLint/stylelint 等依赖，改为 `scripts/` 下的一组**纯 Deno 脚本**（正则 +
简单路径分析，非完整 AST，够用即可），CI 中串联执行：

| 脚本                         | 拦截什么                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `check-module-boundaries.js` | 跨模块 `import`（§4.3）                                                                                             |
| `check-file-length.js`       | 单文件 > 500 行                                                                                                     |
| `check-hardcoded-tokens.js`  | 裸颜色 / 圆角 / 间距字面量（§6.2）                                                                                  |
| `check-window-dialogs.js`    | `alert(`/`confirm(`/`prompt(`                                                                                       |
| `check-sql-concat.js`        | 模板字符串拼接 SQL                                                                                                  |
| `check-workspace-scope.js`   | `repository.js` 内的 SQL 语句缺少 `workspace_id` 谓词（启发式，非 100% 准确，兜底手段，核心保障仍是 §7.3 的封装器） |
| `check-i18n-keys.js`         | 三语字典文件齐全、key 集合一致、禁止空翻译（§11）                                                                   |

配套 `deno lint` 自定义插件机制承载其中可以用 lint
插件表达的规则（具体以脚手架阶段的 Deno 版本能力为准，见 §2.1 待定项）。

---

## 17. Git 提交规范摘要

完整规范见 `docs/Commit.md`，此处摘要：

- 遵循
  [Conventional Commits](https://www.conventionalcommits.org/)：`<type>(<scope>): <subject>`，`type`
  ∈ `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`，`scope` =
  模块 id 或 `shell`/`shared`/`infra`。
- **正文强制逐文件说明改动，落到方法/组件级别**：

```
feat(notes): 支持按工作空间过滤笔记列表

- apps/server/src/modules/notes/repository.js: listByWorkspace() 新增 workspace_id 参数化过滤
- apps/server/src/modules/notes/routes.js: GET /api/notes 读取 c.get('workspaceId') 传入 service
- apps/web/src/modules/notes/services/notes-api.js: fetchNotes() 附加 x-workspace-id 请求头
- apps/web/src/modules/notes/components/note-list.js: 监听 workspace:changed 事件触发重新拉取

Closes #42
```

- `.githooks/commit-msg`（Deno 脚本）校验格式 + "至少一条以 `- 路径:`
  开头的正文行"，`git config core.hooksPath .githooks` 启用，零依赖（不用
  husky）。

---

## 18. 安全基线

- 安全响应头：走 Hono 内置 `secureHeaders` 中间件（属于 vendored Hono
  的一部分，非新增依赖）：CSP
  `default-src 'self'`、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、HTTPS
  平台上的 `Strict-Transport-Security`。
- 登录接口限流：失败次数进程内缓存计数，指数退避锁定（如 5 次失败后
  30s，之后每次翻倍，封顶 30 分钟），锁定状态本身也应可被 `app_settings`
  持久化以避免边缘环境重启后计数丢失（成本 vs 一致性的取舍记入
  `docs/decisions/`）。
- 常数时间比较：本地/Docker 用 Node 兼容的 `timingSafeEqual`
  等价实现；边缘运行时（无该 API）用手写常数时间字节比较函数，统一封装在
  `shared/crypto/constant-time-compare.js`，业务代码不关心平台差异。
- 秘钥管理：`APP_ENCRYPTION_KEY`、`TURSO_AUTH_TOKEN` 等一律通过各平台 Secret
  机制注入（Wrangler secrets / Vercel env / Deno Deploy env / Docker `.env`
  或挂载文件），**不进仓库**，`.env.example` 只列变量名不给真实值。

---

## 19. 文档体系

`docs/{decisions,bug,deploy,perf}/` +
主题文档，脚手架阶段随对应模块代码一并补齐（不在本轮一次性写完）：

| 文件                       | 内容                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| `docs/Layout.md`           | §5.1 布局网格的逐像素/逐断点规范                                 |
| `docs/Design.md`           | Nova 风格的设计原则、间距节奏、信息密度指南                      |
| `docs/CSS.md`              | 四层令牌体系、命名规则、`check-hardcoded-tokens.js` 白名单       |
| `docs/Commit.md`           | §17 的完整规范 + 更多示例                                        |
| `docs/Database.md`         | §9 的完整 schema、迁移流程、workspace 隔离测试用例               |
| `docs/i18n.md`             | §11 的 key 命名规则、`i18n:` 前缀约定详解                        |
| `docs/Components.md`       | §6.4 组件逐个 API/Props/无障碍表，含 §5.2 Sidebar 全量属性       |
| `docs/Auth.md`             | §10 完整时序图                                                   |
| `docs/Workspace.md`        | §7 完整设计，含切换时序图、封装器 API                            |
| `docs/Testing.md`          | §13 完整规范                                                     |
| `docs/Logging.md`          | §14 完整规范 + 颜色对照表                                        |
| `docs/Deployment.md`       | §15 完整 runbook                                                 |
| `docs/Vendoring.md`        | §2.3 vendoring 流程、`VENDOR.md` 模板、`just vendor-update` 用法 |
| `docs/decisions/000N-*.md` | ADR，记录每一次架构级取舍（模板：背景/选项/决定/后果）           |
| `docs/bug/YYYY-MM-DD-*.md` | 事故复盘                                                         |
| `docs/deploy/*.md`         | 各平台部署实操记录                                               |
| `docs/perf/*.md`           | 性能调查与优化记录                                               |

---

## 20. 需你确认的开放决策（Review Checklist）

以下是本轮我作为架构师做出的、**存在多种合理选项**的取舍，请逐项确认或改写，我会在下一轮同步进
`ARCHITECTURE.md`：

1. **生产构建是否需要真正的压缩打包**，还是完全依赖平台边缘
   Brotli/Gzip（§2.1）？
2. **`x-auth-password` 头在登录后是否复用同名头传输会话令牌**，还是改用新头名
   `x-auth-token`（§10.1）？
3. **Docker/VPS 目标是否统一用 Deno 运行时**（`deno compile`
   产出二进制），而不是回退到 Node（§15.4）？我倾向前者以保持全项目工具链一致。
4. **Docker/VPS 的默认数据库沿用 Turso**，还是既然 VPS 有持久磁盘就默认走本机
   SQLite（§9.2）？
5. **用户头像菜单是否补充「退出登录」为第 4 项**（§7.6）？
6. `core_*`
   前缀作为"跨模块基础设施表"的命名扩展是否可接受，还是你希望换一个前缀词（§9.1）？
7. `@libsql/client` 之外，`hono/deno`、`hono/cloudflare-workers`、`hono/vercel`
   等平台适配子模块是否也一并 vendoring（默认是），还是希望更激进地只 vendoring
   最小核心、平台绑定代码完全手写（§2.3）？

请审阅后告知取舍，我会在你确认后再动手搭建 `apps/`、`packages/lib/`、`scripts/`
等实际框架代码。
