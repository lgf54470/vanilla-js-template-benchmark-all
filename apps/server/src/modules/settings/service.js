// apps/server/src/modules/settings/service.js — 设置业务逻辑
//
// 只做校验与组装，SQL 一律不出现（repository 层负责存取）。敏感字段按
// Database.md §5.1 清单在 repository 层加密，业务层不接触加解密细节。

import { hashPassword, verifyPassword } from "../../shared/crypto/password.js";
import { createLogger } from "../../shared/logger/logger.js";

const log = createLogger({ module: "settings", component: "SettingsService" });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createSettingsService({ repo }) {
  function getProfile() {
    return repo.getProfile();
  }

  async function updateProfile(patch) {
    const current = await repo.getProfile();
    const next = {
      ...current,
      ...pick(patch, ["nickname", "avatar"]),
    };
    if (typeof next.nickname !== "string") next.nickname = "";
    if (typeof next.avatar !== "string") next.avatar = null;
    await repo.setProfile(next);
    return next;
  }

  function getDisplay() {
    return repo.getDisplay();
  }

  async function updateDisplay(patch) {
    const current = await repo.getDisplay();
    const next = {
      ...current,
      ...pick(patch, ["locale"]),
    };
    if (typeof next.locale !== "string" || !next.locale) next.locale = null;
    await repo.setDisplay(next);
    return next;
  }

  async function getAccount() {
    const account = await repo.getAccount();
    return account;
  }

  async function updateAccount(patch) {
    const current = await repo.getAccount();
    const next = {
      ...current,
      ...pick(patch, ["email", "phone", "name"]),
    };
    // 留空即清除；非空则做基本格式校验（邮箱）
    if (next.email && !EMAIL_RE.test(next.email)) {
      const err = new Error("VALIDATION_EMAIL");
      err.code = "VALIDATION_ERROR";
      throw err;
    }
    await repo.setAccount(next);
    return next;
  }

  async function changePassword(currentPassword, nextPassword) {
    if (typeof nextPassword !== "string" || nextPassword.length < 8) {
      const err = new Error("密码长度至少 8 位");
      err.code = "VALIDATION_ERROR";
      throw err;
    }
    const auth = await repo.getAuth();
    if (!auth?.passwordHash) {
      const err = new Error("AUTH_NOT_CONFIGURED");
      err.code = "INTERNAL_ERROR";
      throw err;
    }
    const ok = await verifyPassword(currentPassword, auth.passwordHash);
    if (!ok) {
      const err = new Error("当前密码不正确");
      err.code = "AUTH_INVALID_PASSWORD";
      throw err;
    }
    const passwordHash = await hashPassword(nextPassword);
    await repo.setAuth({ ...auth, passwordHash });
    log.info("password changed");
    return { ok: true };
  }

  return {
    getProfile,
    updateProfile,
    getDisplay,
    updateDisplay,
    getAccount,
    updateAccount,
    changePassword,
  };
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (obj && typeof obj[k] !== "undefined") out[k] = obj[k];
  }
  return out;
}
