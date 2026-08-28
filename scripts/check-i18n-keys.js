#!/usr/bin/env -S deno run --allow-read

const ROOT = new URL("../apps/web/src", import.meta.url).pathname;

function extractLeafKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...extractLeafKeys(v, fullKey));
    } else {
      keys.push({ key: fullKey, value: v });
    }
  }
  return keys;
}

async function checkI18nDir(dirPath) {
  const locales = ["zh-CN", "zh-TW", "en"];
  const dicts = {};

  for (const loc of locales) {
    const filePath = `${dirPath}/${loc}.json`;
    try {
      const text = await Deno.readTextFile(filePath);
      dicts[loc] = JSON.parse(text);
    } catch (err) {
      console.error(`[check-i18n-keys] Missing or invalid file: ${filePath} (${err.message})`);
      return false;
    }
  }

  const zhCNKeys = extractLeafKeys(dicts["zh-CN"]);
  const zhTWKeys = extractLeafKeys(dicts["zh-TW"]);
  const enKeys = extractLeafKeys(dicts["en"]);

  const zhCNSet = new Set(zhCNKeys.map((k) => k.key));
  const zhTWSet = new Set(zhTWKeys.map((k) => k.key));
  const enSet = new Set(enKeys.map((k) => k.key));

  let passed = true;

  // Check differences
  for (const k of zhCNSet) {
    if (!zhTWSet.has(k)) {
      console.error(`[check-i18n-keys] Missing key in zh-TW: ${k} (in ${dirPath})`);
      passed = false;
    }
    if (!enSet.has(k)) {
      console.error(`[check-i18n-keys] Missing key in en: ${k} (in ${dirPath})`);
      passed = false;
    }
  }

  for (const k of zhTWSet) {
    if (!zhCNSet.has(k)) {
      console.error(`[check-i18n-keys] Extra key in zh-TW not in zh-CN: ${k} (in ${dirPath})`);
      passed = false;
    }
  }

  for (const k of enSet) {
    if (!zhCNSet.has(k)) {
      console.error(`[check-i18n-keys] Extra key in en not in zh-CN: ${k} (in ${dirPath})`);
      passed = false;
    }
  }

  // Check empty values
  for (const { key, value } of [...zhCNKeys, ...zhTWKeys, ...enKeys]) {
    if (typeof value === "string" && value.trim() === "") {
      console.error(`[check-i18n-keys] Empty translation value for key: ${key} (in ${dirPath})`);
      passed = false;
    }
  }

  return passed;
}

const targetDirs = [`${ROOT}/shared/i18n`];

// Also discover modules
try {
  const modulesDir = `${ROOT}/modules`;
  for await (const entry of Deno.readDir(modulesDir)) {
    if (entry.isDirectory) {
      const i18nDir = `${modulesDir}/${entry.name}/i18n`;
      try {
        const stat = await Deno.stat(i18nDir);
        if (stat.isDirectory) {
          targetDirs.push(i18nDir);
        }
      } catch {
        // No i18n in this module
      }
    }
  }
} catch {
  // Modules not created yet
}

let allOk = true;
for (const dir of targetDirs) {
  const ok = await checkI18nDir(dir);
  if (!ok) allOk = false;
}

if (allOk) {
  console.log(
    `[check-i18n-keys] Passed: All ${targetDirs.length} i18n dictionaries are consistent.`,
  );
  Deno.exit(0);
} else {
  console.error("[check-i18n-keys] Failed: Inconsistencies found in i18n dictionaries.");
  Deno.exit(1);
}
