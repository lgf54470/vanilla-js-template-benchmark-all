#!/usr/bin/env deno run -A
/**
 * check-i18n-keys.js — 三语字典一致性校验（docs/i18n.md §1）。
 *
 * 校验 shared/i18n 与各模块 i18n 目录下每种语言文件：
 * 1. 三语（zh-CN/zh-TW/en）文件必须齐全；
 * 2. zh-TW / en 的 key 集合与 zh-CN 完全一致（缺失/多余都报错）；
 * 3. 不允许空翻译（空字符串）。
 */

const LOCALES = ["zh-CN", "zh-TW", "en"];
const WEB_SRC = import.meta.dirname + "/../apps/web/src";
const SHARED_I18N = WEB_SRC + "/shared/i18n";

/** @type {Array<{ label: string, dir: string }>} 待校验的字典目录 */
const groups = [{ label: "shared/i18n", dir: SHARED_I18N }];

for await (const entry of Deno.readDir(WEB_SRC + "/modules")) {
  if (!entry.isDirectory) continue;
  const dir = WEB_SRC + "/modules/" + entry.name + "/i18n";
  try {
    await Deno.stat(dir);
    groups.push({ label: "modules/" + entry.name + "/i18n", dir });
  } catch {
    /* 该模块无 i18n 目录（纯展示模块可不建） */
  }
}

const violations = [];

for (const { label, dir } of groups) {
  const dicts = {};
  for (const locale of LOCALES) {
    const path = dir + "/" + locale + ".json";
    try {
      dicts[locale] = JSON.parse(await Deno.readTextFile(path));
    } catch {
      violations.push(`${label}: 缺少 ${locale}.json（三语必须齐全）`);
      dicts[locale] = null;
    }
  }
  const base = dicts["zh-CN"];
  if (!base) continue;
  const baseKeys = new Set(Object.keys(base));

  for (const key of baseKeys) {
    if (String(base[key]).trim() === "") {
      violations.push(`${label}: zh-CN 空翻译 "${key}"`);
    }
  }

  for (const locale of ["zh-TW", "en"]) {
    const dict = dicts[locale];
    if (!dict) continue;
    const keys = new Set(Object.keys(dict));
    for (const key of baseKeys) {
      if (!keys.has(key)) {
        violations.push(`${label}: ${locale} 缺少 key "${key}"`);
      } else if (String(dict[key]).trim() === "") {
        violations.push(`${label}: ${locale} 空翻译 "${key}"`);
      }
    }
    for (const key of keys) {
      if (!baseKeys.has(key)) {
        violations.push(
          `${label}: ${locale} 多余 key "${key}"（zh-CN 无此键）`,
        );
      }
    }
  }
}

if (violations.length > 0) {
  console.error("check-i18n-keys: " + violations.length + " 处违规");
  for (const v of violations) console.error("  " + v);
  Deno.exit(1);
}
console.log("check-i18n-keys: OK");
