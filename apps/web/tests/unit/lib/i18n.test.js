import assert from "node:assert/strict";
import { getLocale, registerTranslations, setLocale, t } from "../../../src/shared/lib/i18n.js";

Deno.test("i18n: getLocale / setLocale 语言切换", () => {
  setLocale("en");
  assert.strictEqual(getLocale(), "en");
  assert.strictEqual(t("common.save"), "Save");

  setLocale("zh-TW");
  assert.strictEqual(getLocale(), "zh-TW");
  assert.strictEqual(t("common.save"), "儲存");

  setLocale("zh-CN");
  assert.strictEqual(getLocale(), "zh-CN");
  assert.strictEqual(t("common.save"), "保存");
});

Deno.test("i18n: 变量插值与动态命名空间注册", () => {
  registerTranslations("zh-CN", "custom", {
    welcome: "你好，{{name}}！你有 {{count}} 条消息。",
  });

  const msg = t("custom.welcome", { name: "张三", count: 5 });
  assert.strictEqual(msg, "你好，张三！你有 5 条消息。");
});
