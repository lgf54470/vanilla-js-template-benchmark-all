/**
 * shared/logger/logger.js — 结构化日志（ARCHITECTURE.md §14 / docs/Logging.md）。
 *
 * 输出格式：
 *   [ISO 时间] [LEVEL] [vanilla-js-template] [module:x] [component:y] [req:id]
 *     [文件路径:行号] (函数名)
 *     消息 + 附加数据/错误堆栈
 * 级别低于 LOG_LEVEL 阈值时为空操作（不做字符串拼接/堆栈解析）。
 */
const PROJECT = "vanilla-js-template";

const LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const ANSI = {
  trace: "\x1b[90m",
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[43m\x1b[30m",
  error: "\x1b[31m",
  fatal: "\x1b[41m\x1b[1m\x1b[37m",
};
const RESET = "\x1b[0m";

const isLocal =
  (globalThis.Deno?.env?.get("DEPLOY_TARGET") ?? "local") === "local";

function threshold() {
  const fromEnv = globalThis.Deno?.env?.get("LOG_LEVEL");
  if (fromEnv && LEVELS[fromEnv] !== undefined) return LEVELS[fromEnv];
  return isLocal ? LEVELS.debug : LEVELS.warn;
}

const useColor = !(globalThis.Deno?.noColor === true);

/** 从 Error.stack 提取调用点的 [文件:行号] (函数名)（跳过 logger 内部帧）。 */
function callerLocation() {
  const lines = (new Error().stack ?? "").split("\n");
  for (const line of lines) {
    if (line.includes("logger.js")) continue;
    const m = line.match(/at\s+(?:(\S+)\s+)?\(?(.+?):(\d+):\d+\)?/);
    if (m) return { fn: m[1] ?? "<anonymous>", file: m[2], line: m[3] };
    if (line.trim().startsWith("at ")) {
      return { fn: line.trim(), file: "?", line: "?" };
    }
  }
  return null;
}

function render(level, prefix, loc, message, extra) {
  const parts = [];
  const head = `${prefix} [${level.toUpperCase()}] [${PROJECT}]`;
  parts.push(useColor ? `${ANSI[level]}${head}${RESET}` : head);
  if (loc) parts.push(`  [${loc.file}:${loc.line}] (${loc.fn})`);
  parts.push(`  ${message}`);
  if (extra !== undefined) {
    if (extra instanceof Error) {
      parts.push(`  ${extra.name}: ${extra.message}`);
      const stack = (extra.stack ?? "").split("\n").slice(1).join("\n");
      if (stack) parts.push("  " + stack);
    } else {
      parts.push(`  ${JSON.stringify(extra)}`);
    }
  }
  return parts.join("\n");
}

function emit(level, out, ctx, message, extra) {
  if (LEVELS[level] < threshold()) return;
  const loc = callerLocation();
  let prefix = `[${new Date().toISOString()}]`;
  if (ctx.module) prefix += ` [module:${ctx.module}]`;
  if (ctx.component) prefix += ` [component:${ctx.component}]`;
  if (ctx.requestId) prefix += ` [req:${ctx.requestId}]`;
  const text = render(level, prefix, loc, message, extra);
  out(
    level === "error" || level === "fatal" ? console.error : console.log,
    text,
  );
}

function out(sink, text) {
  sink(text);
}

/**
 * 创建携带上下文的 logger 实例。
 * @param {{module?: string, component?: string, requestId?: string}} ctx
 */
export function createLogger(ctx = {}) {
  const withCtx = (extra) => ({ ...ctx, ...extra });
  return {
    trace: (m, d) => emit("trace", out, withCtx(), m, d),
    debug: (m, d) => emit("debug", out, withCtx(), m, d),
    info: (m, d) => emit("info", out, withCtx(), m, d),
    warn: (m, d) => emit("warn", out, withCtx(), m, d),
    error: (m, d) => emit("error", out, withCtx(), m, d),
    fatal: (m, d) => emit("fatal", out, withCtx(), m, d),
    child: (extra) => createLogger(withCtx(extra)),
  };
}
