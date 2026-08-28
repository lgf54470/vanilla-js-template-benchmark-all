# ADR 0006: `ARCHITECTURE.md §20` 开放决策逐项裁定（M8 实现时拍板）

- 状态：已采纳
- 日期：2026-08-29
- 相关模块/文档：`ARCHITECTURE.md §20`、`docs/Deployment.md`、`docs/Workspace.md`、`docs/Auth.md`

## 背景

`ARCHITECTURE.md §20` 列出 7 条"存在多种合理选项"的开放式取舍。M8 收尾时逐项对照实现
给出最终裁定（本 ADR 即"PR 描述标注取舍"的落地载体，供后续审阅引用）。

## 逐项裁定

1. **生产构建是否需要真正的压缩打包** → 不需要。`scripts/build-web.js` 纯复制源码
   （源码即产物），体积压缩交给各平台的边缘 Brotli/Gzip（§2.1）。零打包 = 零依赖 =
   浏览器直接加载的源码，与项目"零 npm 依赖、源码可审查"的取向一致。
2. **`x-auth-password` 是否复用同名头传输会话令牌** → **是**，沿用同名头
   `x-auth-password` 传输 token（`shared/auth/auth-middleware.js` 校验与签发共用该头），
   不引入新头名 `x-auth-token`。减少一处需要向后兼容的协议变更。
3. **Docker/VPS 运行时是否统一用 Deno** → **是**。`just docker-build` 用
   `deno compile` 产出单一二进制 `dist/server`，保持全项目工具链统一（§15.4）。
4. **Docker/VPS 默认数据库** → 默认沿用 **Turso**；设置 `LOCAL_SQLITE_PATH` 时改用本机
   SQLite（`docker.entry.js` + `shared/db/resolve.js`）。与文档 §9.2 表格一致：非
   Cloudflare 平台统一 Turso，VPS 有持久盘用环境变量覆盖。
5. **用户头像菜单是否补「退出登录」为第 4 项** → 是，`<ds-nav-user>` 菜单含
   `logout`（图标 `log-out`、危险色），与设置/资料/账号并列。
6. **`core_*` 前缀命名扩展是否接受** → 接受。`core_workspaces` / `core_sessions` 已按
   此约定落地为跨模块基础设施表（§9.1）。
7. **hono 平台适配器子模块是否一并 vendoring** → 是。`packages/lib/hono/` 完整 vendored
   （含 `dist/adapter/{deno,cloudflare-workers,vercel,node}` 等子模块），无额外手写平台绑定。

## 影响

以上取舍均已落到实现，无需回改。后续若需推翻其中任何一项，应先修改本 ADR 并更新对应
文档/代码，保持"文档说 A 代码做 B"的偏差归零。