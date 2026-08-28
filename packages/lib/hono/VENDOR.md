# VENDOR: hono

- 上游仓库：<https://github.com/honojs/hono>
- Vendoring 版本：v4.13.5（npm tarball `hono-4.13.5.tgz`，dist ESM 构建）
- Vendoring 日期：2026-08-28
- 许可证：MIT（原样保留于 ./LICENSE）
- 包含内容：`dist/` 全量 ESM 构建（核心 + 全部平台适配子模块 cloudflare-workers / deno /
  vercel 等）。未拷贝上游文档、示例、测试与 CJS 构建。应用代码以裸标识符
  `import { Hono } from "hono"` 引用，经根 `deno.json` imports 映射到
  `./packages/lib/hono/dist/index.js`（`hono/` 前缀映射到 `dist/`）。
- 已知裁剪/修改：无文件改动。

## 更新方式

`just vendor-update hono`，流程见 `docs/Vendoring.md` §3/§4。
