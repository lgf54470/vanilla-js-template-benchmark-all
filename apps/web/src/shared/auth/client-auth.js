import { STORAGE_KEYS } from "@contracts/constants.js";
import { eventBus } from "../core/event-bus.js";

export function getAuthToken() {
  if (typeof globalThis.window === "undefined") return "";
  try {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
      "";
  } catch {
    return "";
  }
}

export function saveAuthToken(token, storageKind = "persistent") {
  if (typeof globalThis.window === "undefined") return;
  try {
    clearAuthToken();
    if (storageKind === "session") {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
    eventBus.emit("auth:changed", { authenticated: true, token, storageKind });
  } catch {
    // Ignore
  }
}

export function clearAuthToken() {
  if (typeof globalThis.window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    eventBus.emit("auth:changed", { authenticated: false });
  } catch {
    // Ignore
  }
}

export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * 包装全局 fetch 自动附加 x-auth-password 与 x-workspace-id
 */
export async function authFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token && !headers.has("x-auth-password")) {
    headers.set("x-auth-password", token);
  }

  const wsId = localStorage.getItem("current_workspace_id") || "ws_default";
  if (wsId && !headers.has("x-workspace-id")) {
    headers.set("x-workspace-id", wsId);
  }

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !url.includes("/api/auth/login")) {
    clearAuthToken();
    eventBus.emit("auth:unauthorized");
  }
  return res;
}
