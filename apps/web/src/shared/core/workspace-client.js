/**
 * shared/core/workspace-client.js — 工作空间列表与当前选中（docs/Workspace.md）。
 *
 * 当前 id 持久化在 localStorage[pref:workspace]；请求头由 http-client 统一
 * 附带 x-workspace-id。选中切换经 event-bus workspace:changed 广播
 * （Workspace.md §4 切换时序：壳层重挂当前模块）。
 */
import { apiFetch } from "./http-client.js";
import { STORAGE_KEYS } from "/packages/contracts/constants.js";

/**
 * 拉取工作空间列表（缓存由服务端承担，客户端不缓存）。
 * @returns {Promise<Array<{id: string, name: string, icon?: string}>>}
 */
export async function listWorkspaces() {
  const res = await apiFetch("/api/workspaces");
  if (!res.ok || !Array.isArray(res.data)) return [];
  return res.data.map((w) => ({
    id: String(w.id),
    name: String(w.name ?? w.id),
    icon: w.icon ?? "folder",
  }));
}

/** 当前工作空间 id（无记录返回 null，调用方回落第一项）。 */
export function getCurrentWorkspaceId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.workspace);
  } catch {
    return null;
  }
}

/**
 * 持久化当前工作空间 id。
 * @param {string} id
 */
export function setCurrentWorkspaceId(id) {
  try {
    localStorage.setItem(STORAGE_KEYS.workspace, id);
  } catch {
    /* 隐私模式等场景下静默跳过持久化 */
  }
}
