// scripts/check-i18n-keys.js — 三语字典 key 一致性校验（i18n.md §1）
//
// 扫描范围：apps/web/src/shared/i18n/ 与 apps/web/src/modules/<id>/i18n/。
// 规则：
//   1. 每个 i18n 目录必须三语齐全（zh-CN / zh-TW / en）；
//   2. 三语 key 集合与 zh-CN 完全一致（不允许缺 key / 多 key）；
//   3. 不允许空字符串翻译。
// 经 scripts/run-checks.js 自动接入 `just lint`。

import { walk } from "./_walk.js";

const ROOT = new URL("..", import.meta.url);
const I18N_GLOB_DIRS = [
  "apps/web/src/shared/i18n",
  "apps/web/src/modules",
];
const LOCALES = ["zh-CN", "zh-TW", "en"];

function readJSON(filePath) {
  try {
    return JSON.parse(Deno.readTextFileSync(filePath));
  } catch (err) {
    console.error(
      `[check-i18n-keys] JSON 解析失败: ${filePath}（${err.message}）`,
    );
    return null;
  }
}

function keySet(obj) {
  return new Set(Object.keys(obj));
}

function diffKeys(zhKeys, otherKeys) {
  const missing = [...zhKeys].filter((k) => !otherKeys.has(k));
  const extra = [...otherKeys].filter((k) => !zhKeys.has(k));
  return { missing, extra };
}

let failed = false;
let dirCount = 0;

/** 校验一个 i18n 目录（含三语文件） */
function checkDir(dirPath) {
  const rel = dirPath.replace(ROOT.pathname, "");
  const files = {};
  for (const locale of LOCALES) {
    const fp = `${dirPath}/${locale}.json`;
    try {
      if (!Deno.statSync(fp).isFile) {
        console.error(`[check-i18n-keys] ${rel}/ 缺少 ${locale}.json`);
        failed = true;
        continue;
      }
    } catch {
      console.error(`[check-i18n-keys] ${rel}/ 缺少 ${locale}.json`);
      failed = true;
      continue;
    }
    files[locale] = readJSON(fp);
    if (files[locale] === null) {
      failed = true;
      return;
    }
  }
  if (!files["zh-CN"]) return; // 已报缺文件

  const zh = keySet(files["zh-CN"]);
  for (const locale of ["zh-TW", "en"]) {
    const other = keySet(files[locale]);
    const { missing, extra } = diffKeys(zh, other);
    if (missing.length || extra.length) {
      failed = true;
      console.error(
        `[check-i18n-keys] ${rel}/ 的 ${locale} key 集合与 zh-CN 不一致：` +
          (missing.length ? `缺 ${missing.join(",")}；` : "") +
          (extra.length ? `多 ${extra.join(",")}` : ""),
      );
    }
  }
  // 空翻译检查（三语都不允许空值）
  for (const locale of LOCALES) {
    for (const [k, v] of Object.entries(files[locale])) {
      if (typeof v !== "string" || v.trim() === "") {
        console.error(
          `[check-i18n-keys] ${rel}/${locale}.json 的 "${k}" 为空翻译`,
        );
        failed = true;
      }
    }
  }
  dirCount += 1;
}

// 1) shared/i18n
const sharedDir = new URL(`${I18N_GLOB_DIRS[0]}`, ROOT).pathname;
checkDir(sharedDir);

// 2) modules/<id>/i18n —— 有 module.json 的模块必须三语齐全（AGENTS.md 强制）
const modulesRoot = new URL(`${I18N_GLOB_DIRS[1]}/`, ROOT).pathname;
let modulesEntries = [];
try {
  modulesEntries = [...Deno.readDirSync(modulesRoot)];
} catch {
  modulesEntries = []; // 模块目录缺失（全新仓库）时不视为失败
}
for (const entry of modulesEntries) {
  if (!entry.isDirectory) continue;
  const hasManifest =
    Deno.statSync(`${modulesRoot}/${entry.name}/module.json`).isFile;
  const i18nDir = `${modulesRoot}${entry.name}/i18n`;
  if (!hasManifest) continue;
  try {
    if (!Deno.statSync(i18nDir).isDirectory) {
      console.error(
        `[check-i18n-keys] 模块 ${entry.name} 缺 i18n/ 三语字典（module.json 存在）`,
      );
      failed = true;
      continue;
    }
    checkDir(i18nDir);
  } catch {
    console.error(
      `[check-i18n-keys] 模块 ${entry.name} 缺 i18n/ 三语字典（module.json 存在）`,
    );
    failed = true;
  }
}

if (failed) {
  console.error(
    "[check-i18n-keys] 存在三语字典问题（key 集合不一致/空翻译/缺文件），修复后再提交",
  );
  Deno.exit(1);
}
console.log(`[check-i18n-keys] ${dirCount} 个字典目录三语 key 全部对齐`);
