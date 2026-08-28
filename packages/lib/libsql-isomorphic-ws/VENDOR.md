# VENDOR: libsql-isomorphic-ws

- 上游仓库：<https://github.com/tursodatabase/libsql-client-ts>（包 `@libsql/isomorphic-ws`）
- Vendoring 版本：v0.1.5
- Vendoring 日期：2026-08-28
- 许可证：MIT。上游 npm tarball 未随包附带 LICENSE 文件，以上游仓库为准。
- 包含内容：仅 `web.mjs`（优先使用全局 `WebSocket`——浏览器 / Deno / Workers 均内置），
  `@libsql/hrana-client` 的传递依赖。根 import map：
  `@libsql/isomorphic-ws` → `./packages/lib/libsql-isomorphic-ws/web.mjs`。
- 已知裁剪/修改：未随仓库分发 node.cjs/node.mjs（本项目所有目标运行时都有
  全局 WebSocket，无需 node:ws 回退）。

## 更新方式

随 `just vendor-update libsql-client` 一同核对版本。
