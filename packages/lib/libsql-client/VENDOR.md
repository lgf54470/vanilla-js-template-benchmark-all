# VENDOR: @libsql/client（web 构建）及纯 JS 传递依赖

- 上游仓库：https://github.com/tursodatabase/libsql-client-ts
- Vendoring 版本（全部锁定，非 main 分支头）：
  - `@libsql/client` **0.17.4**（本目录根：`web.js`/`ws.js`/`http.js`/`sql_cache.js`）
  - `@libsql/core` **0.17.4**（`core/`：api/config/uri/util）
  - `@libsql/hrana-client` **0.10.0**（`hrana/`：HTTP/WebSocket 协议客户端全套）
  - `@libsql/isomorphic-ws` **0.1.5**（`isomorphic-ws/web.mjs`：浏览器/Deno 原生
    WebSocket 出口）
  - `promise-limit` **2.7.0**（`promise-limit/`：WebSocket 连接并发限制）
  - `js-base64` **3.7.7**（`js-base64/base64.mjs`：hrana 鉴权 base64）
- Vendoring 日期：2026-08-29
- 许可证：`@libsql/*` 为 MIT，`js-base64` 为 BSD-3-Clause——原文合并于同目录
  `LICENSES.txt`；各包 `package.json` 一并保留。
- 包含内容：仅 **ESM 构建**（`lib-esm` 对应文件，未拷贝 `lib-cjs`/`node` 构建）；
  只取 `/web` 链路所需文件（`web.js` → `ws.js`/`http.js`/`sql_cache.js` → `core/*` →
  `hrana/*` → `isomorphic-ws`/`promise-limit`/`js-base64`），未拷贝 client 的
  node/sqlite3 实现与各包文档/示例/测试。
- 已知裁剪/修改（更新上游时需逐条人工比对）：
  1. **裸 specifier 改写为相对路径**：`@libsql/core/{api,config,uri,util}`、
     `@libsql/hrana-client`、`@libsql/isomorphic-ws`、`js-base64`、`promise-limit`
     的 import 一律按各文件目录深度改写为相对路径（esbuild/wrangler 不认 import
     map，见 `docs/Deployment.md §3`）。共 12 个文件被改写。
  2. **`promise-limit/index.js` 由 CJS 改写为 ESM**：`module.exports = fn` →
     `export default fn`（其余代码逐字未动；该包无 ESM 构建产物）。

## 更新方式

`just vendor-update libsql-client`，手动流程见 `docs/Vendoring.md §4`：
重新下载 `@libsql/client` 与其传递依赖的 tarball → 按本文件"包含内容"重新组装 →
重放上面 1/2 两处修改 → `just test` 全绿后提交
`build(infra): vendoring libsql-client 更新至 <version>`。
