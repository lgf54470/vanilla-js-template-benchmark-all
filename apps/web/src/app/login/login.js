// apps/web/src/app/login/login.js — 登录页（Auth.md §1 / §6）
//
// 密码门控页：ds-input 密码 + 会话时长 2×4 网格（SESSION_DURATIONS 前 8 项）
// + 「保持登录直到下次浏览器打开」全宽项（session）。错误提示区分
// AUTH_LOCKED（带锁定倒计时）/ AUTH_INVALID_PASSWORD / 网络失败。
// 登录成功 → onLogin() 回调由 assemble.js 接管（装配 AppShell）。
//
// 文案全部走 i18n（shell.login.* / auth.session.*），时长标签取
// SESSION_DURATIONS 的 labelKey。

import { login } from "../../shared/core/auth-client.js";
import { t } from "../../shared/lib/i18n.js";
import { SESSION_DURATIONS } from "@contracts/constants.js";
import { iconSvg } from "../../shared/lib/icons.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";

const ERROR_KEYS = {
  AUTH_INVALID_PASSWORD: "shell.login.error.invalidPassword",
  AUTH_LOCKED: "shell.login.error.lockedTitle",
  AUTH_FAILED: "shell.login.error.failed",
  VALIDATION_ERROR: "shell.login.error.validation",
  INTERNAL_ERROR: "shell.login.error.internal",
  NETWORK_ERROR: "shell.login.error.network",
};

/**
 * @param {HTMLElement} container #app
 * @param {{ onLogin: () => void, appName?: string }} opts
 */
export function mountLogin(
  container,
  { onLogin, appName = "vanilla-js-template" },
) {
  ensurePageStyles(import.meta.url, "./login.css");
  const fixed = SESSION_DURATIONS.filter((d) => !d.session);
  const sessionOpt = SESSION_DURATIONS.find((d) => d.session);

  container.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-head">
          <div class="logo">${iconSvg("shield", 22)}</div>
          <h1>${appName}</h1>
          <p>${t("shell.login.title")}</p>
        </div>
        <form class="login-form" novalidate>
          <ds-input type="password" icon="key" placeholder="${
    t("shell.login.passwordPlaceholder")
  }" autocomplete="current-password"></ds-input>
          <div class="duration-grid">
            <span class="duration-label">${
    t("shell.login.durationLabel")
  }</span>
            <ds-segmented-control grids="2x4" value="24h">
              ${
    fixed.map((d) =>
      `<ds-segmented-control-item value="${d.id}" label="${
        t(d.labelKey)
      }"></ds-segmented-control-item>`
    ).join("")
  }
            </ds-segmented-control>
            <ds-segmented-control value="session" class="session-option" style="width:100%">
              <ds-segmented-control-item value="session" label="${
    t(sessionOpt.labelKey)
  }"></ds-segmented-control-item>
            </ds-segmented-control>
          </div>
          <ds-button variant="primary" size="md" type="submit">${
    t("shell.login.submit")
  }</ds-button>
          <div class="login-error" hidden></div>
        </form>
      </div>
    </div>`;

  const form = container.querySelector(".login-form");
  const input = container.querySelector("ds-input");
  const submit = container.querySelector("ds-button");
  const errorEl = container.querySelector(".login-error");
  let lockoutTimer = null;
  let duration = "24h";

  container.addEventListener("ds-segmented-control-change", (e) => {
    duration = e.detail?.value ?? duration;
  });

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    const password = input.getAttribute("value") ?? "";
    if (!password) {
      showError(t("shell.login.passwordRequired"));
      input.focus?.();
      return;
    }
    submit.disabled = true;
    submit.textContent = t("shell.login.submitting");
    try {
      await login({ password, durationOption: duration });
      onLogin();
    } catch (err) {
      const code = err?.code ?? err?.message ?? "AUTH_FAILED";
      showError(t(ERROR_KEYS[code] ?? "shell.login.error.failed"));
      if (code === "AUTH_LOCKED") startLockoutCountdown(30);
      input.focus?.();
    } finally {
      submit.disabled = false;
      submit.textContent = t("shell.login.submit");
    }
  });

  /** 锁定倒计时：禁用提交并显示剩余秒数（Auth.md §6 指数退避，前端按 30s 起步提示） */
  function startLockoutCountdown(seconds) {
    clearInterval(lockoutTimer);
    let left = seconds;
    submit.disabled = true;
    const tick = () => {
      if (left <= 0) {
        clearInterval(lockoutTimer);
        submit.disabled = false;
        hideError();
        return;
      }
      showError(t("shell.login.error.locked", { seconds: left }));
      left -= 1;
    };
    tick();
    lockoutTimer = setInterval(tick, 1000);
  }

  return () => {
    clearInterval(lockoutTimer);
    container.innerHTML = "";
  };
}
