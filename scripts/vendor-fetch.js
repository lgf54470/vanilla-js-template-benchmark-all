#!/usr/bin/env -S deno run -A
/**
 * scripts/vendor-fetch.js — vendored 依赖获取工具（docs/Vendoring.md §3）。
 *
 * 用法：deno run -A scripts/vendor-fetch.js <hono|libsql-client>
 *
 * 从 npm registry 拉取锁定版本的 tarball（不使用 npm install / node_modules），
 * 解包后仅拷贝运行时需要的产物到 packages/lib/<name>/，并生成 VENDOR.md。
 * 升级版本时修改本文件顶部的 VERSION 常量并重跑，diff 全部可审查。
 *
 * 测试钩子（docs/Testing.md §7.2）：
 * - VENDOR_REGISTRY=http://127.0.0.1:<port> 把下载源指到本地 fixture 服务
 *   （tarball 布局与 npm 一致，含 package/ 根）；
 * - VENDOR_SKIP_BUNDLE=1 跳过 esbuild 打包步骤（测试环境不触网、不依赖 npm: 缓存）。
 */

const ROOT = new URL("..", import.meta.url).pathname;

// ---- 版本锁定（升级 = 改这里 + 重跑 + 审查 diff）----
const HONO_VERSION = "4.13.5";
const LIBSQL_CLIENT_VERSION = "0.17.4";
const LIBSQL_DEPS = Object.freeze({
  "@libsql/core": "0.17.4",
  "@libsql/hrana-client": "0.10.0",
  "@libsql/isomorphic-ws": "0.1.5",
  "js-base64": "3.7.8",
  "promise-limit": "2.7.0",
});
const ESBUILD_VERSION = "0.27.2";

const REGISTRY =
  (Deno.env.get("VENDOR_REGISTRY") ?? "https://registry.npmjs.org")
    .replace(/\/$/, "");
const SKIP_BUNDLE = Deno.env.get("VENDOR_SKIP_BUNDLE") === "1";

/** npm tarball URL（scoped 包路径形如 @scope/name/-/name-<version>.tgz） */
function tarballUrl(name, version) {
  const fileName = name.startsWith("@")
    ? `${name.split("/")[1]}-${version}.tgz`
    : `${name}-${version}.tgz`;
  return `${REGISTRY}/${name}/-/${fileName}`;
}

/** 下载 tarball 到临时目录（VENDOR_REGISTRY 可替换下载源以便测试） */
async function fetchTarball(name, version, dir) {
  const url = tarballUrl(name, version);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`下载失败 ${url}: HTTP ${res.status}`);
  }
  const tgz = `${dir}/${name.replaceAll("/", "__")}.tgz`;
  const bytes = new Uint8Array(await res.arrayBuffer());
  await Deno.writeFile(tgz, bytes);
  const out = `${dir}/pkg-${name.replaceAll("/", "__")}`;
  await Deno.mkdir(out, { recursive: true });
  await run("tar", ["-xzf", tgz, "-C", out]);
  return `${out}/package`;
}

async function run(cmd, args, opts = {}) {
  const c = new Deno.Command(cmd, { args, ...opts });
  const status = await c.spawn().status;
  if (!status.success) {
    throw new Error(`${cmd} ${args.join(" ")} 失败（exit ${status.code}）`);
  }
}

async function copyDir(src, dest) {
  await Deno.mkdir(dest, { recursive: true });
  for await (const entry of Deno.readDir(src)) {
    const s = `${src}/${entry.name}`;
    const d = `${dest}/${entry.name}`;
    if (entry.isDirectory) await copyDir(s, d);
    else if (entry.isFile) await Deno.copyFile(s, d);
  }
}

async function writeText(path, content) {
  await Deno.mkdir(new URL(".", `file://${path}`).pathname, {
    recursive: true,
  });
  await Deno.writeTextFile(path, content);
}

// ---- hono：仅 dist ESM + LICENSE，加薄包装入口 ----
async function vendorHono() {
  const dir = await Deno.makeTempDir();
  try {
    const pkg = await fetchTarball("hono", HONO_VERSION, dir);
    const dest = `${ROOT}/packages/lib/hono`;
    await Deno.remove(dest, { recursive: true }).catch(() => {});
    await copyDir(`${pkg}/dist`, `${dest}/dist`);
    await Deno.copyFile(`${pkg}/LICENSE`, `${dest}/LICENSE`);

    await writeText(
      `${dest}/mod.js`,
      `// 薄包装：import 映射 "hono" → 本文件（docs/Vendoring.md）。\nexport * from "./dist/index.js";\n`,
    );
    const wrappers = {
      "cors.js": "./dist/middleware/cors/index.js",
      "secure-headers.js": "./dist/middleware/secure-headers/index.js",
      "http-exception.js": "./dist/http-exception.js",
      "cloudflare-workers.js": "./dist/adapter/cloudflare-workers/index.js",
      "deno.js": "./dist/adapter/deno/index.js",
      "vercel.js": "./dist/adapter/vercel/index.js",
    };
    for (const [entry, target] of Object.entries(wrappers)) {
      await writeText(
        `${dest}/${entry}`,
        `// 薄包装："hono/${
          entry.replace(/\.js$/, "")
        }" → 本文件。\nexport * from "${target}";\n`,
      );
    }

    await writeText(
      `${dest}/VENDOR.md`,
      `# VENDOR: hono

- 上游仓库：https://github.com/honojs/hono
- Vendoring 版本：v${HONO_VERSION}（npm tarball）
- Vendoring 日期：${new Date().toISOString().slice(0, 10)}
- 许可证：MIT（原始 LICENSE 已随文件保留在同目录）
- 包含内容：dist/ 全量 ESM 产物（应用只 import 其中核心 index、middleware/cors、
  middleware/secure-headers、adapter/{cloudflare-workers,deno,vercel}），另附本目录下
  六个薄包装入口文件（mod/cors/secure-headers/http-exception/cloudflare-workers/deno/vercel.js），
  供根 deno.json 的 "hono"/"hono/" import 映射解析到。
- 已知裁剪/修改：无（上游源码未做任何改动；包装文件为本仓库新增，非上游内容）。

## 更新方式

修改本脚本顶部 HONO_VERSION 并重跑 \`just vendor-update hono\`，详见 docs/Vendoring.md §4。
`,
    );
    console.log(`✓ hono v${HONO_VERSION} → packages/lib/hono`);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/** 下载 → 解包 → 把 package/ 目录整体挪到 node_modules 槽位（npm 布局） */
async function fetchTo(dir, name, version, slot) {
  const pkg = await fetchTarball(name, version, dir);
  await Deno.rename(pkg, slot);
}

// ---- libsql-client：/web 构建产物，打包为单文件自包含 ESM ----
async function vendorLibsql() {
  const dir = await Deno.makeTempDir();
  try {
    const nm = `${dir}/vendor/node_modules`;
    await Deno.mkdir(`${nm}/@libsql`, { recursive: true });

    // 下载各依赖包到 node_modules 槽位
    await fetchTo(
      dir,
      "@libsql/client",
      LIBSQL_CLIENT_VERSION,
      `${nm}/@libsql/client`,
    );
    await fetchTo(
      dir,
      "@libsql/core",
      LIBSQL_DEPS["@libsql/core"],
      `${nm}/@libsql/core`,
    );
    await fetchTo(
      dir,
      "@libsql/hrana-client",
      LIBSQL_DEPS["@libsql/hrana-client"],
      `${nm}/@libsql/hrana-client`,
    );
    await fetchTo(
      dir,
      "@libsql/isomorphic-ws",
      LIBSQL_DEPS["@libsql/isomorphic-ws"],
      `${nm}/@libsql/isomorphic-ws`,
    );
    await fetchTo(
      dir,
      "js-base64",
      LIBSQL_DEPS["js-base64"],
      `${nm}/js-base64`,
    );
    await fetchTo(
      dir,
      "promise-limit",
      LIBSQL_DEPS["promise-limit"],
      `${nm}/promise-limit`,
    );

    const dest = `${ROOT}/packages/lib/libsql-client`;
    await Deno.mkdir(dest, { recursive: true });
    if (!SKIP_BUNDLE) {
      await run("deno", [
        "run",
        "-A",
        `npm:esbuild@${ESBUILD_VERSION}`,
        "@libsql/client/web",
        "--bundle",
        "--format=esm",
        "--platform=neutral",
        `--outfile=${dest}/web.js`,
      ], { cwd: `${dir}/vendor` });
    }

    // LICENSE：tarball 未附带时从 GitHub 上游仓库取（锁定版本 tag）
    const licenseDest = `${dest}/LICENSE`;
    try {
      await Deno.copyFile(`${nm}/@libsql/client/LICENSE`, licenseDest);
    } catch {
      const res = await fetch(
        `https://raw.githubusercontent.com/tursodatabase/libsql-client/libsql-client@${LIBSQL_CLIENT_VERSION}/LICENSE`,
      );
      if (res.ok) await Deno.writeTextFile(licenseDest, await res.text());
      else {
        await writeText(
          licenseDest,
          `MIT License — upstream @libsql/client v${LIBSQL_CLIENT_VERSION}（完整文本见上游仓库 LICENSE 文件）\n`,
        );
      }
    }

    await writeText(
      `${dest}/VENDOR.md`,
      `# VENDOR: libsql-client（@libsql/client /web 构建）

- 上游仓库：https://github.com/tursodatabase/libsql-client-ts
- Vendoring 版本：@libsql/client v${LIBSQL_CLIENT_VERSION}（依赖锁定：
  @libsql/core ${LIBSQL_DEPS["@libsql/core"]}、@libsql/hrana-client ${
        LIBSQL_DEPS["@libsql/hrana-client"]
      }、
  @libsql/isomorphic-ws ${LIBSQL_DEPS["@libsql/isomorphic-ws"]}、js-base64 ${
        LIBSQL_DEPS["js-base64"]
      }、
  promise-limit ${LIBSQL_DEPS["promise-limit"]}）
- Vendoring 日期：${new Date().toISOString().slice(0, 10)}
- 许可证：MIT（原始 LICENSE 已随文件保留在同目录）
- 包含内容：仅 \`/web\` 构建（纯 fetch/WebSocket，无 Node 原生绑定）——用 esbuild
  （deno run npm:esbuild@${ESBUILD_VERSION}，临时执行不落盘依赖）把
  @libsql/client/web 连同其依赖链打包为单文件自包含 ESM：web.js。
- 已知裁剪/修改：无手工修改；打包产物由脚本自动生成，可重跑复现。

## 更新方式

修改本脚本顶部 LIBSQL_* 版本常量并重跑 \`just vendor-update libsql-client\`，
详见 docs/Vendoring.md §4。
`,
    );
    console.log(
      `✓ @libsql/client v${LIBSQL_CLIENT_VERSION} → packages/lib/libsql-client`,
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

// ---- main ----
const name = Deno.args[0];
if (name === "hono") await vendorHono();
else if (name === "libsql-client") await vendorLibsql();
else {
  console.error(
    "用法：deno run -A scripts/vendor-fetch.js <hono|libsql-client>",
  );
  Deno.exit(1);
}
