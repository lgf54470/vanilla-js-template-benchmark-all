# ADR 0002: 必要依赖走源码 vendoring 而非 npm install

- 状态：已采纳
- 日期：2026-08-27
- 相关模块/文档：`ARCHITECTURE.md §2.3`、`docs/Vendoring.md`

## 背景

后端需要一个跨四平台通用的路由框架（Hono）与一个能连接 Turso
的客户端（`@libsql/client`）。两者都不是可以合理自研替代的基础设施级代码（自己实现一套
fetch 标准路由器或 libSQL
线协议客户端的成本和风险都远高于收益），但项目又明确要求"禁止 npm install"。

## 考虑过的选项

1. **`npm:` specifier（Deno 原生支持）**：不落盘
   `node_modules`，语法上接近"不算安装"，但语义上仍是"运行时/构建时按需从
   registry 拉取第三方代码"，且默认无法离线构建，供应链攻击面（依赖 registry
   可用性与完整性）依然存在。
2. **完全自研替代**：为 Hono 自己写一个路由器、为 libSQL
   协议自己写客户端。工作量与维护成本极高，且这类基础设施代码"重新发明轮子"本身不产生业务价值。
3. **源码 vendoring**：下载指定版本的源码快照，连同 LICENSE 一起放入
   `packages/lib/`，通过 `deno.json` 的 `imports` 映射保持自然 import
   语法，不经过任何包管理器解析或运行时网络拉取。

## 决定

采用**源码 vendoring**：`packages/lib/hono/`、`packages/lib/libsql-client/`（仅
vendoring 无原生绑定的 `/web` 构建），每个目录配一份 `VENDOR.md`
记录版本、来源、许可证，更新走人工审查的 `just vendor-update <name>` 流程。

## 后果

- 构建期完全离线可行，依赖变化在 PR diff 里完全可见可审查。
- 需要人工承担"何时/如何同步上游更新"的责任（不再有自动的安全补丁推送），这是主动接受的取舍：用维护成本换供应链确定性。
- 新增第三个 vendored
  依赖设有明确门槛（`docs/Vendoring.md §6`），防止该例外被滥用扩散成事实上的"依赖管理"。
