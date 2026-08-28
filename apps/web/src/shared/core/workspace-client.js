// apps/web/src/shared/core/workspace-client.js — 当前工作空间上下文
//
// Workspace.md §4：localStorage['pref:workspace'] 优先；缺失时服务端中间件
// 回退 ws_default。切换流程：写 pref:workspace → 广播 workspace:changed →
// 壳层重挂当前模块（组件树完全 unmount 再 mount）。

import { DEFAULT_WORKSPACE_ID, STORAGE_KEYS } from "@contracts/constants.js";
import { emit } from "./event-bus.js";

export function getWorkspaceId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.WORKSPACE) ?? DEFAULT_WORKSPACE_ID;
  } catch {
    return DEFAULT_WORKSPACE_ID;
  }
}

export function setWorkspaceId(workspaceId) {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKSPACE, workspaceId);
  } catch {
    // 静默
  }
  emit("workspace:changed", { workspaceId });
}
