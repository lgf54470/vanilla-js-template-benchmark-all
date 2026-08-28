// apps/server/src/shared/env.js — 跨运行时环境变量读取
//
// local/docker 用 Deno.env（--env-file 注入）；cloudflare/vercel 边缘运行时
// 有的没有 Deno.env（用 process.env），本文件统一兜底。平台适配器负责把
// 最终 env 对象传给 createDb/createApp（ARCHITECTURE.md §15.1）。

function hasDenoEnv() {
  return typeof Deno !== "undefined" && typeof Deno.env?.get === "function";
}

function processEnv() {
  const p = globalThis.process;
  if (p && typeof p.env === "object" && p.env) return p.env;
  return {};
}

/** 单次读取（不缓存，供启动时组装 env 对象用）。 */
export function getEnvVar(name) {
  if (hasDenoEnv()) return Deno.env.get(name);
  const value = processEnv()[name];
  return value === undefined ? undefined : String(value);
}

/** 组装一份扁平 env 记录（值为 string | undefined）。 */
export function collectEnv() {
  const keys = [
    "DEPLOY_TARGET",
    "APP_ENCRYPTION_KEY",
    "TURSO_URL",
    "TURSO_AUTH_TOKEN",
    "FORCE_TURSO",
    "LOCAL_SQLITE_PATH",
    "LOG_LEVEL",
    "PORT",
    "STATIC_ROOT",
  ];
  const out = {};
  for (const k of keys) {
    const v = getEnvVar(k);
    if (v !== undefined) out[k] = v;
  }
  return out;
}
