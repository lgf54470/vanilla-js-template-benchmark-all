# VENDOR: libsql-client（@libsql/client /web 构建）

- 上游仓库：https://github.com/tursodatabase/libsql-client-ts
- Vendoring 版本：@libsql/client v0.17.4（依赖锁定：
  @libsql/core 0.17.4、@libsql/hrana-client 0.10.0、
  @libsql/isomorphic-ws 0.1.5、js-base64 3.7.8、
  promise-limit 2.7.0）
- Vendoring 日期：2026-08-28
- 许可证：MIT（原始 LICENSE 已随文件保留在同目录）
- 包含内容：仅 `/web` 构建（纯 fetch/WebSocket，无 Node 原生绑定）——用 esbuild
  （deno run npm:esbuild@0.27.2，临时执行不落盘依赖）把
  @libsql/client/web 连同其依赖链打包为单文件自包含 ESM：web.js。
- 已知裁剪/修改：无手工修改；打包产物由脚本自动生成，可重跑复现。

## 更新方式

修改本脚本顶部 LIBSQL_* 版本常量并重跑 `just vendor-update libsql-client`，
详见 docs/Vendoring.md §4。
