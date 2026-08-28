/**
 * 结构化彩色日志系统
 */

const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

const ANSI_COLORS = {
  trace: "\x1b[90m",
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[43m\x1b[30m",
  error: "\x1b[31m",
  fatal: "\x1b[41m\x1b[1m\x1b[37m",
  reset: "\x1b[0m",
};

function getMinLevel() {
  let envLevel = "debug";
  try {
    if (typeof Deno !== "undefined") {
      envLevel = Deno.env.get("LOG_LEVEL") ||
        (Deno.env.get("DEPLOY_TARGET") === "local" ? "debug" : "warn");
    }
  } catch {
    envLevel = "debug";
  }
  return LOG_LEVELS[envLevel.toLowerCase()] ?? LOG_LEVELS.debug;
}

function parseCallerInfo() {
  const stack = new Error().stack;
  if (!stack) return { location: "", fn: "" };

  const lines = stack.split("\n");
  // Find caller frame (skipping logger internal frames)
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    if (line && !line.includes("logger.js") && !line.includes("node:assert")) {
      const match = line.match(/(?:at\s+(?:async\s+)?([^\s(]+)\s+\(([^)]+)\)|at\s+([^\s]+))/);
      if (match) {
        const fn = match[1] || "";
        const location = match[2] || match[3] || "";
        return { location, fn };
      }
    }
  }
  return { location: "", fn: "" };
}

export function createLogger(context = {}) {
  const { module, component, requestId } = context;

  function log(level, message, ...args) {
    if (LOG_LEVELS[level] < getMinLevel()) return;

    const timestamp = new Date().toISOString();
    const { location, fn } = parseCallerInfo();

    const parts = [`[${timestamp}]`, `[${level.toUpperCase()}]`, `[vanilla-js-template]`];
    if (module) parts.push(`[module:${module}]`);
    if (component) parts.push(`[component:${component}]`);
    if (requestId) parts.push(`[req:${requestId}]`);
    if (location) parts.push(`[${location}]`);
    if (fn) parts.push(`(${fn})`);

    const header = parts.join(" ");

    // Check if in browser or terminal
    if (typeof globalThis.window !== "undefined") {
      console.log(`${header} ${message}`, ...args);
    } else {
      const color = ANSI_COLORS[level] || "";
      const reset = ANSI_COLORS.reset;
      console.log(`${color}${header}${reset} ${message}`, ...args);
    }
  }

  return {
    trace: (msg, ...args) => log("trace", msg, ...args),
    debug: (msg, ...args) => log("debug", msg, ...args),
    info: (msg, ...args) => log("info", msg, ...args),
    warn: (msg, ...args) => log("warn", msg, ...args),
    error: (msg, ...args) => log("error", msg, ...args),
    fatal: (msg, ...args) => log("fatal", msg, ...args),
  };
}
