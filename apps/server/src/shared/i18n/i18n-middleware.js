/**
 * shared/i18n/i18n-middleware.js — Accept-Language 兜底解析（ARCHITECTURE.md §8）。
 * 输出 zh-CN / zh-TW / en 三值之一，默认 zh-CN；供下游本地化响应文案使用。
 */
const SUPPORTED = ["zh-CN", "zh-TW", "en"];
const DEFAULT_LOCALE = "zh-CN";

function pickLocale(header) {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header.split(",").map((part) => {
    const [tag, ...params] = part.trim().split(";");
    const q = params.find((p) => p.trim().startsWith("q="));
    return {
      tag: tag.trim().toLowerCase(),
      q: q ? Number(q.split("=")[1]) : 1,
    };
  }).sort((a, b) => b.q - a.q);
  for (const { tag } of candidates) {
    if (
      tag.startsWith("zh") &&
      (tag.includes("tw") || tag.includes("hk") || tag.includes("hant"))
    ) {
      return "zh-TW";
    }
    if (tag.startsWith("zh")) return "zh-CN";
    if (tag.startsWith("en")) return "en";
    const exact = SUPPORTED.find((s) => s.toLowerCase() === tag);
    if (exact) return exact;
  }
  return DEFAULT_LOCALE;
}

export function i18nMiddleware(c, next) {
  c.set("locale", pickLocale(c.req.header("accept-language")));
  return next();
}
