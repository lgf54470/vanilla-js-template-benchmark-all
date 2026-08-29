// apps/web/tests/unit/lib/icons.test.js — 图标 sprite 辅助（Design.md §5）
// iconEl 生成 SVG <use href="/icons.svg#i-<name>">（简易 DOM 桩：
// createElementNS / setAttribute / append）。
import { deepStrictEqual as assertEqual } from "node:assert/strict";
import { iconEl, iconSvg } from "../../../src/shared/lib/icons.js";
import { El, installDomShim } from "./dom-shim.js";

Deno.test("iconEl: 生成 24 viewBox 的 svg + use sprite 引用", () => {
  const shim = installDomShim();
  try {
    const svg = iconEl("sun", { size: 20, class: "icon-sun" });
    assertEqual(svg instanceof El, true);
    assertEqual(svg.getAttribute("width"), "20");
    assertEqual(svg.getAttribute("viewBox"), "0 0 24 24");
    assertEqual(svg.getAttribute("aria-hidden"), "true");
    assertEqual(svg.classList.contains("icon-sun"), true);
    const use = svg.children.find((c) => c.tagName === "USE");
    assertEqual(use.getAttribute("href"), "/icons.svg#i-sun");
  } finally {
    shim.restore();
  }
});

Deno.test("iconSvg: 返回内联模板字符串，引用同源 sprite", () => {
  const html = iconSvg("home", 16);
  assertEqual(html.includes('width="16"'), true);
  assertEqual(html.includes('href="/icons.svg#i-home"'), true);
});
