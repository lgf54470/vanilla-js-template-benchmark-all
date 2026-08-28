import { attachStyles, createIcon } from "../ui/base.js";
import { saveAuthToken } from "./client-auth.js";
import { toast } from "../ui/toast/toast.js";

const css = `
:host {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--color-bg);
  color: var(--color-fg);
  padding: var(--space-4);
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 26rem;
  background-color: var(--color-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.brand-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-2);
}

.brand-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
}

.brand-title {
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.025em;
}

.brand-desc {
  font-size: var(--text-xs);
  color: var(--color-fg-muted);
}

.duration-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.duration-label {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-fg-muted);
}

.duration-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-1);
}

.duration-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  padding: 0;
  font-size: var(--text-xs);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-fg);
  cursor: pointer;
  user-select: none;
}

.duration-btn--active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-fg);
  font-weight: 600;
}

.session-btn {
  width: 100%;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  background-color: transparent;
  color: var(--color-fg);
  cursor: pointer;
}

.session-btn--active {
  background-color: var(--color-secondary);
  border-style: solid;
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}

.submit-btn {
  width: 100%;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-msg {
  font-size: var(--text-xs);
  color: var(--color-danger);
  text-align: center;
}
`;

const DURATION_OPTIONS = [
  { label: "4小时", seconds: 4 * 3600 },
  { label: "8小时", seconds: 8 * 3600 },
  { label: "12小时", seconds: 12 * 3600 },
  { label: "24小时", seconds: 24 * 3600 },
  { label: "7天", seconds: 7 * 86400 },
  { label: "14天", seconds: 14 * 86400 },
  { label: "30天", seconds: 30 * 86400 },
  { label: "90天", seconds: 90 * 86400 },
];

export class LoginPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.selectedSeconds = 24 * 3600; // Default 24h
    this.isSessionOnly = false;
    this.isLoading = false;
    this.errorMessage = "";
  }

  connectedCallback() {
    this.render();
  }

  async handleLogin() {
    const input = this.shadowRoot.querySelector("ds-input");
    const password = input ? input.value.trim() : "";

    if (!password) {
      this.errorMessage = "请输入访问密码";
      this.render();
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.render();

    try {
      const storageKind = this.isSessionOnly ? "session" : "persistent";
      const durationSeconds = this.isSessionOnly ? (30 * 86400) : this.selectedSeconds;

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-auth-password": password,
        },
        body: JSON.stringify({
          password,
          durationSeconds,
          storageKind,
        }),
      });

      const data = await res.json();

      if (data.ok && data.data?.token) {
        saveAuthToken(data.data.token, data.data.storageKind || storageKind);
        toast.success("登录成功");
      } else {
        this.errorMessage = data.error?.message || "密码错误，请重试";
        this.isLoading = false;
        this.render();
      }
    } catch (err) {
      this.errorMessage = `网络错误: ${err.message}`;
      this.isLoading = false;
      this.render();
    }
  }

  render() {
    const durButtons = DURATION_OPTIONS.map((opt) => {
      const active = !this.isSessionOnly && this.selectedSeconds === opt.seconds;
      return `
        <button class="duration-btn ${
        active ? "duration-btn--active" : ""
      }" type="button" data-seconds="${opt.seconds}">
          ${opt.label}
        </button>
      `;
    }).join("");

    this.shadowRoot.innerHTML = `
      <div class="login-card">
        <div class="brand-header">
          <div class="brand-icon">${createIcon("shield-check")}</div>
          <div class="brand-title">vanilla-js-template</div>
          <div class="brand-desc">全局单密码保护 · 请输入访问口令</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
          <ds-input id="pwd-input" type="password" placeholder="输入访问口令..." icon="key" autofocus></ds-input>
          ${this.errorMessage ? `<div class="error-msg">${this.errorMessage}</div>` : ""}
        </div>

        <div class="duration-section">
          <div class="duration-label">会话保持时长</div>
          <div class="duration-grid">
            ${durButtons}
          </div>
          <button class="session-btn ${
      this.isSessionOnly ? "session-btn--active" : ""
    }" type="button" id="btn-session">
            ${createIcon("clock")}
            <span>保持登录直到下次浏览器打开</span>
          </button>
        </div>

        <button class="submit-btn" type="button" id="btn-submit" ${
      this.isLoading ? "disabled" : ""
    }>
          ${this.isLoading ? "验证中..." : "进入工作空间"}
        </button>
      </div>
    `;

    this.shadowRoot.querySelectorAll(".duration-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.isSessionOnly = false;
        this.selectedSeconds = Number(btn.getAttribute("data-seconds"));
        this.render();
      });
    });

    this.shadowRoot.querySelector("#btn-session")?.addEventListener("click", () => {
      this.isSessionOnly = true;
      this.render();
    });

    this.shadowRoot.querySelector("#btn-submit")?.addEventListener("click", () => {
      this.handleLogin();
    });

    const input = this.shadowRoot.querySelector("ds-input");
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.handleLogin();
      }
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("login-page")) {
  customElements.define("login-page", LoginPage);
}
