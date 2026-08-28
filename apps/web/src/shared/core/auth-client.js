// apps/web/src/shared/core/auth-client.js — 会话令牌存储与登录/登出
//
// Auth.md §2 存储映射：固定时长选项 → localStorage；"保持登录直到下次浏览器
// 打开"（session）→ sessionStorage。saveAuthToken 触发 auth:changed；
// 登出清除两种存储并调用 POST /api/auth/logout 吊销服务端会话。

import { HEADERS, STORAGE_KEYS } from "@contracts/constants.js";
import { emit } from "./event-bus.js";

/** 读取当前令牌（localStorage 优先，其次 sessionStorage） */
export function getAuthToken() {
  try {
    const p = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (p) return p;
  } catch {
    // 存储不可用
  }
  try {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN_SESSION);
  } catch {
    return null;
  }
}

/**
 * 保存令牌：persistent → localStorage；session → sessionStorage。
 * @param {string} token
 * @param {'persistent'|'session'} storageKind
 */
export function saveAuthToken(token, storageKind) {
  try {
    if (storageKind === "session") {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN_SESSION, token);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } else {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN_SESSION);
    }
  } catch {
    // 隐私模式静默
  }
  emit("auth:changed", { token: !!token, storageKind });
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN_SESSION);
    localStorage.removeItem(STORAGE_KEYS.SESSION_DURATION);
  } catch {
    // 静默
  }
  emit("auth:changed", { token: false });
}

/**
 * 登录：x-auth-password 头携带明文密码（Auth.md §3）。
 * @param {{ password: string, durationOption: string }} args
 * @returns {Promise<{ token: string, storageKind: string }>}
 */
export async function login({ password, durationOption }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [HEADERS.AUTH]: password,
    },
    body: JSON.stringify({ durationOption }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error?.code ?? "AUTH_FAILED");
  }
  saveAuthToken(payload.data.token, payload.data.storageKind);
  return payload.data;
}

/** 登出：吊销服务端会话 + 清除本地令牌（Auth.md §5） */
export async function logout() {
  const token = getAuthToken();
  try {
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { [HEADERS.AUTH]: token },
      });
    }
  } catch {
    // 服务端不可达也继续清除本地
  }
  clearAuthToken();
}
