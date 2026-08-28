import assert from "node:assert/strict";
import { router } from "../../../src/shared/core/router.js";

Deno.test("router: 获取当前模块 ID", () => {
  // Test fallback
  assert.strictEqual(typeof router.getCurrentModuleId(), "string");

  // Test hash with query params
  if (typeof globalThis.window === "undefined") {
    globalThis.window = { location: { hash: "#/components?c=switch" } };
  } else {
    globalThis.window.location = { hash: "#/components?c=switch" };
  }
  assert.strictEqual(router.getCurrentModuleId(), "components");

  globalThis.window.location.hash = "#/dashboard";
  assert.strictEqual(router.getCurrentModuleId(), "dashboard");
});
