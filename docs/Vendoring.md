# Vendoring.md — 依赖 Vendoring 规范

对应
[`ARCHITECTURE.md §2.3`](../ARCHITECTURE.md#2-技术栈与依赖边界关键决策)。本项目唯二的"非自研代码"来源，全部走本文件流程，**不通过任何包管理器安装**。

## 1. 当前 vendored 依赖

| 名称                                                           | 路径                          | 来源                                      | 用途                                           |
| -------------------------------------------------------------- | ----------------------------- | ----------------------------------------- | ---------------------------------------------- |
| Hono（核心 + `cloudflare-workers`/`deno`/`vercel` 适配子模块） | `packages/lib/hono/`          | github.com/honojs/hono                    | 四平台统一后端路由框架（`ARCHITECTURE.md §8`） |
| `@libsql/client`（`/web` 构建，纯 JS，无原生绑定）             | `packages/lib/libsql-client/` | github.com/tursodatabase/libsql-client-ts | 连接 Turso（`Database.md §3`）                 |

是否把 Hono 的三个平台适配子模块也一并 vendoring，还是只 vendoring
核心、平台绑定代码完全手写，是
[`ARCHITECTURE.md §20`](../ARCHITECTURE.md#20-需你确认的开放决策review-checklist)
的开放项 #7，本文件当前按"一并 vendoring"的默认方案编写。

## 2. `VENDOR.md` 模板

每个 `packages/lib/<name>/` 目录下必须有一份 `VENDOR.md`：

```markdown
# VENDOR: <name>

- 上游仓库：<url>
- Vendoring 版本：<git tag 或 commit hash>
- Vendoring 日期：<YYYY-MM-DD>
- 许可证：<原始 LICENSE 内容或指向同目录下的 LICENSE 文件>
- 包含内容：<列出实际拷贝了哪些子路径/文件，说明为什么只拷这些而不是全量仓库>
- 已知裁剪/修改：<如有对上游源码的任何手动改动（应尽量避免），逐条说明原因，便于下次同步时手动
  diff>

## 更新方式

`just vendor-update <name>`，详见本文件 §3。
```

原始 `LICENSE`
文件必须原样保留在同目录下，不得省略（即使我们只用了上游仓库的一小部分文件）。

## 3. 首次 vendoring 流程

1. 克隆/下载上游仓库到临时目录，`git checkout` 到明确的 tag 或 commit（禁止跟踪
   `main`/`master` 分支头，必须锁定具体版本）。
2. 只拷贝实际需要的源码文件（如 Hono 只需要核心 + 我们用到的 3
   个适配子模块，不需要它仓库里的文档/示例/测试）。
3. 拷贝原始 `LICENSE` 文件。
4. 撰写 `VENDOR.md`（§2 模板）。
5. 在根 `deno.json` 的 `imports` 字段建立别名映射（见 `ARCHITECTURE.md §2.3`
   示例）。
6. 提交，commit message 用 `build(infra): vendoring <name>@<version>`，正文按
   `Commit.md` 规范逐文件列出拷贝了哪些路径。

## 4. `just vendor-update <name>` 更新流程

**手动触发、人工审查，不做任何形式的自动升级**（供应链安全的核心原则）：

1. 拉取上游对应新版本的源码到临时目录。
2. 对比新旧版本的 diff（重点看：API
   是否变化、依赖是否变化——若上游新增了它自己的运行时依赖，必须重新评估是否还能保持"零依赖"，否则放弃这次更新或另寻替代方案）。
3. 更新 `VENDOR.md` 的版本号、日期。
4. 跑 `just test`，确认现有测试（尤其 `Database.md §3` 的适配器测试、`Auth.md`
   相关的 Hono 路由测试）全部通过。
5. 提交，commit message `build(infra): vendoring <name> 更新至 <new-version>`。

## 5. 为什么不用 `npm:` specifier 直接引用

Deno 支持 `npm:hono` 这样的specifier 直接引用 npm 包而无需
`npm install`/`node_modules`，理论上也能满足"不落盘
`node_modules`"的字面要求。本项目选择更进一步的**源码 vendoring**，原因：

1. **构建期零网络依赖**：CI/离线环境下不需要能访问 npm registry
   就能构建，供应链攻击面进一步收窄。
2. **完全可审查**：`packages/lib/` 下的每一行代码都在仓库里，PR diff
   能直接看到依赖变化，而不是隐式指向一个外部版本号。
3. **与"不能安装任何第三方包"的字面要求更一致**：即使 Deno 的 `npm:`
   机制在实现上不落盘
   `node_modules`，语义上仍是"运行时按需拉取第三方包"，vendoring
   是唯一在字面和精神上都彻底满足该要求的方案。

## 6. 新增第三个 vendored 依赖前的门槛

在此之前新增任何 vendored 依赖，先在 `docs/decisions/` 写一条
ADR，说明：为什么自研成本不可接受、为什么现有两个 vendored
依赖覆盖不了这个需求、体积影响评估。默认假设是"不需要第三个"，不要因为"某个功能用现成库更快"就绕过这道门槛。
