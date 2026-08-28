#!/usr/bin/env deno run -A
/**
 * generate-module-registry.js — 扫描各模块目录的 module.json 生成前端模块清单
 * （ARCHITECTURE §4.2：`import.meta.glob` 等价的手写扫描脚本，避免运行时
 * 目录遍历；产物 registry.generated.js 已入库，仅模块增删时需手动刷新）。
 *
 * 产物：apps/web/src/modules/registry.generated.js
 *   export const MODULE_REGISTRY = [ { id, order, icon, labelKey, route,
 *     submodules: [{ id, labelKey, route }] } ]  // 按 order 升序
 *
 * 校验：id/route 必填且路由以 "/" 开头；order 缺省按 100 处理；
 * 子模块同名校验。任何非法清单直接非零退出。
 */

const MODULES_DIR = new URL("../apps/web/src/modules/", import.meta.url);
const OUT_FILE = new URL("./registry.generated.js", MODULES_DIR);

/** @returns {Promise<string[]>} 含 module.json 的模块目录名 */
async function listModuleDirs() {
  const names = [];
  for await (const entry of Deno.readDir(MODULES_DIR)) {
    if (!entry.isDirectory) continue;
    let hasManifest = false;
    for await (
      const f of Deno.readDir(new URL(`${entry.name}/`, MODULES_DIR))
    ) {
      if (f.name === "module.json") hasManifest = true;
    }
    if (hasManifest) names.push(entry.name);
  }
  return names.sort();
}

/** @param {unknown} v */
function assertString(v, label) {
  if (typeof v !== "string" || v === "") {
    throw new Error(`${label} 必须为非空字符串`);
  }
}

/** 校验并归一化一份 module.json。 */
function normalize(manifest, dir) {
  const id = manifest.id ?? dir;
  assertString(id, `${dir}: id`);
  assertString(manifest.route, `${id}: route`);
  if (!manifest.route.startsWith("/")) {
    throw new Error(`${id}: route 必须以 "/" 开头`);
  }
  assertString(manifest.labelKey, `${id}: labelKey`);
  const submodules = [];
  const subIds = new Set();
  for (const sub of manifest.submodules ?? []) {
    assertString(sub.id, `${id}.submodules: id`);
    if (subIds.has(sub.id)) throw new Error(`${id}: 子模块 ${sub.id} 重复`);
    subIds.add(sub.id);
    assertString(sub.route, `${id}.${sub.id}: route`);
    assertString(sub.labelKey, `${id}.${sub.id}: labelKey`);
    submodules.push({
      id: sub.id,
      labelKey: sub.labelKey,
      route: sub.route,
    });
  }
  return {
    id,
    order: typeof manifest.order === "number" ? manifest.order : 100,
    icon: typeof manifest.icon === "string" ? manifest.icon : "circle",
    labelKey: manifest.labelKey,
    route: manifest.route,
    submodules,
  };
}

const dirs = await listModuleDirs();
const modules = [];
for (const dir of dirs) {
  const manifest = JSON.parse(
    await Deno.readTextFile(new URL(`${dir}/module.json`, MODULES_DIR)),
  );
  modules.push(normalize(manifest, dir));
}
modules.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

const body = `/* eslint-disable */
// 本文件由 scripts/generate-module-registry.js 自动生成（勿手改）。
// 依赖模块清单（ARCHITECTURE §4.2）：侧栏菜单与路由据此装配。

export const MODULE_REGISTRY = ${JSON.stringify(modules, null, 2)};
`;

await Deno.writeTextFile(OUT_FILE, body);
console.log(
  `generate-module-registry: ${modules.length} 个模块 → ${
    new URL(".", OUT_FILE).pathname.split("/").slice(-3)[0]
  }/registry.generated.js`,
);
