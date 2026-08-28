import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };
import { toast } from "../../shared/ui/toast/toast.js";

registerTranslations("zh-CN", "settings", zhCN);
registerTranslations("zh-TW", "settings", zhTW);
registerTranslations("en", "settings", en);

export default {
  mount(container) {
    const token = localStorage.getItem("auth:token") || "";
    const headers = { "x-auth-password": token, "content-type": "application/json" };

    container.innerHTML = `
      <div class="page-container page-container--narrow">
        <div class="page-header">
          <div>
            <h1 class="page-title">${t("settings.title")}</h1>
            <p class="page-description">${t("settings.description")}</p>
          </div>
        </div>

        <ds-card>
          <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-4);">${
      t("settings.security")
    }</div>
          <div style="display: flex; flex-direction: column; gap: var(--space-3); max-width: 24rem;">
            <div>
              <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
      t("settings.newPassword")
    }</label>
              <ds-input id="input-new-pwd" type="password" placeholder="••••••••"></ds-input>
            </div>
            <div>
              <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
      t("settings.confirmNewPassword")
    }</label>
              <ds-input id="input-confirm-pwd" type="password" placeholder="••••••••"></ds-input>
            </div>
            <div style="margin-top: var(--space-2);">
              <ds-button id="btn-update-pwd">${t("settings.savePassword")}</ds-button>
            </div>
          </div>
        </ds-card>

        <ds-card>
          <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-4);">${
      t("settings.systemInfo")
    }</div>
          <div style="display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--text-sm);">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2);">
              <span style="color: var(--color-fg-muted);">${t("settings.appVersion")}</span>
              <span style="font-weight: 500;">v1.0.0</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2);">
              <span style="color: var(--color-fg-muted);">${t("settings.runtime")}</span>
              <span style="font-weight: 500;">Deno / Native Web Components</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--color-fg-muted);">${t("settings.storageEngine")}</span>
              <span style="font-weight: 500;">SQLite / LibSQL / D1</span>
            </div>
          </div>
        </ds-card>
      </div>
    `;

    container.querySelector("#btn-update-pwd")?.addEventListener("click", async () => {
      const pwd = container.querySelector("#input-new-pwd").value;
      const confirm = container.querySelector("#input-confirm-pwd").value;

      if (!pwd) {
        toast.error("请输入新密码");
        return;
      }
      if (pwd !== confirm) {
        toast.error("两次输入的密码不一致");
        return;
      }

      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers,
        body: JSON.stringify({ newPassword: pwd }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("密码更新成功！");
        container.querySelector("#input-new-pwd").value = "";
        container.querySelector("#input-confirm-pwd").value = "";
      } else {
        toast.error(data.error?.message || "更新失败");
      }
    });
  },

  unmount() {},
};
