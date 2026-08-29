// apps/web/tests/unit/lib/styles.test.js — 页面样式注入（ensurePageStyles）
// 以调用方 URL 为基准解析相对 CSS → <link> 注入 document.head（或指定 root）；
// 同一绝对 URL 只注入一次（幂等）。
import { deepStrictEqual as assertEqual } from "node:assert/strict";
import { ensurePageStyles } from "../../../src/shared/lib/styles.js";
import { installDomShim } from "./dom-shim.js";

const BASE = "http://localhost:8787/src/modules/notes/index.js";

// 模块级 injected Set 跨用例共享：每个用例用独特 css 路径，避免污染其它用例的
// 新 head（test 隔离）。
const CSS1 = "./styles/a.css";
const CSS2 = "./styles/b.css";
const CSS3 = "./styles/c.css";

Deno.test("styles: ensurePageStyles 注入 <link> 到 head，返回解析后 URL", () => {
  const shim = installDomShim();
  try {
    const url = ensurePageStyles(BASE, CSS1);
    equalEnds(url, "/styles/a.css");
    const links = shim.document.head.children.filter(
      (c) => c.getAttribute("rel") === "stylesheet",
    );
    assertEqual(links.length, 1);
    assertEqual(links[0].getAttribute("href"), url);
  } finally {
    shim.restore();
  }
});

Deno.test("styles: 同一 URL 幂等（不重复注入）", () => {
  const shim = installDomShim();
  try {
    ensurePageStyles(BASE, CSS2);
    ensurePageStyles(BASE, CSS2);
    const links = shim.document.head.children.filter(
      (c) => c.getAttribute("rel") === "stylesheet",
    );
    assertEqual(links.length, 1);
  } finally {
    shim.restore();
  }
});

Deno.test("styles: 可注入到指定 root（shadow 场景）", () => {
  const shim = installDomShim();
  try {
    const root = shim.document.createElement("div"); // 充当 shadowRoot
    const url = ensurePageStyles(BASE, CSS3, root);
    assertEqual(root.children.length, 1);
    assertEqual(root.children[0].getAttribute("href"), url);
    // head 不受影响（root 单独注入）
    assertEqual(shim.document.head.children.length, 0);
  } finally {
    shim.restore();
  }
});

function equalEnds(str, suffix) {
  assertEqual(str.slice(-suffix.length), suffix);
}
