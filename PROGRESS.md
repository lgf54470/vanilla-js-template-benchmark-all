# PROGRESS.md — 实现进度跟踪

> 记录「从零实现 vanilla-js-template」任务的里程碑进度、关键决策与当前状态。
> 工作分支：`workbuddy-glm53f-max`（基于 `main`），实现目录：git worktree
> `E:\code\templates\vanilla-js-template-glm53f-max`。

## 里程碑状态总览

| 里程碑        | 状态      | 验收门禁                                                                                                                                                                       | 备注                                      |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| M0 脚手架     | ✅ 完成   | `just dev` 起服（已验证 `/api/health` 返回 `{"ok":true,"target":"local"}`）；`just fmt-check`/`just lint` 通过                                                                 | 已提交 `39fb746`（132 文件）              |
| M1 设计令牌层 | ✅ 完成   | 切类变色/刷新不闪白已用 agent-browser 实测（zinc→red 主色联动、nova→vega→luma 风格 delta、dark 翻转 + 暗色填充、刷新后 PREPAINT 首帧前恢复 dark）；check-hardcoded-tokens 通过 | 已提交 `b0e32d4`（本轮）                  |
| M2 后端骨架   | ⬜ 未开始 | 四平台入口 import 不炸；迁移+种子可跑                                                                                                                                          | —                                         |
| M3 组件库     | ⬜ 未开始 | Components.md 属性表逐项对照                                                                                                                                                   | —                                         |
| M4 应用壳     | ⬜ 未开始 | 拖拽跟手；收起态无破损；弹层开合/外点收                                                                                                                                        | —                                         |
| M5 i18n       | ⬜ 未开始 | 三语循环切换零裸 key                                                                                                                                                           | —                                         |
| M6 模块       | ⬜ 未开始 | 9 前端模块 + auth/notes/settings 后端                                                                                                                                          | —                                         |
| M7 治理与测试 | ⬜ 未开始 | `just test` 全绿                                                                                                                                                               | run-checks/check-file-length 已在 M0 就位 |
| M8 文档回写   | ⬜ 未开始 | 文档-代码逐节对照                                                                                                                                                              | —                                         |

## 已完成工作（M0，commit `39fb746`）

1. **分支与 worktree**：`git branch workbuddy-glm53f-max main` +
   `git worktree add
   ../vanilla-js-template-glm53f-max`；`git config core.hooksPath .githooks`。
2. **依赖 vendoring**（真实上游源码，非 npm install，`packages/lib/` 共 7 份，
   每份含 `VENDOR.md` + LICENSE）：
   - `hono@4.13.5`（npm dist ESM 全量，含 cloudflare-workers/deno/vercel 适配）
   - `@libsql/client@0.17.4`（仅 /web 路径 5 模块：web/http/ws/hrana/sql_cache）
   - `@libsql/core@0.17.4`、`@libsql/hrana-client@0.10.0`、`@libsql/isomorphic-ws@0.1.5`
   - `js-base64@3.7.7`、`promise-limit@2.7.0`（CJS 原样保留 + 3 行 ESM shim）
   - 已用 Deno 实测：`import { Hono }` 与
     `import { createClient } from "@libsql/client/web"` 均解析成功。
3. **根 `deno.json`**：workspace 成员（apps/web、apps/server）+ vendored 依赖
   imports 映射（import map 不补扩展名，`@libsql/core/*` 用精确键逐一映射）+
   fmt/lint 排除区（packages/lib、docs、dist、coverage、.data）+ dev/migrate/
   registry/build/vendor 任务。
4. **`justfile`**：dev/fmt/fmt-check/lint/test/db-migrate/db-seed/generate-registry/
   build-web/vendor-update/hooks/deploy-*（deploy CLI 经
   `deno run -A npm:…@<锁定版本>` 临时执行，不落盘）。
5. **`.githooks/commit-msg(+.js)`**：sh 引导 + Deno 校验（首行
   `<type>(<scope>): <subject≤50>` + 正文至少一行
   `- 路径: 说明`；失败指明具体哪部分）。 实测拦截了 55 字符超长 subject。
6. **`packages/contracts/`**：`constants.js`（STORAGE_KEYS `pref:*`、
   SETTINGS_KEYS、SESSION_DURATIONS 2×4+大按钮、DEFAULT_WORKSPACE_ID）、
   `typedefs.js`（ApiResponse/DbAdapter/SessionTokenPayload/WorkspaceRow…）。
7. **治理脚本**：`scripts/run-checks.js`（自动发现执行链，接入 just lint）、
   `scripts/check-file-length.js`（硬规则 6：单文件 ≤500 行，跳过 packages/lib
   与 docs，例外扫描 packages/contracts）。
8. **最小后端骨架**：`app.js`（Hono + secureHeaders + /api/health + onError
   包络）、 `local.entry.js`（Deno.serve）；web 侧
   index.html/main.js/style.css/favicon 占位。
9. **CI/部署**：`.github/workflows/ci.yml`（fmt-check→lint→test）、`deploy.yml`
   （workflow_dispatch 选目标）；`env.example`（只列变量名）、`.gitignore`。

## 已完成工作（M1 设计令牌层）

**新增文件**（`apps/web/src/shared/styles/` + `shared/lib/` + `index.html`）：

- `tokens/sidebar.css`：--sidebar-width 16rem / --sidebar-width-icon 3rem /
  --sidebar-width-mobile 18rem + 运行时 --sidebar-current-width /
  --sidebar-resize-duration（只放尺寸，颜色在 palettes/语义层）。
- `themes/palettes-chart.css`：__chart-_ ×12_
  _（amber/blue/cyan/emerald/fuchsia/
  green/indigo/orange/pink/red/teal/violet，色相轮全覆盖的 12 选型，官方
  themes.ts 提取，亮/暗同值）。未挂 chart-_ 类时图表色跟随 base-*（官方 「chart
  color = 匹配基色」默认语义）。
- `themes/palettes-swatches.css`：设置面板磁贴色（base 磁贴 = light primary，
  chart 磁贴 = light chart-3，--swatch-* 仅面板消费）。
- `themes/style-nova.css`（--ds-* 全集基准，9 组 ≈55 变量）+ 7 个 delta：
  差异逐项核对官方 `registry/styles/style-*.css` 的 @apply 并换算到
  tokens/radius.css 倍数档位（vega 圆角 md+shadow-xs / maia 4xl+30% 填充输入 /
  lyra 直角 1px 焦点环 / mira 紧凑 2px+20% 填充 / luma 4xl+50% 填充+卡片阴影 /
  sera 直角+uppercase+下划线输入 / rhea 2xl~3xl+50% 填充）。
- **暗色敏感变量逐风格显式定义**：input-bg / checkbox-bg / switch-track-bg 与
  各弹层 ring-alpha 在每个风格的 `.dark.style-x` 块写死（官方 input/checkbox
  暗色 bg-input/30，luma/rhea 为 50%/90%，sera 全透明；switch 轨道暗色
  input/80、 luma/rhea input/90）——避免「切到非 nova 风格后暗色填充失效」。
- `base/reset.css`（重置 + body 主题接线）/ `base/motion.css`（reduced-motion
  令牌降级）/ `base/no-motion.css`（全站动效清零，唯一 !important 例外）。
- `index.css`：唯一 @import 入口（tokens → themes → base 顺序）。
- `shared/lib/appearance.js`：外观引擎（类挂载 / dark + data-theme + colorScheme
  / data-sidebar-* / --radius/--font-_-base 内联 / pref:_ 持久化 / system 跟随
  matchMedia / subscribe 通知）。
- `index.html` 重写：**PREPAINT 内联脚本**（首帧前读 localStorage 挂类写变量，
  与 appearance.js 双写一致）+ 三字体 preload 占位。
- `src/style.css`：只 @import shared/styles/index.css。
- `public/fonts/README.md`：woff2 落位与缺失降级说明。
- `scripts/check-hardcoded-tokens.js`：硬规则 3 治理脚本（裸颜色/radius/
  padding/margin/gap 的 px/font-size 数值字面量；白名单 = tokens/、themes/、
  base/reset.css；1px/2px 仅 border/outline 宽度；0px 视为结构性零）。

**浏览器验收（agent-browser 实测，冒烟页已删除）**：

1. 切 base：zinc→red，探针 --color-primary 即时 oklch(0.21…)→oklch(0.505 0.213
   27.518)，chart-1 联动。
2. 切 style：nova→vega（--ds-btn-radius 0.625rem→calc(0.625rem×0.8)）→luma
   （calc(0.625rem×2.6) + input-bg 50% 填充）。
3. 切 dark：primary 翻转 oklch(0.92…)，input-bg 变 color-mix(input 30%)。
4. 刷新：pref:theme=dark 持久化后 reload，首帧即 dark（PREPAINT 生效，无闪白）。

## 关键决策与踩坑记录

1. **网络可用**：本机可访问 npm registry，故按 `docs/Vendoring.md §3` 做了真实
   源码 vendoring（锁定版本 tarball），而非手写兼容层。
2. **import map 不补扩展名**：`@libsql/core/api` 这类无扩展名裸 specifier 必须
   在根 deno.json 用**精确键**映射到 `api.js`，前缀映射 `@libsql/core/` 无效。
3. **工具链**：Deno 2.8.3（`node:sqlite` 已验证可用，本地 SQLite 适配器无阻）、
   just 1.58.0。`node:url` 无 `fromFileUrl`（那是 Deno std API），统一改用
   `fileURLToPath`。
4. **bash 会话 cwd 不跨命令持久**：每条命令必须显式
   `cd
   /e/code/templates/vanilla-js-template-glm53f-max`，否则误操作落在主仓库
   （曾误在主仓库创建 .env，已清理）。
5. **端口清理**：多次后台 dev 试跑曾残留监听 8787 的进程（`taskkill /F /PID`
   清理）。
6. **commit-msg 钩子**：subject ≤50 字符（含中文按字符计）；正文每行
   `- 路径: 说明`。
7. **样式基准**：用户指定本地官方仓库 `E:\code\shadcn-ui` 为样式唯一事实源—— M1
   的调色板与风格集全部从 `apps/v4/registry/{themes.ts,styles/}` 提取，
   不再凭记忆写 oklch 值。
8. __chart-_ ×12 选型_*：官方 base=zinc 时可选 18 个主题色，本项目定为
   amber/blue/cyan/emerald/fuchsia/green/indigo/orange/pink/red/teal/violet——
   色相轮全覆盖且与 7 基色（zinc/red/orange/green/blue/violet/rose）语义不重叠
   （red/orange 等虽同名，chart 类走 --chart-1..5 独立阶梯）。
9. __menu-_ 变体实现_ _：官方 inverted = 给菜单元素加 `.dark`，本项目用
   `--ds-menu-*` 变量 + foreground 混合近似（inverted 亮色下菜单反相），
   translucent = color-mix 70% + --ds-menu-blur 40px（等价 backdrop-blur-2xl）；
   selector 特异性 (0,2,0) 高于 .style-_。M3 菜单组件落地时如有偏差再校。
10. **暗色敏感变量逐风格定义**：style delta 若只在 nova 定义 --ds-input-bg，
    切到其他风格后暗色填充会失效（组件 fallback 无法感知 .dark）——故
    input-bg/checkbox-bg/switch-track-bg/ring-alpha 每个风格都在 `.dark.style-x`
    显式给出，暗色环差异（luma/rhea 5%→10%）直接用 dark 块覆盖同名变量，
    不再引入 `-dark` 后缀变量。
11. **check-hardcoded-tokens 实现细节**：`0px` 视为结构性零放行（正则不能只查
    `0px` 子串——`10px` 也含 `0px`，须按数值判 0）；1px/2px 只放行 border/
    outline 族属性；扫描前先剥离 `/* */` 注释防误报；白名单 = tokens/、themes/、
    base/reset.css。
12. **浏览器验收方法**：`agent-browser`（npm 全局装 + 原生 exe 直接调）+ 静态
    服务器。坑：后台任务方式起的 http.server 与其他进程网络隔离（curl 000），
    必须与浏览器同一 shell 会话前台起服（如 `(python -m http.server 8801 &)`）；
    agent-browser 有页面缓存，改完文件要加 `?v=n` 参数；git-bash 里 taskkill
    `//F //PID` 会报无效参数，改用 PowerShell Stop-Process。
13. **PREPAINT 双写约束**：index.html 内联脚本与 appearance.js
    的选项列表/默认值/ 键名/类名必须严格一致；M1 冒烟页曾因 PREPAINT 只在有
    localStorage 值时挂类、 默认类没挂，导致初始 --ds-btn-radius
    为空——默认值必须无条件套用。

## 待办路线图

1. **M2 后端骨架**：DB 三适配器（sqlite:d1:turso）+ resolve、workspace 中间件
   - 种子、auth 中间件 + 会话、crypto（AES-GCM + 常数时间比较）、cache、logger、
     静态服务（ETag，落地后补跑 M1 的「切类变色/刷新不闪白」浏览器复检）、 5
     平台入口、迁移/种子脚本。
2. **M3 组件库**：shared/ui 全量（约 35 组件，Sidebar 家族按 shadcn base-nova
   组合树；组件 CSS 以 `var(--ds-*, nova 默认)` 消费风格层；menu 组件首次按 第 9
   条复核 inverted 近似）。
3. **M4 应用壳**：两列网格、Header、拖拽调宽、workspace-switcher、nav-user、
   主题设置面板（swatch 色块消费 --swatch-*）。
4. **M5 i18n**：fetch 加载 + bootstrap + 三语字典 + check-i18n-keys。
5. **M6 模块**：dashboard/channels/tokens/logs/system/docs/auth/notes/settings
   - server 端 auth/notes/settings + workspace 路由。
6. **M7 治理与测试**：剩余 check-* 脚本（含 scripts/tests 临时工作区基建）、
   单测/集成/组件逻辑测试、CDP 冒烟。
7. **M8 文档回写**：逐节对照（已知待定：CSS.md §2.3 的 style-nova 示例值与官方
   nova 视觉不一致——按钮圆角以官方 rounded-lg 为准，回写时修文档示例；CSS.md
   补充「组件以 var(--ds-*, nova 默认) 消费、暗色敏感变量逐风格定义」说明；
   文档化 appearance.js 与 PREPAINT 的双写一致性约束）。
