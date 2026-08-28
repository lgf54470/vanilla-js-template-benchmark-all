/**
 * shared/core/http-client.js — 统一 API 请求入口（ARCHITECTURE §3 core 目录）。
 *
 * 每个请求自动附带：
 * - x-auth-password：会话令牌（Auth.md §3，登录后语义切换为令牌）
 * - x-workspace-id：当前工作空间（Workspace.md §4 切换时序）
 *
 * 响应统一为 { status, ok, data, error }；401 时经 event-bus 广播
 * auth:unauthorized，main.js 拆除 AppShell 退回登录页（Auth.md §1）。
 */
import { getToken } from "./auth-client.js";
import { emit } from "./event-bus.js";
import { STORAGE_KEYS } from "/packages/contracts/constants.js";

/**
 * @param {string} path API 路径（如 "/api/workspaces"）
 * @param {RequestInit} [options] fetch 选项；body 为对象时自动 JSON 序列化
 * @returns {Promise<{ status: number, ok: boolean, data?: unknown, error?: { code?: string } }>}
 */
export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("x-auth-password", token);
  let workspaceId = null;
  try {
    workspaceId = localStorage.getItem(STORAGE_KEYS.workspace);
  } catch {
    workspaceId = null;
  }
  if (workspaceId) headers.set("x-workspace-id", workspaceId);

  let body = options.body;
  if (
    body != null && typeof body === "object" &&
    !(body instanceof FormData) && !headers.has("content-type")
  ) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(body);
  }

  const res = await fetch(path, { ...options, headers, body });
  if (res.status === 401) emit("auth:unauthorized", { path });

  const text = await res.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  return {
    status: res.status,
    ok: parsed?.ok ?? res.ok,
    data: parsed?.data,
    error: parsed?.error,
  };
}
