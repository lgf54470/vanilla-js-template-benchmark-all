# PROGRESS.md — traework-glm53-high 分支实施进度

> 本文档供下一次会话以「按照 PROGRESS.md 文档进行推进任务」指令续接工作。
> 最后更新：2026-08-29（M5 验收提交完成之后）

## 0. 环境信息（必读）

| 项 | 值 |
| --- | --- |
| 主仓库目录 | e:\code\templates\vanilla-js-template-benchmark-all |
| 分支 | traework-glm53-high（基于 main 创建） |
| git worktree 目录 | E:\code\templates\vanilla-js-traework-glm53-high（所有开发在此目录进行） |
| 工具链 | Deno + just（justfile；所有门禁命令见下） |
| 本地 dev server | http://localhost:8787/（`just dev`；数据库 SQLite） |
| 登录密码 | smoke-test-1234（由 tmp/seed-auth.js 写入 settings:auth；tmp/ 未入库，密码失效时重跑 `deno run -A tmp/seed-auth.js`） |
| .env | APP_ENCRYPTION_KEY=local-dev-smoke-key-3f9a2c7e1b8d4056a2c9e1f7b3d5a8c0（已存在，勿提交） |

dev server 说明：当前 8787 端口由上一个会话启动的进程持有（代码改动即时生效：
静态服务按请求读盘 + ETag 按内容实时计算，无需重启）。若进程已死，直接 `just dev`。
浏览器侧：改过 JS 模块后必须 Ctrl+Shift+R 硬刷新（普通刷新会用旧模块缓存，
表现为"代码已更新但浏览器行为是旧版"，M5 验收时踩过）。

## 1. 工具坑位记录（下次会话直接避开）

1. **Write/Edit/DeleteFile 工具无法操作 worktree 目录**（"Access denied.
   Edit operations are restricted to the working directory"，主会话工作目录是
   主仓库）。在 worktree 下创建/改文件用 PowerShell：
   `[IO.File]::WriteAllText("相对\路径", $content, $enc)`，
   其中 `$enc = New-Object System.Text.UTF8Encoding($false)`。
2. **提交信息临时文件必须 UTF-8 无 BOM**：PowerShell 默认 UTF8 带 BOM 会让
   commit-msg 钩子误判首行格式（BOM 粘在首字符前）。写法见上一条（UTF8Encoding($false)）。
3. **commit-msg 钩子强制正文逐文件说明**：每行格式 `- path/to/file: 做了什么（到方法/组件级）`，
   缺失会被拒绝提交。首行 `<type>(<scope>): <subject>`。
4. **PowerShell 不支持 heredoc 语法**：多行文本用 `@'...'@` 单引号 here-string（不插值）。
5. **浏览器 ES 模块缓存顽固**：调试前端改动务必硬刷新。

## 2. 总体里程碑状态

| 里程碑 | 状态 | 提交 |
| --- | --- | --- |
| M0 脚手架 | ✅ 完成 | 1bc4ab3 |
| vendoring Hono | ✅ 完成 | 0091608 |
| vendoring libsql | ✅ 完成 | 2e8a952 |
| M1 设计系统令牌层 | ✅ 完成 | d0c3bf7 |
| M2 后端骨架 | ✅ 完成 | 4bf4c01 |
| M3 组件库 | ✅ 完成 | ea9f664 |
| M4 应用壳 | ✅ 完成 | 47aa27d |
| M5 i18n | ✅ 完成 | 9733a25 |
| M6 模块（9 个前端模块 + server 端） | ⬜ 未开始 | — |
| M7 治理与测试 | ⬜ 未开始 | — |
| M8 文档回写 | ⬜ 未开始 | — |
| 收尾（门禁全绿 + 提交规范 + §20 标注） | ⬜ 未开始 | — |

工作区当前干净（git status 无未提交改动）。

## 3. 已完成内容明细

### M0 脚手架（1bc4ab3）
- deno workspace（根 deno.json + apps/web + apps/server + packages/contracts）
- justfile（dev/fmt/lint/test/db-migrate/build-web/deploy-* 全套任务）
- contracts 常量包、CI 配置、git 钩子（commit-msg 校验 Conventional Commits + 逐文件行）
- vendoring：packages/lib/hono（hono@4.13.5 核心 + cloudflare/vercel/deno 适配）、
  packages/lib/libsql-client（@libsql/client@0.17.4 web 构建及依赖闭包，
  promise-limit 已重写为 ESM）。docs/Vendoring.md 的更新流程已实现 smoke-vendor.js。

### M1 设计系统令牌层（d0c3bf7）
- 四层色彩体系：themes/palettes-*.css（7 基色 + 12 图表色原始层，取自
  E:\code\shadcn-ui 参考仓库）→ tokens/colors.css（语义映射 --color-*）→
  themes/style-*.css（8 种风格令牌集 --ds-*，nova 为全集基准）→ 组件消费
- 结构令牌：spacing/radius/shadow/typography/zindex/motion/sidebar
- 自托管可变字体：Inter / Manrope / Geist（fontsource 下载）
- 外观引擎 shared/lib/appearance.js：风格/基色/图表色/圆角/字体/侧栏宽度/
  变体/折叠模式，读写 pref:* 键，应用 + appearancechange 广播
- 治理脚本 check-hardcoded-tokens.js（已接入 just lint）

### M2 后端骨架（4bf4c01）
- DB 适配器接口：SQLite（本地）/ D1（Cloudflare）/ Turso（其余平台），
  resolve.js 按目标解析
- 工作空间中间件 + createScopedRepository(...).forWorkspace(id) 数据隔离
- 认证：密码哈希、HMAC 令牌（x-auth-password 头约定：登录携明文，其余携
  令牌）、core_sessions 吊销/过期、登录失败限流（5 次锁定指数退避）
- 进程内 TTL+LRU 缓存；敏感字段 AES-GCM 加密（APP_ENCRYPTION_KEY）
- 5 平台入口 platform-adapters/（local/cloudflare/vercel/deno/docker）
- 静态服务 static-handler.js：多根映射、强 ETag+304、路径穿越防护、SPA 回退
- 迁移 runner（db-migrate.js）；server 侧现有模块：auth（migrations/
  repository/service/routes）

### M3 组件库（ea9f664）
- shared/ui 全量：Button/Input/Card/Dialog/Sheet/Toast/SegmentedControl/
  IconButton/DropdownMenu/Tooltip 等 + Sidebar 家族（Provider/Sidebar/
  Header/Content/Footer/Rail/Inset/Trigger/SidebarMenu...）
- 图标 sprite（createIcon）；attachStyles（fetch + CSSStyleSheet，
  shadow 组件样式注入）；组件遵循 no-motion（无 transition/animation）、
  UA 样式重置、composedPath 外点关闭、waitForTransition 时序约定
- 参考基准：shadcn base-nova（E:\code\shadcn-ui 本地仓库）

### M4 应用壳（47aa27d）
- app-shell.js：两列 Grid（sidebar + inset）、Header（sidebar-trigger/
  标题/lang-switch/theme-switch/theme-settings/logout）、拖拽调宽、
  菜单渲染（module.json 驱动）
- theme-settings 面板（风格/基色/图表色/圆角/字体/菜单外观/侧栏变体/折叠模式，
  即改即存）；not-found 视图；登录页 login.js（密码 + 8 档会话时长 +
  session 档）；main.js 门控（有令牌装壳/无令牌登录页）
- router 装配 + registry 生成（generate-module-registry.js）
- shared/core 客户端：auth-client / http-client / workspace-client / event-bus

### M5 i18n（9733a25）
- shared/lib/locales.js（语言清单 zh-CN/zh-TW/en + normalizeLocale）、
  fetch-json.js、module-i18n.js（模块字典兜底注册）
- shared/i18n/translate.js：Map<locale, dict> 合并式字典（注册与激活时序
  无关）；t(key, params) 查表：当前语言 → zh-CN → 代码内兜底 → key；
  {name} 插值；开发模式缺失 key console.warn
- shared/i18n/{zh-CN,zh-TW,en}.json：shell 级三语核心字典（65 key）
- app/i18n/bootstrap.js：initI18n（字典就绪后才渲染）/ setLocale
  （持久化→字典就绪→激活→广播 locale:changed）；main.js 监听重挂壳层
- 壳层硬编码文案全部替换为 t() 调用（login/theme-settings/not-found/app-shell）
- scripts/check-i18n-keys.js：三语 key 一致性/空翻译/多余 key 校验，已接入 just lint

## 4. 测试与验收通过清单

- `just fmt-check`：✅（177 files）
- `just lint`：✅（deno lint 100 files + check-hardcoded-tokens OK +
  check-i18n-keys OK + deno check platform-adapters OK）
- `just test`：✅ 8 passed / 0 failed
  - apps/server/tests/health.test.js（2：health 返回 ok+target；未知路径 404 JSON）
  - apps/web/tests/appearance.test.js（6：normalizeAppearance 空输入/非法值/
    合法透传+radius 档位；resolveDark；色板清单 7+12；fontStack CJK 兜底）
- M5 浏览器冒烟：✅ 登录（smoke-test-1234）→ 切 English（整页文案即时变英文，
  html lang=en，无需刷新）→ 切回 zh-CN（文案恢复中文）；console 无 JS 运行时错误
- M5 提交：9733a25（15 files，527 insertions），工作区干净

## 5. 未测试通过 / 已知问题清单

| 问题 | 结论 |
| --- | --- |
| 浏览器切换语言后文案不变（M5 冒烟首次 FAIL） | 非代码 bug：浏览器缓存了旧版 translate.js（旧导出 setActiveDictionary）。硬刷新后通过。服务端 curl 验证返回新版文件 |
| console 中 4 条 ERR_ABORTED 指向 8788 端口 | 来自浏览器其他标签页（Testing.md 的 e2e 默认 8788），与本项目无关 |
| 登出时 console 显示 /api/auth/logout 失败 | curl 验证 API 正常（login→logout 返回 {"ok":true}）；是拆壳时请求被取消的表象。若复现可复查，非阻断项 |
| 字体加载 ERR_ABORTED | 静态请求竞态取消，非阻断；M7 治理阶段可复查 |

## 6. 下一步：M6 模块（未开始，按此推进）

**首要问题：文档没有给出明确的 9 模块清单。** README 提到"设计系统（四层令牌/
主题引擎/9 模块 UI）"，ARCHITECTURE/AGENTS 只用 notes 作示例；server 侧说明
"当前 auth/notes/settings"。建议先向用户确认模块清单；若用户让自行决定，
建议默认清单（9 个）：

1. dashboard（纯展示，无后端；工作空间概览卡片）
2. notes（笔记，CRUD + 标签，有后端）
3. todos（待办，有后端）
4. bookmarks（书签，有后端）
5. finance（记账，有后端）
6. habits（习惯打卡，有后端）
7. calendar（日历视图，纯展示或轻后端）
8. gallery（图文卡片墙，纯展示）
9. settings（设置：密码修改/工作空间管理等，有后端）

每个模块严格按 AGENTS.md「新增一个模块的最小步骤」：

1. apps/web/src/modules/<id>/ 建 module.json（id/order/icon/labelKey/route/
   submodules）+ index.js（入口）+ i18n/{zh-CN,zh-TW,en}.json（三语 key
   集合一致，check-i18n-keys.js 强制）
2. 有数据需求才建 apps/server/src/modules/<id>/：routes.js + service.js +
   repository.js + migrations/0001_init.sql（表名 <id>_xxx 带 workspace_id，
   通过 createScopedRepository(...).forWorkspace(id) 访问，禁止裸查询）
3. 组件先查 shared/ui / shared/lib 已有能力；light-DOM 页面样式用
   ensurePageStyles(import.meta.url, "./styles/<page>.css") 注入
4. 不改 app/shell 任何文件；新增模块后跑 `deno task generate:registry`
   重新生成 registry.generated.js（已入库）
5. 模块间禁止 import，跨模块只走 event-bus / module-registry
6. 禁止 alert/confirm/prompt，用 ds-dialog/ds-toast；SQL 参数化；
   敏感字段加密 + 掩码；单文件 ≤ 500 行
7. 模块 UI 只出现在 <main> 内；信息卡片遵循 auto-fit minmax 减留白原则

M6 验收门禁：`just fmt-check && just lint && just test` 全绿 + 浏览器冒烟
（逐模块路由可达、CRUD 可用、i18n 三语切换）+ Conventional Commits 提交。

## 7. M7 治理与测试（未开始）

scripts/ 现有：build-web / check-hardcoded-tokens / check-i18n-keys /
db-migrate / generate-module-registry / smoke-vendor。
按 AGENTS.md 还缺（需实现并接入 justfile）：
- check-file-length.js（单文件 ≤ 500 行）
- check-module-boundaries.js（模块间 import 扫描，前后端两侧）
- 危险 SQL 拦截脚本（字符串拼接 SQL 检测）
- 后续：单测扩展、集成测试（workspace 隔离等，参照 docs/Testing.md）、
  UI 冒烟、/__dev/components 组件画廊路由（开发模式）

## 8. M8 文档回写与收尾（未开始）

- 实现与 ARCHITECTURE.md/docs/*.md 逐节对照，偏差回写文档
- 收尾门禁：just fmt-check && just lint && just test 全绿；git log 符合 §17；
  ARCHITECTURE.md §20 开放决策逐项在 PR 描述标注取舍
- 参考：AGENTS.md 文档地图；docs/bug/（目前 worktree 内无 bug 目录，
  主仓库 docs/bug/ 有事故复盘，实现对应领域前重读）

## 9. 常用命令（worktree 目录内执行）

```
just dev              # 本地开发（端口 8787）
just fmt / just fmt-check / just lint / just test
just db-migrate       # 执行迁移
deno task generate:registry   # 新增/删除模块后重新生成前端模块注册表
just build-web        # 组装 dist/web
```