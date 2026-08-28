// scripts/_walk.js — 零依赖目录遍历（多个 check-*.js 共用）
// 返回生成器：{ path, isDirectory, isFile }，按目录序。
export function* walk(root, { skipDirs = new Set() } = {}) {
  for (const entry of Deno.readDirSync(root)) {
    const full = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      if (!skipDirs.has(entry.name)) yield* walk(full, { skipDirs });
    } else if (entry.isFile) {
      yield { path: full, isDirectory: false, isFile: true };
    }
  }
}
