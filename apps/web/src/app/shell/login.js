/**
 * app/shell/login.js — 独立全屏登录页（docs/Auth.md §1 门控、§2 时长选择）。
 *
 * main.js 在无本地令牌时渲染本页（.login-standalone），URL 同步为 /login；
 * 登录成功由 auth-client 广播 auth:changed，main.js 据此装配 AppShell。
 *
 * 会话时长选择（Auth.md §2）：2×4 网格（ds-segmented-control grid 模式，
 * 默认 24h）+ 底部通栏「保持登录直到下次浏览器打开」大按钮（session 选项，
 * 令牌落 sessionStorage，关闭浏览器即失效）。
 */
import { ensurePageStyles } from "/src/shared/lib/page-styles.js";
import { login } from "/src/shared/core/auth-client.js";
import { navigate } from "/src/shared/core/router.js";
import { t } from "/src/shared/i18n/translate.js";
import { toast } from "/src/shared/ui/toast/toast-host.js";
import { SESSION_DURATIONS } from "/packages/contracts/constants.js";
import "/src/shared/ui/input/input.js";
import "/src/shared/ui/button/button.js";
import "/src/shared/ui/segmented-control/segmented-control.js";

/** 默认选中的时长选项（Auth.md §2 表格首列常见档位） */
const DEFAULT_DURATION = "24h";

/** 时长选项文案表（i18n key → 兜底中文；M5 起由字典覆盖） */
const DURATION_LABELS = {
  "4h": "4 小时",
  "8h": "8 小时",
  "12h": "12 小时",
  "24h": "24 小时",
  "7d": "7 天",
  "14d": "14 天",
  "30d": "30 天",
  "90d": "90 天",
};

/** 登录失败错误码 → 用户可读文案（Auth.md §1/§6） */
const ERROR_TEXTS = {
  AUTH_INVALID_PASSWORD: "密码错误",
  AUTH_LOCKED: "失败次数过多，已临时锁定，请稍后再试",
  NETWORK_ERROR: "网络异常，请稍后再试",
};

/**
 * 渲染登录页（幂等：已渲染时直接返回）。
 * @param {HTMLElement} host 挂载容器（#app）
 */
export function renderLogin(host) {
  if (host.querySelector(".login-standalone")) return;
  ensurePageStyles(import.meta.url, "./login.css");
  if (globalThis.location?.pathname !== "/login") {
    navigate("/login", { replace: true });
  }

  host.innerHTML = `
    <div class="login-standalone">
      <div class="login-card">
        <h1 class="login-title">${t("auth.title", "欢迎回来")}</h1>
        <p class="login-desc">${
    t(
      "auth.description",
      "输入访问密码以进入应用",
    )
  }</p>
        <ds-input class="login-password" type="password" name="password"
          label="${t("auth.password", "访问密码")}"
          placeholder="${t("auth.passwordPlaceholder", "请输入访问密码")}">
        </ds-input>
        <p class="login-duration-label">${
    t(
      "auth.durationLabel",
      "会话时长",
    )
  }</p>
        <ds-segmented-control class="login-durations" grid="2x4"
          value="${DEFAULT_DURATION}"
          aria-label="${t("auth.durationLabel", "会话时长")}">
        </ds-segmented-control>
        <ds-button variant="primary" class="login-submit"
          aria-label="${t("auth.login", "登录")}">
          ${t("auth.login", "登录")}
        </ds-button>
        <ds-button variant="outline" class="login-session">
          ${
    t(
      "auth.sessionOnly",
      "保持登录直到下次浏览器打开",
    )
  }
        </ds-button>
      </div>
    </div>`;

  const input = host.querySelector(".login-password");
  const durations = host.querySelector(".login-durations");
  const submitBtn = host.querySelector(".login-submit");
  const sessionBtn = host.querySelector(".login-session");

  // 2×4 网格只装 8 个固定档位；session 档走底部通栏大按钮
  for (const option of SESSION_DURATIONS) {
    if (option.sessionOnly) continue;
    const item = document.createElement("ds-segmented-item");
    item.setAttribute("value", option.id);
    item.textContent = t(
      `auth.duration.${option.id}`,
      DURATION_LABELS[option.id] ?? option.id,
    );
    durations.append(item);
  }

  let duration = DEFAULT_DURATION;
  durations.addEventListener("segmented-change", (e) => {
    duration = e.detail.value;
  });

  /** @param {string} durationOption */
  const submit = async (durationOption) => {
    const password = input.value?.trim() ?? "";
    if (!password) {
      input.setAttribute("invalid", "");
      input.setAttribute(
        "error",
        t("auth.passwordRequired", "请输入访问密码"),
      );
      input.focus();
      return;
    }
    input.removeAttribute("invalid");
    input.removeAttribute("error");
    submitBtn.setAttribute("disabled", "");
    const result = await login({ password, durationOption });
    submitBtn.removeAttribute("disabled");
    if (result.ok) {
      toast.success(t("auth.loginSuccess", "登录成功"));
      return; // auth:changed → main.js 装配 AppShell
    }
    input.setAttribute("invalid", "");
    input.setAttribute(
      "error",
      t(
        `auth.error.${result.code ?? ""}`,
        ERROR_TEXTS[result.code ?? ""] ?? t("auth.loginFailed", "登录失败"),
      ),
    );
    input.focus();
  };

  submitBtn.addEventListener("click", () => submit(duration));
  sessionBtn.addEventListener("click", () => submit("session"));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit(duration);
  });
  input.focus();
}
