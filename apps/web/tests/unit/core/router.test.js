import assert from "node:assert/strict";
import { router } from "../../../src/shared/core/router.js";

Deno.test("router: 获取当前模块 ID", () => {
  // Test fallback
  assert.strictEqual(typeof router.getCurrentModuleId(), "string");
});
