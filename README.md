# vanilla-js-template

零 npm 依赖的原生 JavaScript 全栈应用模板：**Web Components 前端 + Hono
后端**，`sidebar-with-header`
布局，模块化开发，工作空间级数据隔离，一套代码同时部署到 Cloudflare / Vercel /
Deno Deploy / Docker(VPS)。

> 📐 详细架构见 [`ARCHITECTURE.md`](./ARCHITECTURE.md)；给 AI
> 协作者/贡献者的速查表见 [`AGENTS.md`](./AGENTS.md)；专题文档见
> [`docs/`](./docs)。

## 特性

- **零运行时依赖**：不装 React/Vue/Tailwind，原生 Web Components + CSS
  变量手工实现设计系统；后端仅有的两个必要依赖（Hono、`@libsql/client`）以源码
  vendoring 形式随仓库分发，不经过 `npm install`。
- **模块化 +
  强解耦**：侧栏每个菜单是一个独立模块，子菜单是子模块；模块间禁止直接
  `import`，只能通过事件总线 / 能力注册表通信。
- **统一设计系统**：shadcn `base-nova` 风格，shadcn 同构的四层令牌体系（调色板
  ×7 基色 ×8 风格 ×12 图表色，全站亮/暗双态），三段胶囊式亮/暗/跟随系统切换，
  主题设置面板即改即存，PREPAINT
  首帧防闪；响应式布局，信息密度优先（不靠留白撑版面）；
  全站无动效（与参考模板一致，状态切换瞬时完成）。
- **工作空间隔离**：所有业务数据按「工作空间」（默认/工作/学习/生活/娱乐/旅游，可自定义）隔离，侧栏顶部工作空间切换器 +
  底部用户菜单，风格参考
  [shadcn Sidebar](https://ui.shadcn.com/docs/components/base/sidebar)。
- **多数据库自适应**：本地开发用 SQLite，部署到 Cloudflare 自动用
  D1，其余平台自动用 Turso（均可手动覆盖）。
- **多语言**：简体中文 / 繁體中文 / English。
- **单一密码鉴权**：`x-auth-password` 头 + 可配置会话时长（4/8/12/24
  小时、7/14/30/90 天，或仅当前浏览器会话）。
- **性能优先**：进程内热数据缓存、keyset
  分页、按模块代码分割，构建体积与查询效率是一等公民约束。
- **完整工程化**：零依赖治理脚本（模块边界/文件行数/硬编码令牌/危险 SQL
  拦截/i18n key 三语一致性）、Deno 内置测试与 Lint、结构化彩色日志、
  Conventional Commits + 逐文件提交说明，事故复盘沉淀在 `docs/bug/`。

## 技术栈

| 层         | 选型                                                          |
| ---------- | ------------------------------------------------------------- |
| 工具链     | Deno（格式化/Lint/测试/打包/`deno compile`，替代 Node + npm） |
| 前端       | 原生 Web Components + ES Modules，零框架                      |
| 后端       | Hono（vendored 源码），fetch 标准，四平台通用                 |
| 数据库     | SQLite（本地）/ Cloudflare D1 / Turso（libSQL）               |
| 任务运行器 | `just`（justfile）                                            |
| CI/CD      | GitHub Actions                                                |

## 快速开始

```bash
git clone <this-repo> my-app && cd my-app
just dev      # 本地开发：Deno + SQLite，浏览器打开提示的地址
```

> 首次运行会执行数据库迁移并写入默认工作空间种子数据（默认/工作/学习/生活/娱乐/旅游）。

## 项目结构（节选）

```
apps/
  web/     # 前端：src/modules/<id> 对应侧栏每个菜单（含纯展示模块）
  server/  # 后端：只为有数据需求的模块建 src/modules/<id>（当前 auth/notes/settings）
packages/
  lib/     # vendored 依赖（Hono、libSQL client）
  contracts/  # 前后端共享的纯类型/常量
docs/      # 分主题文档 + ADR/事故复盘/部署记录/性能记录
scripts/   # 零依赖代码治理脚本
justfile
```

完整目录树与每一层的设计理由见
[`ARCHITECTURE.md §3`](./ARCHITECTURE.md#3-monorepo-目录结构)。

## 常用命令

| 命令                                                                     | 作用                                  |
| ------------------------------------------------------------------------ | ------------------------------------- |
| `just dev`                                                               | 本地开发服务器                        |
| `just fmt` / `just lint`                                                 | 格式化 / 静态检查（含自定义治理规则） |
| `just test`                                                              | 单元 + 集成 + UI 冒烟测试             |
| `just fmt-check`                                                         | 仅检查格式（CI 第一步）               |
| `just db-migrate`                                                        | 执行数据库迁移                        |
| `just db-seed`                                                           | 写入/重置种子数据（含默认工作空间）   |
| `just vendor-update <name>`                                              | 手动同步 vendored 依赖源码            |
| `just build-web`                                                         | 组装前端静态产物到 `dist/web`         |
| `just build` / `just docker-build`                                       | 构建 Docker 镜像                      |
| `just deploy-<target>`（`cloudflare` \| `vercel` \| `deno` \| `docker`） | 部署到对应平台                        |

> 底层任务均以 `deno task` 定义（justfile 只是外壳）：如
> `deno task generate:registry` 在新增/删除模块后重新生成前端模块注册表
> （`apps/web/src/modules/registry.generated.js`，已入库，仅模块变更时需手动刷新）。

## 部署

四个目标共享同一份后端业务逻辑（`apps/server/src/app.js`），仅通过平台适配器（`platform-adapters/*.entry.js`）桥接各自的运行时协议与数据库绑定，详见
[`ARCHITECTURE.md §15`](./ARCHITECTURE.md#15-多平台部署与适配器) 与
`docs/Deployment.md`。

| 目标               | 数据库默认                 | 说明                              |
| ------------------ | -------------------------- | --------------------------------- |
| Cloudflare Workers | D1                         | 可配置改用 Turso                  |
| Vercel             | Turso                      |                                   |
| Deno Deploy        | Turso                      |                                   |
| Docker / VPS       | Turso（可配置本机 SQLite） | `deno compile` 产出单一可执行文件 |

## 设计系统

视觉语言对齐 shadcn 的 `base-nova` 风格，用原生 CSS 变量 + Web Components
重实现（不依赖 React/Tailwind/Radix）。色彩采用四层体系：
`themes/palettes-*`（基色/图表色原始变量层）→ `tokens/colors.css`（语义映射层）
→ 组件消费；风格差异走 `themes/style-*`（`--ds-*` 风格令牌集，8 种）；圆角以
`--radius` 单一基准 calc 派生。禁止硬编码字面量（治理脚本强制）；令牌全貌与
消费规则见 [`docs/CSS.md`](./docs/CSS.md)，组件目录与 Sidebar 完整规格见
[`docs/Components.md`](./docs/Components.md)。

## 文档

| 文档                                                      | 内容                                 |
| --------------------------------------------------------- | ------------------------------------ |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                    | 架构总纲，所有设计决策的"为什么"     |
| [`AGENTS.md`](./AGENTS.md)                                | 给 AI/贡献者的速查表                 |
| `docs/Layout.md` `docs/Design.md` `docs/CSS.md`           | 布局与视觉规范                       |
| `docs/Components.md`                                      | 组件 API                             |
| `docs/Database.md` `docs/Workspace.md`                    | 数据库 schema 与工作空间隔离         |
| `docs/Auth.md`                                            | 鉴权时序                             |
| `docs/i18n.md`                                            | 多语言约定                           |
| `docs/Testing.md` `docs/Logging.md`                       | 测试与日志规范                       |
| `docs/Deployment.md` `docs/Vendoring.md`                  | 部署与依赖 vendoring 流程            |
| `docs/decisions/` `docs/bug/` `docs/deploy/` `docs/perf/` | ADR / 事故复盘 / 部署记录 / 性能记录 |

## 贡献

提交信息遵循
[Conventional Commits](https://www.conventionalcommits.org/)，正文需逐文件说明改动到方法/组件级别，详见
[`docs/Commit.md`](./docs/Commit.md)。提交前请确保
`just fmt && just lint && just test` 全部通过。

## 状态

架构设计与全部框架代码已落地：设计系统（四层令牌/主题引擎/9 模块 UI）、鉴权、
工作空间隔离、i18n（fetch 加载 + 三语一致性校验）、四平台适配器、零依赖治理
脚本与测试（单元/集成/UI 冒烟）均可用。后续迭代项见各模块 TODO 与
`ARCHITECTURE.md §20` 未决项（Tabs/Table/Pagination 等组件待增）。

## License

TBD
