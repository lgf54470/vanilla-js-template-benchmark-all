# Commit.md — Git 提交规范

对应 [`ARCHITECTURE.md §17`](../ARCHITECTURE.md#17-git-提交规范摘要)。基于
[Conventional Commits](https://www.conventionalcommits.org/)，并强制正文逐文件说明改动。

## 1. 格式

```
<type>(<scope>): <subject>

- <path/to/file>: <改动内容，到方法/组件级>
- <path/to/file>: <改动内容，到方法/组件级>
...

[可选正文补充说明]

[可选 footer：BREAKING CHANGE: ... / Closes #123]
```

- `subject` 用祈使句、不超过 50 字符、不加句号，可用中文。
- 正文**至少一条**以 `-` 开头、包含文件路径的改动行；`.githooks/commit-msg`
  会校验这一点，缺失则拒绝提交。
- 每条改动行描述"做了什么"，不是"文件是什么"——写
  `notes_data 新增 archived_at 列并建索引`，不要写 `修改了 schema 文件`。

## 2. type 列表

| type       | 用途                                                         |
| ---------- | ------------------------------------------------------------ |
| `feat`     | 新功能                                                       |
| `fix`      | 修 bug                                                       |
| `docs`     | 仅文档改动                                                   |
| `style`    | 不影响逻辑的格式改动（缩进/空格，`deno fmt` 之外的手动调整） |
| `refactor` | 不改变行为的代码重构                                         |
| `perf`     | 性能优化                                                     |
| `test`     | 新增/修改测试                                                |
| `build`    | 构建配置、`deno.json`、vendoring 更新                        |
| `ci`       | GitHub Actions / justfile                                    |
| `chore`    | 杂项（依赖版本号锁定、`.gitignore` 等）                      |
| `revert`   | 回退某次提交                                                 |

## 3. scope 列表

模块 id（`notes`/`settings`/...）或以下基础设施
scope：`shell`（app-shell/router/i18n bootstrap）、`shared`（`shared/*`
变更）、`infra`（`packages/lib`/`scripts`/`justfile`/CI）、`docs`（当改动横跨多个文档、不便归到单一模块时）。

## 4. 示例

**新功能，跨前后端多文件：**

```
feat(notes): 支持按工作空间过滤笔记列表

- apps/server/src/modules/notes/repository.js: listByWorkspace() 新增 workspace_id 参数化过滤
- apps/server/src/modules/notes/routes.js: GET /api/notes 读取 c.get('workspaceId') 传入 service
- apps/web/src/modules/notes/services/notes-api.js: fetchNotes() 附加 x-workspace-id 请求头
- apps/web/src/modules/notes/components/note-list.js: 监听 workspace:changed 事件触发重新拉取

Closes #42
```

**修 bug，单文件：**

```
fix(auth): 修复会话时长为"保持登录直到下次浏览器打开"时提前过期的问题

- apps/server/src/shared/auth/session.js: issueToken() 的 sessionOnly 分支不再写入 exp claim，改为仅依赖 sessionStorage 生命周期
```

**基础设施：**

```
build(infra): vendoring Hono 更新至上游 vX.Y.Z

- packages/lib/hono/VENDOR.md: 更新 commit hash 与日期
- packages/lib/hono/*: 同步上游源码
- apps/server/deno.json: 无需改动（imports 映射路径不变）
```

**破坏性变更：**

```
refactor(shared): 重命名 shared/core/store.js 的 createStore 返回值字段

- shared/core/store.js: subscribe() 返回值从 unsubscribe 函数改为 { unsubscribe } 对象，便于未来扩展

BREAKING CHANGE: 所有调用 store.subscribe() 的模块需要改为解构 { unsubscribe }
```

## 5. commit-msg 钩子

`.githooks/commit-msg`（零依赖 Deno 脚本，`git config core.hooksPath .githooks`
启用）校验：

1. 首行匹配
   `^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)\(([a-z0-9-]+)\): .{1,50}$`。
2. 正文至少一行匹配 `^- [\w./-]+: .+`（路径 + 冒号 + 说明）。
3. 若首行不匹配，钩子打印具体哪一部分不满足（type/scope/subject
   长度），而不是笼统报错。

## 6. PR 标题

与提交格式一致（`<type>(<scope>): <subject>`），PR
描述里额外要求：改动动机、是否触及 `ARCHITECTURE.md §20`
开放决策（若触及需注明采纳了哪一项）、是否需要更新 `docs/decisions/`。
