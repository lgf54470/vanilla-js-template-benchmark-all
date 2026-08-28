# VENDOR: hono

- 上游仓库：https://github.com/honojs/hono
- Vendoring 版本：hono@4.13.5（npm 发布产物，对应上游 tag `v4.13.5`）
- Vendoring 日期：2026-08-28
- 许可证：MIT（见同目录 `LICENSE`）
- 包含内容：
  - `dist/`（56 个文件）：从 npm tarball 的 ESM 构建中，以 `dist/index.js`、
    `dist/hono.js` 与三个平台适配器入口
    （`dist/adapter/{cloudflare-workers,deno,vercel}/index.js`）为起点计算的
    相对导入闭包。闭包额外带入了 `middleware/serve-static/`（适配器 serveStatic
    的基实现）、`helper/websocket/`、`helper/ssg/`、`helper/html/`、`client/`
    （ssg 依赖）以及核心的 `router/`、`utils/`、`request/`。
  - `mod.js`、`cloudflare-workers.js`、`deno.js`、`vercel.js`：本仓库新增的
    入口 shim，供根 `deno.json` `imports` 映射
    （`"hono"` / `"hono/cloudflare-workers"` / `"hono/deno"` / `"hono/vercel"`）。
  - `LICENSE`：上游 MIT 许可证原样保留。
- 已知裁剪/修改：
  - 未拷贝：CJS 构建（`dist/cjs/`）、类型声明（`dist/types/`）、JSX 运行时、
    validator/preset/client 完整实现及其余平台适配器（bun/aws-lambda/netlify
    等）——本项目只用核心 + 3 个适配子模块。
  - 上游源码零改动；全部修改仅为新增上述 4 个 shim 文件。

## 更新方式

`just vendor-update hono`，详见 `docs/Vendoring.md §4`。