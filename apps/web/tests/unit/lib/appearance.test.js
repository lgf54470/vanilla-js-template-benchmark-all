// apps/web/tests/unit/lib/appearance.test.js — 外观引擎（ARCHITECTURE.md §6.3）
// createAppearance 在 <html> 上维护 style-/base-/chart-/menu- 类、.dark、
// data-theme 与 --radius/--font-* 内联变量，偏好经 localStorage（pref:*）持久化。
// 用 installDomShim 注入 localStorage + documentElement 桩。
import { deepStrictEqual as assertEqual } from "node:assert/strict";
import { STORAGE_KEYS } from "@contracts/constants.js";
import { createAppearance } from "../../../src/shared/lib/appearance.js";
import { installDomShim } from "./dom-shim.js";

function setup(opts = {}) {
  const shim = installDomShim(opts);
  // Deno 的 globalThis.localStorage 虚拟化不可覆写，必须显式注入 storage/doc
  const app = createAppearance({ storage: shim.storage, doc: shim.document });
  return { shim, app, el: shim.documentElement };
}

Deno.test("appearance: 默认 system/light 挂 style-/base-/chart-/menu- 类与 data-theme", () => {
  const { shim, app, el } = setup({ darkMedia: false });
  try {
    void app;
    assertEqual(el.classList.contains("style-nova"), true);
    assertEqual(el.classList.contains("base-zinc"), true);
    assertEqual(el.classList.contains("chart-zinc"), true);
    assertEqual(el.classList.contains("menu-default"), true);
    assertEqual(el.classList.contains("dark"), false);
    assertEqual(el.dataset.sidebarVariant, "sidebar");
    assertEqual(el.dataset.sidebarCollapsible, "icon");
  } finally {
    shim.restore();
  }
});

Deno.test("appearance: setTheme('dark') 挂 .dark + data-theme 并持久化 pref:theme", () => {
  const { shim, app, el } = setup();
  try {
    app.setTheme("dark");
    assertEqual(el.classList.contains("dark"), true);
    assertEqual(el.getAttribute("data-theme"), "dark");
    assertEqual(shim.storage.getItem(STORAGE_KEYS.THEME), "dark");
  } finally {
    shim.restore();
  }
});

Deno.test("appearance: setRadius/setFontSans 写内联变量与 pref", () => {
  const { shim, app, el } = setup();
  try {
    app.setRadius(16);
    app.setFontSans("Manrope Variable");
    assertEqual(el.style.getPropertyValue("--radius"), "16px");
    assertEqual(
      el.style.getPropertyValue("--font-sans-base"),
      "Manrope Variable, system-ui, sans-serif",
    );
    assertEqual(shim.storage.getItem(STORAGE_KEYS.RADIUS), "16");
    assertEqual(
      shim.storage.getItem(STORAGE_KEYS.FONT_SANS),
      "Manrope Variable",
    );
  } finally {
    shim.restore();
  }
});

Deno.test("appearance: on() 订阅快照含 dark 推导，可退订", () => {
  const { shim, app } = setup({ darkMedia: true });
  try {
    const seen = [];
    const unsub = app.on((s) => seen.push(s));
    app.setTheme("system");
    app.setBase("blue");
    assertEqual(seen.length >= 1, true);
    // darkMedia=true + theme=system → dark 推导 true
    assertEqual(seen.at(-1).dark, true);
    assertEqual(seen.at(-1).base, "blue");
    unsub();
    const before = seen.length;
    app.setChart("red");
    assertEqual(seen.length, before);
  } finally {
    shim.restore();
  }
});

Deno.test("appearance: load() 读持久化偏好；非法 radius 回退默认", () => {
  const { shim, app } = setup({
    store: {
      [STORAGE_KEYS.SIDEBAR_OPEN]: "false",
      [STORAGE_KEYS.RADIUS]: "999",
    },
  });
  try {
    const s = app.getState();
    assertEqual(s.sidebarOpen, false); // 读到 pref
    assertEqual(s.radius, 10); // 999 越界（4..24）→ 回退默认
  } finally {
    shim.restore();
  }
});
