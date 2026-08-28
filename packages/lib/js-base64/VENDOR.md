# VENDOR: js-base64

- 上游仓库：<https://github.com/dankogai/js-base64>
- Vendoring 版本：v3.7.7（满足 vendoring 时上游声明的 `^3.7.5` 区间）
- Vendoring 日期：2026-08-28
- 许可证：BSD-3-Clause（原样保留于 ./LICENSE.md）
- 包含内容：仅 ESM 构建 `base64.mjs`，`@libsql/core` 的传递依赖。根 import map：
  `js-base64` → `./packages/lib/js-base64/base64.mjs`。
- 已知裁剪/修改：无文件改动。

## 更新方式

随 `just vendor-update libsql-client` 一同核对版本。
