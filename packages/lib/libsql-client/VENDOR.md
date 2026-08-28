# VENDOR: libsql-client

- 上游仓库：<https://github.com/tursodatabase/libsql-client-ts>（包 `@libsql/client`）
- Vendoring 版本：v0.17.4（npm tarball，`lib-esm` 构建）
- Vendoring 日期：2026-08-28
- 许可证：MIT。上游 npm tarball 未随包附带 LICENSE 文件，以上游仓库 `LICENSE.md` 为准。
- 包含内容：仅 `/web` 路径实际需要的 5 个模块：
  `lib-esm/{web,http,ws,hrana,sql_cache}.js`——纯 fetch/WebSocket 客户端，无原生绑定、
  无 node:fs 依赖（本地开发不用 Turso，边缘平台经此客户端访问 libSQL/Turso HTTP API）。
  经根 `deno.json` imports 映射 `@libsql/client/web` →
  `./packages/lib/libsql-client/lib-esm/web.js`。
- 已知裁剪/修改：node/sqlite3/http 直连等不用于 /web 路径的模块未随仓库分发；
  对 `@libsql/core/*` 等上游依赖的裸 specifier 由根 import map 指向本目录树内
  的 vendored 副本（见 libsql-core / libsql-hrana / promise-limit）。

## 更新方式

`just vendor-update libsql-client`，流程见 `docs/Vendoring.md` §3/§4。
