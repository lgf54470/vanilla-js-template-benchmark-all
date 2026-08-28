// apps/web/src/modules/settings/index.js — 设置模块（M6）
//
// 子路由 /settings/profile 与 /settings/account（module.json submodules）由壳层
// 路由重挂本模块；本模块 mount 时读 location.hash 决定显示哪个分页。标签页互切
// 走 ctx.navigate（触发壳层重挂）。数据接 M2 的 /api/settings/{profile,account,
// password}。敏感字段（邮箱/手机）前端 maskValue 掩码显示（硬规则 9）。

import { registerModuleI18n } from "../../shared/lib/module-i18n.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";
import { maskValue } from "../../shared/lib/mask.js";
import { toast } from "../../shared/ui/toast/toast.js";
import { emit } from "../../shared/core/event-bus.js";

registerModuleI18n(import.meta.url);

export function mount(container, ctx) {
  ensurePageStyles(import.meta.url, "./styles/settings.css");
  const { t, http, navigate } = ctx;

  const hash = location.hash.replace(/^#/, "");
  const tab = hash.includes("/account") ? "account" : "profile";

  container.innerHTML = `
    <div class="page-container">
      <header class="settings-header">
        <h1 class="settings-title">${t("settings.menu.title")}</h1>
        <p class="settings-subtitle">${t("settings.page.subtitle")}</p>
      </header>
      <nav class="settings-nav">
        <button type="button" class="settings-tab" data-tab="profile"
          aria-current="${tab === "profile" ? "true" : "false"}">${
    t("settings.menu.profile")
  }</button>
        <button type="button" class="settings-tab" data-tab="account"
          aria-current="${tab === "account" ? "true" : "false"}">${
    t("settings.menu.account")
  }</button>
      </nav>
      <section id="settings-body"></section>
    </div>`;

  const body = container.querySelector("#settings-body");
  const tabs = container.querySelectorAll(".settings-tab");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab === "account"
        ? "/settings/account"
        : "/settings/profile";
      navigate(target);
    });
  });

  if (tab === "profile") renderProfile();
  else renderAccount();

  // profile / account 表单
  function renderProfile() {
    body.innerHTML = `
      <div class="settings-card">
        <h2 class="settings-title" style="font-size:1.05rem">${
      t("settings.profile.title")
    }</h2>
        <div class="settings-field">
          <span class="settings-field-label">${
      t("settings.profile.nickname")
    }</span>
          <ds-input id="nickname"></ds-input>
          <span class="settings-field-hint">${
      t("settings.profile.nicknameHint")
    }</span>
        </div>
        <div class="settings-actions">
          <ds-button variant="primary" id="save-profile">${
      t("settings.action.save")
    }</ds-button>
        </div>
      </div>`;
    const nickname = container.querySelector("#nickname");
    const saveBtn = container.querySelector("#save-profile");
    const saveLabel = t("settings.action.save");
    const savingLabel = t("settings.action.saving");

    loadProfile().then((profile) => {
      nickname.setAttribute("value", profile?.nickname ?? "");
    }).catch(() => toast.error(t("settings.error.loadFailed")));

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = savingLabel;
      try {
        await http("/api/settings/profile", {
          method: "PUT",
          body: { nickname: nickname.getAttribute("value") ?? "" },
        });
        emit("user:updated"); // 通知壳层刷新 nav-user
        toast.success(t("settings.toast.profileSaved"));
      } catch (err) {
        toast.error(err?.message ?? t("settings.error.loadFailed"));
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = saveLabel;
      }
    });
  }

  function renderAccount() {
    body.innerHTML = `
      <div class="settings-card">
        <h2 class="settings-title" style="font-size:1.05rem">${
      t("settings.account.title")
    }</h2>
        <div class="settings-field">
          <span class="settings-field-label">${
      t("settings.account.name")
    }</span>
          <ds-input id="account-name"></ds-input>
        </div>
        <div class="settings-field">
          <span class="settings-field-label">${
      t("settings.account.email")
    }</span>
          <ds-input id="account-email" readonly></ds-input>
        </div>
        <div class="settings-field">
          <span class="settings-field-label">${
      t("settings.account.phone")
    }</span>
          <ds-input id="account-phone" readonly></ds-input>
        </div>
        <span class="settings-field-hint">${
      t("settings.account.sensitiveHint")
    }</span>
        <div class="settings-actions">
          <ds-button variant="primary" id="save-account">${
      t("settings.action.save")
    }</ds-button>
        </div>
      </div>
      <div style="block-size:var(--space-5)"></div>
      <div class="settings-card">
        <h2 class="settings-title" style="font-size:1.05rem">${
      t("settings.security.title")
    }</h2>
        <div class="settings-field">
          <span class="settings-field-label">${
      t("settings.security.currentPassword")
    }</span>
          <ds-input type="password" id="pwd-current" autocomplete="current-password"></ds-input>
        </div>
        <div class="settings-field">
          <span class="settings-field-label">${
      t("settings.security.newPassword")
    }</span>
          <ds-input type="password" id="pwd-next" autocomplete="new-password"></ds-input>
          <span class="settings-field-hint">${
      t("settings.security.newPasswordHint")
    }</span>
        </div>
        <div class="settings-actions">
          <ds-button variant="primary" id="change-password">${
      t("settings.action.changePassword")
    }</ds-button>
        </div>
      </div>`;

    const nameIn = container.querySelector("#account-name");
    const emailIn = container.querySelector("#account-email");
    const phoneIn = container.querySelector("#account-phone");
    const saveAccount = container.querySelector("#save-account");
    const pwdCurrent = container.querySelector("#pwd-current");
    const pwdNext = container.querySelector("#pwd-next");
    const changePwd = container.querySelector("#change-password");
    const saveAccountLabel = t("settings.action.save");
    const savingLabel = t("settings.action.saving");

    // 载入账户：邮箱/手机掩码显示（敏感，只读确认）
    http("/api/settings/account").then((account) => {
      nameIn.setAttribute("value", account?.name ?? "");
      if (account?.email) {
        emailIn.setAttribute("value", maskValue(account.email, "email"));
      }
      if (account?.phone) {
        phoneIn.setAttribute("value", maskValue(account.phone, "phone"));
      }
    }).catch(() => toast.error(t("settings.error.loadFailed")));

    saveAccount.addEventListener("click", async () => {
      saveAccount.disabled = true;
      saveAccount.textContent = savingLabel;
      try {
        await http("/api/settings/account", {
          method: "PUT",
          body: { name: nameIn.getAttribute("value") ?? "" },
        });
        toast.success(t("settings.toast.accountSaved"));
      } catch (err) {
        toast.error(err?.message ?? t("settings.error.loadFailed"));
      } finally {
        saveAccount.disabled = false;
        saveAccount.textContent = saveAccountLabel;
      }
    });

    changePwd.addEventListener("click", async () => {
      changePwd.disabled = true;
      try {
        await http("/api/settings/password", {
          method: "PUT",
          body: {
            currentPassword: pwdCurrent.getAttribute("value") ?? "",
            nextPassword: pwdNext.getAttribute("value") ?? "",
          },
        });
        toast.success(t("settings.toast.passwordChanged"));
        pwdCurrent.removeAttribute("value");
        pwdNext.removeAttribute("value");
      } catch (err) {
        toast.error(err?.message ?? t("settings.error.loadFailed"));
      } finally {
        changePwd.disabled = false;
      }
    });
  }

  // 辅助：读 profile
  function loadProfile() {
    return http("/api/settings/profile");
  }
}
