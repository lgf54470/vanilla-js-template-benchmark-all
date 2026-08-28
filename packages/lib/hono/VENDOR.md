# VENDOR: hono

- 上游仓库：https://github.com/honojs/hono
- Vendoring 版本：v4.13.5（npm tarball）
- Vendoring 日期：2026-08-28
- 许可证：MIT（原始 LICENSE 已随文件保留在同目录）
- 包含内容：dist/ 全量 ESM 产物（应用只 import 其中核心 index、middleware/cors、
  middleware/secure-headers、adapter/{cloudflare-workers,deno,vercel}），另附本目录下
  六个薄包装入口文件（mod/cors/secure-headers/http-exception/cloudflare-workers/deno/vercel.js），
  供根 deno.json 的 "hono"/"hono/" import 映射解析到。
- 已知裁剪/修改：无（上游源码未做任何改动；包装文件为本仓库新增，非上游内容）。

## 更新方式

修改本脚本顶部 HONO_VERSION 并重跑 `just vendor-update hono`，详见 docs/Vendoring.md §4。
