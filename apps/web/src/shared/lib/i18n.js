import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@contracts/constants.js";
import { eventBus } from "../core/event-bus.js";
import zhCN from "../i18n/zh-CN.json" with { type: "json" };
import zhTW from "../i18n/zh-TW.json" with { type: "json" };
import en from "../i18n/en.json" with { type: "json" };

const dictionaries = {
  "zh-CN": { ...zhCN },
  "zh-TW": { ...zhTW },
  "en": { ...en },
};

function getStorageLocale() {
  try {
    const val = localStorage.getItem("pref:locale");
    return SUPPORTED_LOCALES.includes(val) ? val : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

let currentLocale = getStorageLocale();

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  currentLocale = locale;
  try {
    localStorage.setItem("pref:locale", locale);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", locale);
    }
  } catch {
    // Ignore
  }
  eventBus.emit("locale:changed", { locale });
}

export function registerTranslations(locale, namespace, translations) {
  if (!dictionaries[locale]) {
    dictionaries[locale] = {};
  }
  dictionaries[locale][namespace] = {
    ...(dictionaries[locale][namespace] || {}),
    ...translations,
  };
}

export function t(key, params = {}) {
  if (!key) return "";
  if (key.startsWith("i18n:")) {
    key = key.slice(5);
  }

  const keys = key.split(".");
  let val = getValueByPath(dictionaries[currentLocale], keys);

  // Fallback to zh-CN if not found
  if (val === undefined && currentLocale !== "zh-CN") {
    val = getValueByPath(dictionaries["zh-CN"], keys);
  }

  if (val === undefined) {
    return key;
  }

  if (typeof val === "string") {
    return val.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, p) => {
      return params[p] !== undefined ? String(params[p]) : `{{${p}}}`;
    });
  }

  return val;
}

function getValueByPath(obj, keys) {
  let current = obj;
  for (const k of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[k];
  }
  return current;
}
