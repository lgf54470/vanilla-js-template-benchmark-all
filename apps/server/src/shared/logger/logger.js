// apps/server/src/shared/logger/logger.js — 结构化日志（Logging.md）
//
// createLogger({ module, component, requestId }) 返回带级别过滤与调用上下文的
// logger；文件路径/行号/函数名在调用时通过解析 Error().stack 自动提取。
// 级别阈值来自 LOG_LEVEL（local 默认 debug，其余部署环境默认 warn）。

const PROJECT_NAME = "freebuff";

const LEVELS = Object.freeze({
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
});

const LEVEL_NAMES = Object.freeze(
  Object.fromEntries(
    Object.entries(LEVELS).map(([k, v]) => [v, k.toUpperCase()]),
  ),
);

// Node/Deno 终端 ANSI 配色（Logging.md §3）
const ANSI = Object.freeze({
  trace: "\x1b[90m",
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[43m\x1b[30m",
  error: "\x1b[31m",
  fatal: "\x1b[41m\x1b[1m\x1b[37m",
  reset: "\x1b[0m",
});

/** 解析 LOG_LEVEL；非法值回退 warn。 */
export function resolveLogLevel() {
  const env = Deno.env.get("LOG_LEVEL");
  if (env && env in LEVELS) return LEVELS[env];
  const target = Deno.env.get("DEPLOY_TARGET");
  return target === "local" ? LEVELS.debug : LEVELS.warn;
}

/**
 * 从 Error().stack 解析调用者信息。
 * 跳过本文件自身帧，取第一个外部帧的 { fn, file, line }。
 */
export function parseCallSite(stack) {
  if (!stack) return null;
  const lines = stack.split("\n");
  for (const line of lines) {
    // 形如: at save (file:///.../note-editor.js:142:13)
    const m = line.match(/^\s*at\s+(.+?)\s+\((.+):(\d+):\d+\)$/);
    if (m) {
      return { fn: m[1], file: m[2], line: Number(m[3]) };
    }
    // 形如: at file:///.../note-editor.js:142:13 (匿名)
    const bare = line.match(/^\s*at\s+(.+):(\d+):\d+$/);
    if (bare) {
      return { fn: "", file: bare[1], line: Number(bare[2]) };
    }
  }
  return null;
}

/** 调用帧提取：跳过 logger 自身内部帧（本文件内所有函数）。 */
function callerInfo() {
  const err = new Error();
  const lines = (err.stack || "").split("\n");
  for (const line of lines) {
    if (line.includes("/logger/logger.js")) continue;
    const m = line.match(/^\s*at\s+(.+?)\s+\((.+):(\d+):\d+\)$/);
    if (m) return { fn: m[1], file: m[2], line: Number(m[3]) };
    const bare = line.match(/^\s*at\s+(.+):(\d+):\d+$/);
    if (bare) return { fn: "", file: bare[1], line: Number(bare[2]) };
  }
  return null;
}

/**
 * createLogger({ module, component, requestId })
 * @param {{ module: string, component?: string, requestId?: string }} ctx
 */
export function createLogger(ctx = {}) {
  const { module = "-", component, requestId } = ctx;
  const threshold = resolveLogLevel();

  function write(level, message, data) {
    const num = LEVELS[level];
    if (num < threshold) return; // 空操作，不做拼接/堆栈解析

    const site = callerInfo();
    const parts = [
      `[${new Date().toISOString()}]`,
      `[${LEVEL_NAMES[num]}]`,
      `[${PROJECT_NAME}]`,
      `[module:${module}]`,
    ];
    if (component) parts.push(`[component:${component}]`);
    if (requestId) parts.push(`[req:${requestId}]`);
    if (site) parts.push(`[${site.file}:${site.line}]`);
    if (site?.fn) parts.push(`(${site.fn})`);
    parts.push(message);

    const color = ANSI[level];
    const line = color
      ? `${color}${parts.join(" ")}${ANSI.reset}`
      : parts.join(" ");
    const args = [line];
    if (data !== undefined) {
      if (data instanceof Error) {
        args.push(data.stack || data.message);
      } else {
        try {
          args.push(JSON.stringify(data));
        } catch {
          args.push(String(data));
        }
      }
    }

    const sink = num >= LEVELS.error ? console.error : console.log;
    sink(...args);
  }

  const logger = {};
  for (const level of Object.keys(LEVELS)) {
    logger[level] = (message, data) => write(level, message, data);
  }
  return logger;
}
