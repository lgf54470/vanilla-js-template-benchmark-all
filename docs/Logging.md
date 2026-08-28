# Logging.md — 日志系统规范

对应
[`ARCHITECTURE.md §14`](../ARCHITECTURE.md#14-日志系统)。目标：开发时能在控制台一眼定位到"哪个项目/模块/组件/文件/行号/函数"出错。

## 1. API

```js
import { createLogger } from "@shared/logger/logger.js";
const log = createLogger({ module: "notes", component: "NoteEditor" });

log.trace("...");
log.debug("...");
log.info("笔记已保存", { noteId });
log.warn("草稿自动保存失败，将重试");
log.error("持久化失败", err);
log.fatal("数据库连接不可用，服务终止", err);
```

`createLogger({ module, component })`
返回的实例自动携带调用上下文；文件路径与行号在**调用时**通过解析
`new Error().stack` 自动提取，不需要手写。

## 2. 输出格式

```
[2026-08-27T10:22:31.512Z] [ERROR] [vanilla-js-template] [module:notes] [component:NoteEditor]
  [apps/web/src/modules/notes/components/note-editor.js:142] (NoteEditor#save)
  Failed to persist note: NetworkError: fetch failed
  <stack trace>
```

结构固定为：时间戳 → 级别 → 项目名 → `module:<id>` →
`component:<name>`（可选，纯函数场景省略）→ 文件路径:行号 → 函数/方法名 → 消息 →
附加数据/错误堆栈。

## 3. 级别与配色

| 级别    | 浏览器 `%c` 配色       | Node/Deno ANSI            | 用途                     |
| ------- | ---------------------- | ------------------------- | ------------------------ |
| `trace` | 灰 `#a1a1aa`           | `\x1b[90m`                | 极细粒度调试，默认不输出 |
| `debug` | 青 `#0891b2`           | `\x1b[36m`                | 开发期排查               |
| `info`  | 绿 `#16a34a`           | `\x1b[32m`                | 正常业务事件             |
| `warn`  | 黄底黑字 `#fbbf24`     | `\x1b[43m\x1b[30m`        | 可恢复的异常             |
| `error` | 红 `#dc2626`           | `\x1b[31m`                | 请求/操作失败            |
| `fatal` | 红底白字加粗 `#dc2626` | `\x1b[41m\x1b[1m\x1b[37m` | 服务不可用级别           |

浏览器端用
`console.log('%c[ERROR]%c ...', 'color:#dc2626;font-weight:600', 'color:inherit', ...)`；Node/Deno
本地终端用 ANSI 转义码；检测到不支持颜色的运行时（部分边缘环境的 `console`
不渲染 ANSI）时自动降级为纯文本但保留全部结构化前缀，不丢失可读性。

## 4. 日志级别控制

环境变量 `LOG_LEVEL`（默认：`local` 环境 = `debug`，其余部署环境 =
`warn`），`createLogger`
内部按级别数值比较过滤，低于阈值的调用是**空操作**（不做字符串拼接/堆栈解析，避免生产环境的无谓开销——这也是性能预算的一部分，见
`ARCHITECTURE.md §12`）。

## 5. 后端 `requestId` 贯穿

```js
// shared/logger/request-context.js
export function withRequestId(c, next) {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  return next();
}
```

`app.js` 最外层中间件生成 `requestId`，同一请求内所有
`service.js`/`repository.js` 的日志调用通过
`createLogger({ module, requestId: c.get('requestId') })` 携带同一个
id，日志行格式追加
`[req:<requestId>]`，便于把一次请求内跨模块的多条日志串起来排查。

## 6. 缺失翻译等"低优先级但需要开发期可见"的提示

`i18n.md §4` 的缺失翻译提示、`check-hardcoded-tokens.js`
等治理脚本的告警，统一走 `warn` 级别输出到运行 `just dev`/`just lint`
的终端，格式与本文件规范一致（不额外发明一套输出格式）。

## 7. 生产环境降噪

- 部署环境默认 `LOG_LEVEL=warn`，`info`
  及以下不输出，避免边缘运行时的日志计费/存储成本失控。
- `error`/`fatal` 级别的日志在支持的平台（如
  Cloudflare）额外考虑接入平台自带的日志/告警面板（不引入第三方 APM SDK
  依赖，使用平台原生能力），具体接入方式记录在 `docs/deploy/`
  对应平台的实操文档中。
