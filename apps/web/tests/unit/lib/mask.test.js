// apps/web/tests/unit/lib/mask.test.js — 敏感字段掩码（Database.md §5.3）
import { deepStrictEqual as assertEqual } from "node:assert/strict";
import { maskValue } from "../../../src/shared/lib/mask.js";

Deno.test("mask: 邮箱 local 全掩，域名首尾保留、tld 保留", () => {
  assertEqual(maskValue("user@example.com", "email"), "****@e*****e.com");
  assertEqual(maskValue("a@b.co", "email"), "*@*.co");
  // 无 @ → 降级 generic
  assertEqual(maskValue("plain", "email"), "p***n");
});

Deno.test("mask: 手机前3后4、中间补*, 短号全掩", () => {
  assertEqual(maskValue("13812345678", "phone"), "138****5678");
  assertEqual(maskValue("1234", "phone"), "****");
  // 空值原样返回
  assertEqual(maskValue("", "phone"), "");
});

Deno.test("mask: generic 首尾各留 keep 个字符", () => {
  assertEqual(maskValue("token-abc-123", "generic"), "t***********3");
  assertEqual(maskValue("ab", "generic"), "**"); // 太短全掩
});
