# VENDOR: promise-limit

- 上游仓库：<https://github.com/lovasoa/promise-limit>
- Vendoring 版本：v2.7.0
- Vendoring 日期：2026-08-28
- 许可证：MIT。上游 npm tarball 未随包附带 LICENSE 文件，以上游仓库为准。
- 包含内容：`index.cjs`（上游 CommonJS 源码，原样未改）+ `index.js`（本仓库新增的
  3 行 ESM re-export shim）。`@libsql/client/web` 的传递依赖。根 import map：
  `promise-limit` → `./packages/lib/promise-limit/index.js`。
- 已知裁剪/修改：唯一改动是新增 `index.js` ESM 包装（上游仅发布 CJS），
  shim 内已注明；下次同步时只需核对 `index.cjs` diff。

## 更新方式

随 `just vendor-update libsql-client` 一同核对版本。
