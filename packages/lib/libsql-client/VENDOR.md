# VENDOR: @libsql/client（web 构建）

- 上游仓库：https://github.com/tursodatabase/libsql-client-ts
- Vendoring 版本：
  - `@libsql/client@0.17.4`（npm 发布产物，`lib-esm/` ESM 构建）
  - `@libsql/core@0.17.4`（同仓库 `core/` 包，npm 发布产物）
  - `@libsql/hrana-client@0.10.0`（同仓库 `hrana-client/` 包）
  - `@libsql/isomorphic-ws@0.1.5`（同仓库 `isomorphic-ws/` 包，仅取 web 构建）
  - `js-base64@3.7.8`（BSD-3-Clause，见 `js-base64/LICENSE.md`）
  - `promise-limit@2.7.0`（ISC）
- Vendoring 日期：2026-08-28
- 许可证：`LICENSE` 为 @libsql/client 的 MIT（npm tarball 未附带该文件，取自
  上游仓库 main 分支根目录）；`hrana-client/LICENSE` 为其 MIT 原件；
  `js-base64/LICENSE.md` 为其 BSD-3-Clause 原件。`@libsql/core`、
  `@libsql/isomorphic-ws`、`promise-limit` 的 npm tarball 均未附带 LICENSE
  文件，其 package.json license 字段分别为 MIT / MIT / ISC。
- 包含内容：
  - 根目录 `web.js`/`ws.js`/`http.js`/`hrana.js`/`sql_cache.js`：
    `@libsql/client` lib-esm 中 `/web` 入口的相对导入闭包（`node.js`、
    `sqlite3.js` 原生绑定路径未拷贝）。
  - `core/`：`api.js`/`config.js`/`uri.js`/`util.js` 四文件及其闭包。
  - `hrana-client/`：lib-esm 全量 44 个 `.js`（`.d.ts` 未拷贝）。
  - `isomorphic-ws/web.js`：web 构建（Deno/浏览器走全局 `WebSocket`；`node.mjs`
    包装 `ws` 包的路径未拷贝）。
  - `js-base64/base64.js`：由 `base64.mjs` 原样拷贝（纯 ESM，无改动）。
  - `promise-limit/index.js`：按上游语义逐行等价重写的 ESM（上游 CJS 原件保留为
    `promise-limit/index.cjs` 参考——Deno/边缘运行时无法把本地 CJS 文件当 ESM
    导入，`import promiseLimit from ...` 无 default 互操作）。
- 已知裁剪/修改：
  - **promise-limit** 是唯一"非逐字节拷贝"的子依赖：语义等价 ESM 重写
    （并发上限 + 排队 + `.queue` 计数 + `.map`，与 index.cjs 逐分支对照）。
  - 其余改动是 **import 说明符重写**（上游逻辑零改动）：
    `@libsql/core/api|config|util|uri` → `./core/*.js`；
    `@libsql/hrana-client` → `./hrana-client/index.js`；
    `promise-limit` → `./promise-limit/index.js`；
    `js-base64` → 按文件深度重写为相对路径 `../…/js-base64/base64.js`；
    `@libsql/isomorphic-ws` → `../…/isomorphic-ws/web.js`。
  - 未拷贝 `node.js`/`sqlite3.js` 及 `@libsql/isomorphic-ws` 的 node 构建：
    本项目只在 Deno/边缘运行时使用 web 构建（HTTP/WebSocket），本地开发走
    `node:sqlite`。

## 更新方式

`just vendor-update libsql-client`，详见 `docs/Vendoring.md §4`。