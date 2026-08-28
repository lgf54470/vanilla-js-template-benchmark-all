import assert from "node:assert/strict";
import {
  getBaseColor,
  getChartColor,
  getRadius,
  getStyle,
  getTheme,
  setBaseColor,
  setChartColor,
  setRadius,
  setStyle,
  setTheme,
} from "../../../src/shared/lib/appearance.js";

Deno.test("appearance: get/set theme", () => {
  setTheme("dark");
  assert.strictEqual(getTheme(), "dark");
  setTheme("light");
  assert.strictEqual(getTheme(), "light");
  setTheme("system");
  assert.strictEqual(getTheme(), "system");
});

Deno.test("appearance: get/set base color", () => {
  setBaseColor("stone");
  assert.strictEqual(getBaseColor(), "stone");
  setBaseColor("zinc");
  assert.strictEqual(getBaseColor(), "zinc");
  setBaseColor("invalid-color");
  assert.strictEqual(getBaseColor(), "zinc"); // Should not change on invalid
});

Deno.test("appearance: get/set style", () => {
  setStyle("luma");
  assert.strictEqual(getStyle(), "luma");
  setStyle("nova");
  assert.strictEqual(getStyle(), "nova");
});

Deno.test("appearance: get/set chart color", () => {
  setChartColor("amber");
  assert.strictEqual(getChartColor(), "amber");
});

Deno.test("appearance: get/set radius", () => {
  setRadius("lg");
  assert.strictEqual(getRadius(), "lg");
});
