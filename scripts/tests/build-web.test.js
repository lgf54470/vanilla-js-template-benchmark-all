// scripts/tests/build-web.test.js — build-web 行为级测试（Deployment.md §2）
// 正向：web 根 + public 静态资源 + packages/contracts 组装进 dist/web，index.html /
// src/main.js / 字体 / contracts 都就位，并生成 MANIFEST.txt；反向：web 根缺
// index.html 时健康检查报错、退出码非 0。
import { deepStrictEqual as assertEqual } from "node:assert/strict";
import {
  readWorkspaceFile,
  runScript,
  withWorkspace,
} from "./helpers/check-runner.js";

const WEB = {
  "apps/web/index.html": "<html><body><div id='app'></div></body></html>\n",
  "apps/web/src/main.js": "import './style.css';\n",
  "apps/web/src/style.css": ":root{--x:1}\n",
  "apps/web/public/favicon.svg": "<svg></svg>\n",
  "apps/web/public/icons.svg": "<svg id='i'></svg>\n",
  "apps/web/public/fonts/Inter-Variable.woff2": "font-bytes",
  "packages/contracts/constants.js": "export const X = 1;\n",
};

function installScript(ws) {
  Deno.mkdirSync(`${ws}/scripts`, { recursive: true });
  Deno.copyFileSync(
    `${import.meta.dirname}/../../scripts/build-web.js`,
    `${ws}/scripts/build-web.js`,
  );
}

Deno.test("build-web：组装 dist/web，关键文件与清单就位", async () => {
  await withWorkspace(WEB, async (ws) => {
    installScript(ws);
    const res = await runScript(ws, [
      "run",
      "--allow-read",
      "--allow-write",
      `${ws}/scripts/build-web.js`,
    ]);
    assertEqual(res.code, 0, res.combined);
    for (
      const rel of [
        "dist/web/index.html",
        "dist/web/src/main.js",
        "dist/web/src/style.css",
        "dist/web/favicon.svg",
        "dist/web/icons.svg",
        "dist/web/fonts/Inter-Variable.woff2",
        "dist/web/packages/contracts/constants.js",
        "dist/web/MANIFEST.txt",
      ]
    ) {
      assertEqual(
        Deno.statSync(`${ws}/${rel}`).isFile,
        true,
        `产物应变存在 ${rel}`,
      );
    }
    // index.html 内容来自 apps/web/index.html（平铺到产物根）
    assertEqual(
      readWorkspaceFile(ws, "dist/web/index.html"),
      WEB["apps/web/index.html"],
    );
    const manifest = readWorkspaceFile(ws, "dist/web/MANIFEST.txt");
    assertEqual(manifest.includes("src/main.js"), true);
    assertEqual(manifest.includes("packages/contracts/constants.js"), true);
  });
});

Deno.test("build-web：缺 index.html 时健康检查报错", async () => {
  const broken = { ...WEB };
  delete broken["apps/web/index.html"];
  await withWorkspace(broken, async (ws) => {
    installScript(ws);
    const res = await runScript(ws, [
      "run",
      "--allow-read",
      "--allow-write",
      `${ws}/scripts/build-web.js`,
    ]);
    assertEqual(res.code, 1, res.combined);
    assertEqual(res.combined.includes("缺关键文件"), true);
  });
});
