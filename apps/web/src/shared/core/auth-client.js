/**
 * shared/core/auth-client.js — 令牌存储与登录/登出（docs/Auth.md）。
 *
 * x-auth-password 头语义（Auth.md §3）：登录请求携带明文密码，
 * 其余请求携带签发的会话令牌。令牌按服务端下发的 storageKind 落在
 * localStorage（persistent）或 sessionStorage（session）。
 * 令牌增删经 event-bus 广播 auth:changed，main.js 据此装配/拆除 AppShell。
 */
import { emit } from "./event-bus.js";

/** 令牌在 localStorage / sessionStorage 中的键名 */
const TOKEN_KEY = "auth:token";

/** 当前会话令牌（localStorage 优先，sessionStorage 兜底；无则 null）。 */
export function getToken() {
  return readStorage("local") ?? readStorage("session") ?? null;
}

function readStorage(kind) {
  try {
    return globalThis[`${kind}Storage`]?.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeToken(kind, token) {
  try {
    globalThis[`${kind}Storage`].setItem(TOKEN_KEY, token);
  } catch {
    /* 隐私模式等场景下静默跳过持久化 */
  }
}

function removeTokens() {
  for (const kind of ["local", "session"]) {
    try {
      globalThis[`${kind}Storage`]?.removeItem(TOKEN_KEY);
    } catch {
      /* 同上 */
    }
  }
}

/**
 * 登录成功后保存令牌并广播 auth:changed。
 * @param {string} token
 * @param {"persistent" | "session"} storageKind
 */
export function saveAuthToken(token, storageKind) {
  removeTokens();
  writeToken(storageKind === "session" ? "session" : "local", token);
  emit("auth:changed", { token });
}

/** 清除令牌（登出/会话失效）并广播 auth:changed { token: null }。 */
export function clearAuthToken() {
  removeTokens();
  emit("auth:changed", { token: null });
}

/**
 * 登录（Auth.md §1 时序）。
 * @param {{ password: string, durationOption?: string }} input
 * @returns {Promise<{ ok: boolean, code?: string }>}
 */
export async function login(input) {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "x-auth-password": input.password,
        "content-type": "application/json",
      },
      body: JSON.stringify({ durationOption: input.durationOption }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.ok && body.data?.token) {
      saveAuthToken(body.data.token, body.data.storageKind);
      return { ok: true };
    }
    return { ok: false, code: body?.error?.code ?? "AUTH_FAILED" };
  } catch {
    return { ok: false, code: "NETWORK_ERROR" };
  }
}

/** 登出：吊销服务端会话后清除本地令牌（Auth.md §5）。 */
export async function logout() {
  const token = getToken();
  if (token) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-auth-password": token },
      });
    } catch {
      /* 网络异常不阻断本地登出 */
    }
  }
  clearAuthToken();
}
