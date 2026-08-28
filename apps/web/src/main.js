/**
 * 应用入口（ARCHITECTURE.md §3 / docs/Auth.md §1 前端门控）。
 *
 * 装配顺序：initAppearance（接管 PREPAINT 写入的偏好类）→ 按本地令牌
 * 门控：有令牌装配 AppShell；无令牌渲染独立登录页（URL 同步 /login）。
 * - auth:changed {token}：登录成功 → 装壳；登出/失效 → 拆壳回登录页。
 * - auth:unauthorized：任一 API 401（会话过期/吊销）→ 清令牌（级联拆壳）。
 */
import { initAppearance } from "/src/shared/lib/appearance.js";
import { initI18n } from "/src/app/i18n/bootstrap.js";
import { clearAuthToken, getToken } from "/src/shared/core/auth-client.js";
import { on } from "/src/shared/core/event-bus.js";
import { navigate } from "/src/shared/core/router.js";
import { AppShell } from "/src/app/shell/app-shell.js";
import { renderLogin } from "/src/app/shell/login.js";

await initAppearance();
await initI18n(); // 字典就绪后才渲染（i18n.md §1，防整屏裸 key）

const host = document.querySelector("#app");

/** @type {AppShell | null} */
let shell = null;

/** 装配应用壳（已装配时跳过；从 /login 回来时先归位默认页）。 */
function mountShell() {
  if (shell) return;
  if (globalThis.location?.pathname === "/login") {
    navigate("/", { replace: true });
  }
  shell = new AppShell(host);
  shell.mount();
}

/** 拆壳并渲染登录页。 */
function unmountShell() {
  shell?.destroy();
  shell = null;
  renderLogin(host);
}

/* 有令牌 → 壳；无令牌 → 登录页 */
if (getToken()) mountShell();
else unmountShell();

/* 登录/登出/会话失效统一经 auth:changed 切换 */
on("auth:changed", ({ token }) => {
  if (token) mountShell();
  else unmountShell();
});

/* API 401（令牌过期/吊销）：清令牌 → 级联触发 auth:changed 拆壳 */
on("auth:unauthorized", () => {
  if (getToken()) clearAuthToken();
});

/* 语言切换（setLocale 已确保新字典就绪）：重建当前视图（i18n.md §1） */
on("locale:changed", () => {
  if (getToken()) {
    if (shell) {
      unmountShell();
      mountShell();
    }
  } else {
    host.replaceChildren();
    renderLogin(host);
  }
});
