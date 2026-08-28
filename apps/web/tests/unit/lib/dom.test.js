import assert from "node:assert/strict";
import { isComposedClickInside, waitForTransition } from "../../../src/shared/lib/dom.js";

Deno.test("dom: waitForTransition 瞬时完成 (no-motion)", async () => {
  const start = Date.now();
  await waitForTransition(null, 0);
  const elapsed = Date.now() - start;
  assert.strictEqual(elapsed < 50, true);
});

Deno.test("dom: isComposedClickInside 判断点击目标", () => {
  const target = {};
  const event = {
    composedPath: () => [target],
  };
  assert.strictEqual(isComposedClickInside(event, target), true);
  assert.strictEqual(isComposedClickInside(event, {}), false);
});
