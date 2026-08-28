// apps/server/src/modules/settings/repository.js — settings 模块的数据存取
//
// 本模块拥有 app_settings 的 settings:* 与 accounts:* 命名空间（Database.md
// §1.1）。SQL 统一经 shared/settings/app-settings.js 封装（该封装是唯一允许跨
// 模块调用 app_settings 的入口），本文件负责命名空间键、加密标记与默认值，
// 不直接拼 SQL。

export const SETTINGS_KEYS = Object.freeze({
  PROFILE: "settings:profile",
  DISPLAY: "settings:display",
  ACCOUNT: "settings:account",
  AUTH: "settings:auth",
  AUTH_LOCKOUT: "settings:auth-lockout",
});

/**
 * @param {import("../../shared/settings/app-settings.js").AppSettingsStore} store
 */
export function createSettingsRepository(store) {
  return {
    // ---- 展示资料（settings:profile，非敏感） ----
    async getProfile() {
      const value = await store.get(SETTINGS_KEYS.PROFILE);
      return value ?? { nickname: "", avatar: null };
    },
    async setProfile(profile) {
      await store.set(SETTINGS_KEYS.PROFILE, profile);
    },

    // ---- 显示配置（settings:display，非敏感） ----
    async getDisplay() {
      const value = await store.get(SETTINGS_KEYS.DISPLAY);
      return value ?? { locale: null };
    },
    async setDisplay(display) {
      await store.set(SETTINGS_KEYS.DISPLAY, display);
    },

    // ---- 敏感联系方式（settings:account，加密存储，Database.md §5.1） ----
    async getAccount() {
      const value = await store.get(SETTINGS_KEYS.ACCOUNT); // is_encrypted 列驱动自动解密
      return value ?? { email: "", phone: "", name: "" };
    },
    async setAccount(account) {
      await store.set(SETTINGS_KEYS.ACCOUNT, account, { encrypt: true });
    },

    // ---- 鉴权（settings:auth，本模块提供修改密码能力；读由 auth 中间件做） ----
    async getAuth() {
      const raw = await store.getRaw(SETTINGS_KEYS.AUTH);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    async setAuth(auth) {
      await store.set(SETTINGS_KEYS.AUTH, auth);
    },
  };
}
