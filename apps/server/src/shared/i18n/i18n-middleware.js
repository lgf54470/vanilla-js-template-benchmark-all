// apps/server/src/shared/i18n/i18n-middleware.js — Accept-Language 兜底中间件
//
// 中间件链第 5 环（ARCHITECTURE.md §8）：解析 Accept-Language 到受支持 locale，
// 存入 c.set('locale')，供需要按语言返回文案的后端端点使用。前端实际语言由
// pref:locale 决定（i18n.md），此处只是服务端兜底默认值。

import { DEFAULT_LOCALE } from "../../../../../packages/contracts/constants.js";

/** @param {string | null | undefined} header */
export function resolveLocaleFromHeader(header) {
  if (!header) return DEFAULT_LOCALE;
  if (header.includes("zh-TW") || header.includes("zh-Hant")) return "zh-TW";
  if (header.includes("zh")) return "zh-CN";
  if (header.includes("en")) return "en";
  return DEFAULT_LOCALE;
}

export function createI18nMiddleware() {
  return (c, next) => {
    c.set("locale", resolveLocaleFromHeader(c.req.header("Accept-Language")));
    return next();
  };
}
