# VENDOR: hono

- 上游仓库：https://github.com/honojs/hono
- Vendoring 版本：v4.13.5 (npm: hono@4.13.5)
- Vendoring 日期：2026-08-28
- 许可证：MIT（见同目录下的 LICENSE 文件）
- 包含内容：Hono 核心 ESM 产物及 cloudflare-workers / deno / vercel 等平台适配子模块与常用中间件（cors, secure-headers, etag, logger）
- 已知裁剪/修改：仅保留 ESM 产物，移除文档、测试及 CJS 格式文件

## 更新方式

`just vendor-update hono`，详见 `docs/Vendoring.md §3`。
