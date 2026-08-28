# ADR 0005: libsql-client vendoring 边界——纯 JS 传递依赖同目录纳入

- 状态：已采纳
- 日期：2026-08-29
- 相关模块/文档：`ARCHITECTURE.md §2.3`、`docs/Vendoring.md`、`packages/lib/libsql-client/VENDOR.md`

## 背景

`@libsql/client` 的 `/web` 构建并非自包含：其 ESM 产物通过裸 specifier 依赖
`@libsql/core`、`@libsql/hrana-client`、`@libsql/isomorphic-ws`、`promise-limit`、
`js-base64` 等包。`docs/Vendoring.md §6` 规定新增第三个 vendored 依赖前需写 ADR，
此处是"第二个依赖的传递依赖"，需要明确边界，避免例外被滥用扩散。

## 考虑过的选项

1. **只 vendoring `@libsql/client` 本体，其余传递依赖手写替代**：需要重写 hrana
   协议编解码/WebSocket 客户端，工作量与风险远超收益，违背 ADR 0002 的"基础设施
   代码不自研"原则。
2. **只 vendoring client 本体，运行时用 `npm:` specifier 拉取传递依赖**：违反
   "构建期零网络依赖 + 完全可审查"的 vendoring 初衷（ADR 0002 的后果约束）。
3. **把 client 及其纯 JS 传递依赖一并 vendoring 进 `packages/lib/libsql-client/`**：
   该目录整体构成"libsql-client 例外"的物理边界，VENDOR.md 逐包锁定版本并记录
   所有手动修改（裸 specifier 改写为相对路径、promise-limit 的 CJS→ESM）。

## 决定

采用**选项 3**：`packages/lib/libsql-client/` 下按包分子目录（`core/`、`hrana/`、
`isomorphic-ws/`、`promise-limit/`、`js-base64/` + 根部的 client ESM），整体作为
"libsql-client 例外"的一部分 vendoring。传递依赖只取 `/web` 链路实际用到的文件。

## 后果

- 更新 `@libsql/client` 时必须同步更新其传递依赖版本并重放两处手动修改
  （见 VENDOR.md），更新成本高于单一包。
- 边界清晰：**只有**能让 `web.js` 这条链路跑起来的包才允许进入本目录；任何新增
  的第三依赖仍受 `docs/Vendoring.md §6` 的 ADR 门槛约束。
