// apps/web/src/shared/core/http-client.js — 后端请求客户端
//
// 统一附加 x-auth-password（会话令牌，Auth.md §3）与 x-workspace-id（Workspace.md
// §4）请求头；解包 { ok, data/error } 响应包络；401 时广播 auth:unauthorized
// （会话失效 → 壳层拆除 AppShell 退回登录页）。令牌与工作空间从各自的客户端
// 读取（auth-client / workspace-client），本文件不直接碰存储。

import { HEADERS } from "@contracts/constants.js";
import { emit } from "./event-bus.js";

/** 注入式设计：测试可替换 token/workspace 提供器 */
export function createHttpClient({ getToken, getWorkspaceId }) {
  /**
   * @param {string} path 如 "/api/notes"
   * @param {{ method?: string, body?: unknown, raw?: boolean }} [init]
   * @returns {Promise<any>} 包络解包后的 data（raw=true 时返回完整 Response）
   */
  async function request(path, init = {}) {
    const headers = new Headers(init.headers ?? {});
    const token = getToken?.();
    const workspaceId = getWorkspaceId?.();

    if (token && !headers.has(HEADERS.AUTH)) {
      headers.set(HEADERS.AUTH, token);
    }
    if (workspaceId && !headers.has(HEADERS.WORKSPACE)) {
      headers.set(HEADERS.WORKSPACE, workspaceId);
    }
    if (init.body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    let res;
    try {
      res = await fetch(path, {
        method: init.method ?? "GET",
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
    } catch (err) {
      throw new HttpError("NETWORK_ERROR", "网络请求失败", err);
    }

    if (res.status === 401) {
      emit("auth:unauthorized", { path });
    }
    if (init.raw) return res;

    let payload;
    try {
      payload = await res.json();
    } catch {
      throw new HttpError(
        "BAD_RESPONSE",
        "响应不是合法 JSON",
        null,
        res.status,
      );
    }
    if (!res.ok || payload.ok === false) {
      throw new HttpError(
        payload?.error?.code ?? "HTTP_ERROR",
        payload?.error?.message ?? `HTTP ${res.status}`,
        null,
        res.status,
      );
    }
    return payload.data;
  }

  return { request };
}

export class HttpError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {unknown} [cause]
   * @param {number} [status]
   */
  constructor(code, message, cause, status) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

/** 应用级单例：依赖注入由 shell 装配时 setDefaults 设置 */
let defaultClient = null;

export function setHttpClientDefaults({ getToken, getWorkspaceId }) {
  defaultClient = createHttpClient({ getToken, getWorkspaceId });
}

export function http() {
  if (!defaultClient) {
    throw new Error(
      "http-client 未初始化：shell 装配时调用 setHttpClientDefaults",
    );
  }
  return defaultClient;
}
