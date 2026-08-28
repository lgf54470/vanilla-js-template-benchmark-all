# Deployment.md — 部署 Runbook

对应
[`ARCHITECTURE.md §15`](../ARCHITECTURE.md#15-多平台部署与适配器)。四个目标共享
`apps/server/src/app.js`
的业务逻辑，仅平台适配器与环境变量不同。具体某次真实部署的操作记录归档到
`docs/deploy/`（本文件是通用 runbook，不是某一次部署的日志）。

## 1. 环境变量矩阵

| 变量                             | 说明                                                 | Cloudflare                | Vercel   | Deno Deploy | Docker/VPS                         |
| -------------------------------- | ---------------------------------------------------- | ------------------------- | -------- | ----------- | ---------------------------------- |
| `DEPLOY_TARGET`                  | 运行时标识，决定数据库适配器选择（`Database.md §3`） | `cloudflare`              | `vercel` | `deno`      | `docker`                           |
| `APP_ENCRYPTION_KEY`             | 字段加密密钥                                         | 必需                      | 必需     | 必需        | 必需                               |
| `TURSO_URL` / `TURSO_AUTH_TOKEN` | Turso 连接信息                                       | 仅 `FORCE_TURSO=1` 时需要 | 必需     | 必需        | 必需（除非设 `LOCAL_SQLITE_PATH`） |
| `FORCE_TURSO`                    | 强制 Cloudflare 改用 Turso                           | 可选                      | —        | —           | —                                  |
| `LOCAL_SQLITE_PATH`              | VPS 改用本机磁盘 SQLite                              | —                         | —        | —           | 可选                               |
| `LOG_LEVEL`                      | 日志级别（`Logging.md §4`）                          | 可选，默认 `warn`         | 同左     | 同左        | 同左                               |

## 2. 前端静态产物：同一份构建输出

四个目标共享**同一份前端产物**（`ARCHITECTURE.md §15.1`），源码即产物、没有打包步骤：

- `apps/web/`：入口 `index.html` + `src/`（原生 ESM 模块图 + CSS 模块
  `with { type: "css" }`，浏览器原生加载）。
- `packages/contracts/`：前端模块图会 `import` 的共享常量（如
  `SESSION_DURATIONS`）， 位于 `apps/web` 之外。

**本地开发与 Docker/VPS 自托管**（`local.entry.js` / `docker.entry.js`）通过
`createStaticHandler` 的 `extraRoots` 把 `packages/contracts` 作为第二个静态根
挂载（URL 前缀 `/packages/contracts`，路径穿越防护与 SPA 回退同样生效），
**不需要**任何组装步骤。

**Cloudflare / Vercel / Deno Deploy** 的平台静态托管只认**单一目录**，因此需要把
两份源码组装进一个目录（目录结构原样保留，模块相对 import 不受影响）：

```bash
just build-web   # 复制 apps/web/* 与 packages/contracts → dist/web/
```

`dist/web/` 就是"同一份构建输出"，下面三个平台都从它发布。

## 3. Cloudflare Workers

1. `wrangler.toml` 声明 D1
   binding（`[[d1_databases]] binding = "DB"`）与静态资源目录：

   ```toml
   [assets]
   directory = "dist/web"          # 先 `just build-web` 组装
   binding = "ASSETS"
   run_worker_first = true         # 非 /api 路径交给 assets，API 进 Worker
   not_found_handling = "single-page-application"  # SPA 回退 index.html
   ```

   `cloudflare.entry.js` 已实现：非 `/api` 路径且存在 `ASSETS` binding 时转发
   静态资产，否则进 Hono（与本地入口的 API/静态分流一致）。资产层（含 SPA
   深链回退与 `packages/contracts` 双根）已用 `wrangler dev` 演练验证，记录见
   `docs/deploy/2026-08-27-cloudflare-static-drill.md`。
   **打包说明（已验证）**：`apps/server` 的裸 specifier（`hono`/`@contracts/*`）
   已全部改为相对路径（`packages/lib/hono/...` 等），且 `resolve.js` 不静态
   import 本地专用的 `node:sqlite`（需要本地 SQLite 的入口注入工厂）——
   `cloudflare.entry.js` 可被 wrangler 4.14.0 直接打包运行（演练记录见
   `docs/deploy/2026-08-27-cloudflare-static-drill.md`）。若再新增裸
   specifier，注意 esbuild 不认 deno.json import
   map；`deno run
   npm:wrangler dev` 本机验证受限（Deno npm: 执行无法完整解析
   wrangler 自身依赖），真实部署前先在 CI/本地按演练方式验证打包。
2. 部署命令（临时执行，不落盘依赖，见
   `ARCHITECTURE.md §2.4`）：`deno run -A npm:wrangler@<锁定版本> deploy`。
3. 机密通过 `wrangler secret put APP_ENCRYPTION_KEY` 等命令注入，不写入
   `wrangler.toml`。
4. D1 迁移：`just db-migrate` 在 CI 部署流程中对目标 D1
   数据库执行（`wrangler d1 execute` 或等价的迁移 runner
   集成，具体命令行在脚手架阶段落地）。
5. 健康检查：`GET /api/health` 返回
   `{ ok: true, target: 'cloudflare' }`，Cloudflare 侧的可用性监控指向该端点。

## 4. Vercel

1. 前端产物：`vercel.json` 的 `outputDirectory` 指向组装好的 `dist/web/` （先
   `just build-web`），`buildCommand` 留空（零依赖零构建，源码即产物）。
2. Edge Function 入口即 `platform-adapters/vercel.entry.js`，`vercel.json` 配置
   rewrites 把 `/api/*` 指向该函数、其余路径 serve `dist/web/` 静态产物：

   ```json
   {
     "outputDirectory": "dist/web",
     "buildCommand": "",
     "rewrites": [{ "source": "/api/(.*)", "destination": "/api" }]
   }
   ```
3. 环境变量通过 Vercel 控制台/`vercel env` 命令配置，区分 Production/Preview
   两套（Preview 建议指向单独的 Turso 库，避免预览分支污染生产数据）。
4. 部署：`deno run -A npm:vercel@<锁定版本> deploy --prod`。

## 5. Deno Deploy

1. `platform-adapters/deno.entry.js` 即入口文件，Deno Deploy
   原生支持，不需要额外打包步骤。
2. 静态产物：`deployctl deploy` 加 `--static-dir=dist/web`（先
   `just build-web`）， 平台在请求到达 Worker 前直接服务静态文件；`/api`
   路径才进入口的 Hono。 **注意**：平台静态托管对未知路径不自动回退
   `index.html`，前端是 History 路由 （`/settings/profile`
   这类深链）——首次访问深链会 404。两种解法：前端深链一律从
   已有页面进入（现状即可），或在入口对非 `/api` 路径回退
   `/index.html`（脚手架阶段落地 后记入 `docs/deploy/`）。
3. 环境变量通过 Deno Deploy 控制台配置。
4. 这是四个目标里"运行时与本地开发工具链完全一致"的一个，出问题时最容易本地复现。

## 6. Docker / VPS

1. **构建**：`deno compile --allow-net --allow-env --allow-read --output dist/server apps/server/src/platform-adapters/docker.entry.js`
   产出单一可执行二进制（`ARCHITECTURE.md §15.4` 的架构师延伸决策，待 §20
   确认）。
2. **静态产物**：`docker.entry.js` 的 `STATIC_ROOT` 默认 `./public`，且已把
   `/packages/contracts` 作为第二个静态根挂在 `${webRoot}/packages/contracts`
   下—— Dockerfile 直接把组装好的产物 COPY 进去即可（两个根一次到位）：

   ```dockerfile
   COPY dist/web /public
   ENV STATIC_ROOT=/public
   ```

   （`dist/web` 内含 `apps/web` 内容 + `packages/contracts/`，与 extraRoots 的
   URL 前缀约定一致；也可以不组装、直接 `COPY apps/web /public` + 单独
   `COPY packages/contracts /public/packages/contracts`，二选一。）
3. **镜像**：基础镜像用 distroless 或 `scratch` + CA
   证书，`COPY dist/server /server`，`ENTRYPOINT ["/server"]`，不在镜像内安装任何包管理器。
4. **反向代理**：VPS 上建议前置 Caddy/nginx 做 TLS
   终止（这是系统级基础设施，不算项目依赖），或 `deno compile`
   产物直接监听并自带 TLS（视证书管理方式而定，记入 `docs/deploy/`
   的具体实操记录）。
5. **数据库**：默认 Turso，可通过 `LOCAL_SQLITE_PATH` 切换为 VPS 本机磁盘 SQLite
   文件（VPS 具备持久盘，见 `Database.md §3`）；选用本机 SQLite
   时需要自行规划备份策略（如定时 `sqlite3 .backup` 到独立存储）。
6. **健康检查**：容器编排（Docker Compose/Swarm/K8s 均可）配置对 `/api/health`
   的存活探针。

## 7. 回滚流程

- Cloudflare/Vercel/Deno
  Deploy：三者均支持"回滚到上一个成功部署"的平台原生能力，优先使用平台自带回滚，而不是重新跑一遍构建管线。
- Docker/VPS：保留最近 N 个 `deno compile` 产物（按 git commit hash
  命名归档），回滚即替换二进制 +
  重启容器；数据库迁移**不可自动回滚**（迁移只增不改，见
  `Database.md §2`），需要人工评估是否需要写一个补偿性迁移。

## 8. 部署前检查清单

1. `just fmt --check && just lint && just test` 全部通过。
2. 目标为 Cloudflare/Vercel/Deno Deploy 时，前端产物已组装并本地验证
   （`just build-web`，产物在 `dist/web/`）。
3. 目标环境的机密（`APP_ENCRYPTION_KEY`/`TURSO_*`）已配置且与代码里读取的变量名一致。
4. 新增的模块迁移文件已执行（`just db-migrate` 针对目标环境的数据库）。
5. 若涉及 `packages/lib/` vendored 依赖更新，`docs/Vendoring.md`
   的更新记录已提交。

## 9. 本地端口冲突排查（`AddrInUse`）

`just dev` 报 `AddrInUse: Address already in use (os error 98)` 说明 `PORT`
指定的端口已被其他进程占用。`local.entry.js` / `docker.entry.js` 现在会**自动
识别占用进程**并把改端口建议一并打印（进程识别为尽力而为，无 `ss`/`lsof`/
`netstat` 或没有 `--allow-run` 权限时退回通用建议）。

### 9.1 端口值从哪里来

- 本地开发：`.env` 的 `PORT`（`local.entry.js` 默认 8787）。
- **shell 里已 export 的 `PORT` 环境变量会覆盖 `.env`**——Deno 的 `--env-file`
  不覆盖已存在的环境变量。若改了 `.env` 仍不生效，先查： `env | grep PORT`，然后
  `unset PORT`（或 `env -u PORT just dev`）再试。
- 不要把注释写进 `.env` 的值里：`PORT=8788 # 注释` 会让值变成非数字，
  端口解析异常。需要说明时请单独一行 `# 注释`。

### 9.2 手动查找占用进程

```bash
ss -tlnp | grep :8787          # Linux（iproute2）
lsof -iTCP:8787 -sTCP:LISTEN -n -P   # macOS / Linux
netstat -ano | findstr :8787   # Windows
```

### 9.3 解决

二选一：结束占用进程（确认它不属于其他正在使用的项目），或在 `.env` 把 `PORT`
改为空闲端口（如 `PORT=8788`），改完直接 `just dev`。
