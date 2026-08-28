# ADR 0001: 采用 Deno 作为统一工具链

- 状态：已采纳
- 日期：2026-08-27
- 相关模块/文档：`ARCHITECTURE.md §2.1`、`docs/Deployment.md`

## 背景

项目要求"不能安装任何第三方包"，同时需要跨 Cloudflare Workers / Vercel / Deno
Deploy / Docker(VPS)
四个平台部署，还需要格式化、Lint、测试、单文件打包等工程化能力。若继续假设
Node + npm 中心的工具链，几乎每一项能力（Prettier/ESLint/Jest
等）都需要装依赖，与"零依赖"要求直接冲突。

## 考虑过的选项

1. **Node +
   npm，手写脚本替代所有工具链能力**：完全自研格式化器/Lint/测试运行器，工作量巨大且质量难以保证，违背"把精力放在业务模块化"的初衷。
2. **Bun**：内置 test runner 与打包能力，速度快，但格式化/Lint 生态仍不如 Deno
   完整，且与 Cloudflare/Deno Deploy 的边缘运行时兼容性不如 Deno 天然。
3. **Deno**：内置 `fmt`/`lint`/`test`/`compile`，原生支持 fetch 标准 API（与
   Hono 的设计哲学一致），`deno compile` 可直接产出 Docker/VPS
   部署用的单一可执行文件，`npm:` specifier
   提供必要时的兼容退路（本项目选择更进一步的 vendoring，见 ADR 0002）。

## 决定

采用 **Deno** 作为开发、格式化、Lint、测试、打包与部分部署目标（Deno
Deploy、Docker/VPS）的统一运行时与 CLI 工具链，替代 Node + npm。

## 后果

- 团队/贡献者需要熟悉 Deno 的权限模型（`--allow-*`）与 `deno.json`
  配置，学习成本存在但一次性。
- 部分生态工具（如某些 Node 专属 CLI）需要通过 `npm:` specifier
  临时执行，而不是本地长期安装，具体使用场景见 `ARCHITECTURE.md §2.4`。
- `deno bundle`
  等打包相关命令的稳定性历史上有过波动，生产构建的压缩/打包策略暂列为待定项（`ARCHITECTURE.md §20`
  之外的技术跟进项，脚手架阶段以当时 Deno 版本能力重新评估）。
