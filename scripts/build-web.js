#!/usr/bin/env -S deno run --allow-read --allow-write

const root = new URL("../", import.meta.url).pathname;
const distWeb = `${root}/dist/web`;

console.log(`[build-web] Assembling web production assets to ${distWeb}...`);

async function copyRecursive(src, dest) {
  try {
    const stat = await Deno.stat(src);
    if (stat.isDirectory) {
      await Deno.mkdir(dest, { recursive: true });
      for await (const entry of Deno.readDir(src)) {
        await copyRecursive(`${src}/${entry.name}`, `${dest}/${entry.name}`);
      }
    } else if (stat.isFile) {
      const parent = dest.substring(0, dest.lastIndexOf("/"));
      await Deno.mkdir(parent, { recursive: true });
      await Deno.copyFile(src, dest);
    }
  } catch {
    // Ignore missing optional files
  }
}

// Clean dist/web
try {
  await Deno.remove(distWeb, { recursive: true });
} catch {
  // Ignore
}
await Deno.mkdir(distWeb, { recursive: true });

// Copy apps/web contents
await copyRecursive(`${root}/apps/web/index.html`, `${distWeb}/index.html`);
await copyRecursive(`${root}/apps/web/public`, `${distWeb}`);
await copyRecursive(`${root}/apps/web/src`, `${distWeb}/src`);
await copyRecursive(`${root}/packages/contracts`, `${distWeb}/packages/contracts`);

console.log("[build-web] Successfully built dist/web static assets.");
