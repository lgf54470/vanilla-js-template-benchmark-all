# VENDOR: hono

- 上游仓库：https://github.com/honojs/hono
- Vendoring 版本：**v4.13.5**（npm registry tarball，与 GitHub tag v4.13.5 对应）
- Vendoring 日期：2026-08-29
- 许可证：MIT（见同目录 `LICENSE`）
- 包含内容：
  - `dist/**`：npm 包的 **ESM 构建产物**（`dist/index.js` 为核心；含
    `adapter/deno`、`adapter/cloudflare-workers`、`adapter/vercel` 三个平台适配子模块，
    以及全部 helper/middleware）。**未拷贝** `dist/cjs/**`（CommonJS 构建，本项目不用）。
  - `package.json`：仅作 exports 映射参考（`hono` → `dist/index.js`、`hono/deno` →
    `dist/adapter/deno/index.js`、`hono/cloudflare-workers` →
    `dist/adapter/cloudflare-workers/index.js`、`hono/vercel` →
    `dist/adapter/vercel/handler.js`）。
  - `LICENSE`：上游 MIT 原文。
  - 未拷贝文档/示例/测试（按 docs/Vendoring.md §3.2）。
- 已知裁剪/修改：
  - 无源码修改。dist 内部 import 全部为相对路径（`./...`），可直接被 Deno 与
    esbuild/wrangler 解析，无需改写。
  - 部分文件含 `node:` import（如 `adapter/deno/serve-static.js`、
    `middleware/context-storage/index.js`）——仅在对应平台入口使用，Cloudflare 入口
    不引用它们，不影响 wrangler 打包。

## 更新方式

`just vendor-update hono`，手动流程见 `docs/Vendoring.md §4`：
下载新版本 tarball → diff 审查（重点：API 变化、是否新增运行时依赖）→ 更新本文件
版本号/日期 → `just test` 全绿后提交 `build(infra): vendoring hono 更新至 <version>`。
