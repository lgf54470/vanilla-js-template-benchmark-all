# VENDOR: libsql-hrana

- 上游仓库：<https://github.com/tursodatabase/libsql-client-ts>（包 `@libsql/hrana-client`）
- Vendoring 版本：v0.10.0
- Vendoring 日期：2026-08-28
- 许可证：MIT（原样保留于 ./LICENSE）
- 包含内容：`lib-esm/` 全量 ESM 构建（HTTP/WebSocket 两种传输 + 编解码），
  `@libsql/client/web` 的传递依赖。根 import map：
  `@libsql/hrana-client` → `./packages/lib/libsql-hrana/lib-esm/index.js`；
  其对 `@libsql/isomorphic-ws` 的引用映射到本目录树内 vendored 副本。
- 已知裁剪/修改：无文件改动（web.mjs 形态的 isomorphic-ws 使其无需 node:ws）。

## 更新方式

随 `just vendor-update libsql-client` 一同核对版本。
