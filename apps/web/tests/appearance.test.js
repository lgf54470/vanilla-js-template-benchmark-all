/**
 * appearance.js 纯逻辑单测（docs/Testing.md：纯函数直测，不启浏览器）。
 * DOM 相关的 applyAppearance/initAppearance 由 M7 CDP 冒烟覆盖。
 */
import { strict } from "node:assert";
import {
  BASE_COLOR_NAMES,
  CHART_COLOR_NAMES,
  DEFAULT_APPEARANCE,
  fontStack,
  normalizeAppearance,
  RADIUS_STEPS,
  resolveDark,
} from "../src/shared/lib/appearance.js";

Deno.test("normalizeAppearance：空输入回落默认值", () => {
  strict.deepEqual(normalizeAppearance(undefined), DEFAULT_APPEARANCE);
  strict.deepEqual(normalizeAppearance({}), DEFAULT_APPEARANCE);
});

Deno.test("normalizeAppearance：非法值逐项回落", () => {
  const out = normalizeAppearance({
    theme: "blue",
    style: "nope",
    baseColor: "cyan",
    chartColor: "magenta",
    radius: "giant",
    fontBody: "Comic Sans",
    fontHeading: "Comic Sans",
    menu: "fancy",
  });
  strict.equal(out.theme, "system");
  strict.equal(out.style, "nova");
  strict.equal(out.baseColor, "zinc");
  strict.equal(out.chartColor, "zinc");
  strict.equal(out.radius, RADIUS_STEPS.medium);
  strict.equal(out.fontBody, "Inter Variable");
  strict.equal(out.fontHeading, "Inter Variable");
  strict.equal(out.menu, "subtle");
});

Deno.test("normalizeAppearance：合法值透传 + radius 档位名映射", () => {
  const out = normalizeAppearance({
    theme: "dark",
    style: "lyra",
    baseColor: "violet",
    chartColor: "teal",
    radius: "large",
    fontBody: "Geist Variable",
    fontHeading: "Manrope Variable",
    menu: "inverted",
  });
  strict.equal(out.theme, "dark");
  strict.equal(out.style, "lyra");
  strict.equal(out.baseColor, "violet");
  strict.equal(out.chartColor, "teal");
  strict.equal(out.radius, RADIUS_STEPS.large);
  strict.equal(out.fontBody, "Geist Variable");
  strict.equal(out.fontHeading, "Manrope Variable");
  strict.equal(out.menu, "inverted");
});

Deno.test("resolveDark：light/dark 直判，system 跟随 matchMedia", () => {
  strict.equal(resolveDark("light"), false);
  strict.equal(resolveDark("dark"), true);
  // 无 matchMedia 环境下 system 安全回落 false
  strict.equal(resolveDark("system"), false);
});

Deno.test("色板清单：chart 为 base 超集且总数符合文档（7 基色 + 12 图表色）", () => {
  strict.equal(BASE_COLOR_NAMES.length, 7);
  strict.equal(CHART_COLOR_NAMES.length, 12);
  for (const name of BASE_COLOR_NAMES) {
    strict.ok(CHART_COLOR_NAMES.includes(name), `chart 应包含基色 ${name}`);
  }
});

Deno.test("fontStack：所选字体在前且保留 CJK 兜底", () => {
  const stack = fontStack("Manrope Variable");
  strict.ok(stack.startsWith('"Manrope Variable"'));
  strict.ok(stack.includes("PingFang SC"));
  strict.ok(stack.endsWith("sans-serif"));
});
