# VENDOR: libsql-client

- 上游仓库：https://github.com/tursodatabase/libsql-client-ts
- Vendoring 版本：v0.17.4 (npm: @libsql/client@0.17.4)
- Vendoring 日期：2026-08-28
- 许可证：MIT（见同目录下的 LICENSE 文件）
- 包含内容：纯 JS Web 客户端（HTTP/WebSocket 协议支持，无 Node 原生绑定），打包为独立零依赖 ESM 模块 `web.js`
- 已知裁剪/修改：仅打包 `/web` 纯 JS 客户端，无外部依赖

## 更新方式

`just vendor-update libsql-client`，详见 `docs/Vendoring.md §3`。
