import assert from "node:assert/strict";
import { moduleRegistry } from "../../../src/shared/core/module-registry.js";

Deno.test("module-registry: 注册与检索模块", () => {
  moduleRegistry.register({
    id: "test-module",
    title: "测试模块",
    icon: "code",
    order: 10,
  });

  const mod = moduleRegistry.getModule("test-module");
  assert.notStrictEqual(mod, null);
  assert.strictEqual(mod.id, "test-module");
  assert.strictEqual(mod.title, "测试模块");

  const list = moduleRegistry.getModules();
  assert.strictEqual(list.some((m) => m.id === "test-module"), true);
});
