# VENDOR: libsql-core

- 上游仓库：<https://github.com/tursodatabase/libsql-client-ts>（包 `@libsql/core`）
- Vendoring 版本：v0.17.4
- Vendoring 日期：2026-08-28
- 许可证：MIT。上游 npm tarball 未随包附带 LICENSE 文件，以上游仓库 `LICENSE.md` 为准。
- 包含内容：`lib-esm/{api,config,uri,util}.js`，是 `@libsql/client/web` 的传递依赖。
  根 import map 以精确键映射：`@libsql/core/api` → `./packages/lib/libsql-core/api.js`
  等（import map 不做扩展名补全，故逐个显式映射）。
- 已知裁剪/修改：无文件改动；未随仓库分发其 d.ts 与非 web 路径模块。

## 更新方式

随 `just vendor-update libsql-client` 一同核对版本（core 与 client 版本号互相锁定）。
