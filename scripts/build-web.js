#!/usr/bin/env deno run -A
/**
 * build-web.js — 组装前端静态产物 dist/web（docs/Deployment.md §2）。
 *
 * 复制 apps/web/*（含 public/）→ dist/web/，再复制 packages/contracts →
 * dist/web/packages/contracts（URL 前缀约定与本地 extraRoots 一致）。
 * 源码即产物，无打包步骤。
 */
const ROOT = import.meta.dirname + "/..";
const OUT = ROOT + "/dist/web";

async function copyDir(src, dest) {
  await Deno.mkdir(dest, { recursive: true });
  for await (const entry of Deno.readDir(src)) {
    const s = `${src}/${entry.name}`;
    const d = `${dest}/${entry.name}`;
    if (entry.isDirectory) await copyDir(s, d);
    else await Deno.copyFile(s, d);
  }
}

await Deno.remove(OUT, { recursive: true }).catch(() => {});
await copyDir(ROOT + "/apps/web", OUT);
await copyDir(ROOT + "/packages/contracts", OUT + "/packages/contracts");
console.log("build-web: dist/web 就绪（apps/web + packages/contracts）");
