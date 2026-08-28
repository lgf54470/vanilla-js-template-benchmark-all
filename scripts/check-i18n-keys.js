#!/usr/bin/env -S deno run --allow-read
// check-i18n-keys.js — 三语字典一致性（ARCHITECTURE.md §16，docs/i18n.md §1）。
// 对每个 apps/web/src 下的 i18n 字典目录：zh-CN/zh-TW/en 三个 JSON 必须齐全，
// key 集合与 zh-CN 完全一致，且不允许空翻译。

const ROOT = new URL("..", import.meta.url).pathname;
const WEB_SRC = `${ROOT}apps/web/src`;
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);
const REQUIRED_LOCALES = ["zh-CN", "zh-TW", "en"];

async function* walk(dir) {
  let entries;
  try {
    entries = await Array.fromAsync(Deno.readDir(dir));
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(path);
    }
  }
}

function keySet(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === "object") {
      keys.push(...keySet(value, `${prefix}${key}.`));
    } else {
      keys.push(`${prefix}${key}`);
    }
  }
  return keys;
}

export async function run() {
  const name = "check-i18n-keys";
  const messages = [];
  let scanned = 0;

  for await (const dir of walk(WEB_SRC)) {
    if (!dir.endsWith("/i18n")) continue;
    scanned++;
    const relDir = dir.slice(ROOT.length);
    const dictionaries = new Map();
    for (const locale of REQUIRED_LOCALES) {
      try {
        const text = await Deno.readTextFile(`${dir}/${locale}.json`);
        dictionaries.set(locale, JSON.parse(text));
      } catch {
        messages.push(`${relDir}/${locale}.json: 缺失或非法 JSON`);
      }
    }
    if (dictionaries.size < REQUIRED_LOCALES.length) continue;

    const baseKeys = new Set(keySet(dictionaries.get("zh-CN")));
    for (const locale of REQUIRED_LOCALES) {
      const keys = new Set(keySet(dictionaries.get(locale)));
      for (const key of baseKeys) {
        if (!keys.has(key)) {
          messages.push(`${relDir}/${locale}.json: 缺少 key "${key}"`);
        }
      }
      for (const key of keys) {
        if (!baseKeys.has(key)) {
          messages.push(
            `${relDir}/${locale}.json: 多余 key "${key}"（zh-CN 中不存在）`,
          );
        }
      }
    }
    for (const [locale, dict] of dictionaries) {
      for (const key of keySet(dict)) {
        const value = key.split(".").reduce((acc, part) => acc?.[part], dict);
        if (typeof value === "string" && value.trim() === "") {
          messages.push(`${relDir}/${locale}.json: key "${key}" 为空翻译`);
        }
      }
    }
  }

  return { name, ok: messages.length === 0, messages, scanned };
}

if (import.meta.main) {
  const result = await run();
  if (!result.ok) {
    console.error(`[${result.name}]`);
    for (const message of result.messages) console.error(`  ${message}`);
    Deno.exit(1);
  }
}
