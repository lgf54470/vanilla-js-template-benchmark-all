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
  setBaseColor("blue");
  assert.strictEqual(getBaseColor(), "blue");
  setBaseColor("violet");
  assert.strictEqual(getBaseColor(), "violet");
  setBaseColor("invalid-color");
  assert.strictEqual(getBaseColor(), "violet"); // Should not change on invalid
});

Deno.test("appearance: get/set style", () => {
  setStyle("luma");
  assert.strictEqual(getStyle(), "luma");
  setStyle("nova");
  assert.strictEqual(getStyle(), "nova");
});

Deno.test("appearance: get/set chart color", () => {
  setChartColor("chart-3");
  assert.strictEqual(getChartColor(), "chart-3");
});

Deno.test("appearance: get/set radius", () => {
  setRadius("0.75rem");
  assert.strictEqual(getRadius(), "0.75rem");
});
