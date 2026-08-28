// scripts/build-web.js — 组装前端静态产物 dist/web（just build-web）
//
// dist/web 是"同一份构建输出"，Cloudflare / Vercel / Deno Deploy 都从它发布
// （Deployment.md §2）。多根静态布局在部署时收敛为单根：web 根 + public 静态
// 资源 + packages/contracts 依次落入 dist/web（import map 的 /packages/contracts/
// 与 index.html 引用的 /src/*、/fonts、/favicon.svg、/icons.svg 都指向产物根）。
// 纯复制（零依赖零打包，源码即产物）；输出 manifest 到 dist/web/MANIFEST.txt。
const ROOT = new URL("..", import.meta.url).pathname;
const WEB = `${ROOT}apps/web`;
const OUT = `${ROOT}dist/web`;

// 递归复制目录/文件（Deno 此版本无 cpSync，手写）；自动建父目录；
// 源不存在则跳过（缺关键文件时交由下方健康检查给出友好报错）
function copy(src, dest) {
  let st;
  try {
    st = Deno.statSync(src);
  } catch {
    return;
  }
  if (st.isFile) {
    Deno.mkdirSync(dest.slice(0, dest.lastIndexOf("/")), { recursive: true });
    Deno.copyFileSync(src, dest);
    return;
  }
  Deno.mkdirSync(dest, { recursive: true });
  for (const e of Deno.readDirSync(src)) {
    copy(`${src}/${e.name}`, `${dest}/${e.name}`);
  }
}
function rmrf(p) {
  try {
    Deno.removeSync(p, { recursive: true });
  } catch {
    // 不存在
  }
}

rmrf(OUT);
Deno.mkdirSync(OUT, { recursive: true });

// 1) web 根：index.html + src/**
copy(`${WEB}/index.html`, `${OUT}/index.html`);
copy(`${WEB}/src`, `${OUT}/src`);

// 2) public 静态资源：平铺到产物根（favicon.svg / icons.svg / fonts/*）
const PUBLIC = `${WEB}/public`;
for (const e of Deno.readDirSync(PUBLIC)) {
  copy(`${PUBLIC}/${e.name}`, `${OUT}/${e.name}`);
}

// 3) packages/contracts → 产物根下的 packages/contracts/（import map 别名）
copy(`${ROOT}packages/contracts`, `${OUT}/packages/contracts`);

// 拓扑健康检查：产物根必须含 index.html 与 src/main.js
for (const required of ["index.html", "src/main.js", "src/style.css"]) {
  try {
    Deno.statSync(`${OUT}/${required}`);
  } catch {
    console.error(`[build-web] 产物缺关键文件 dist/web/${required}`);
    Deno.exit(1);
  }
}

// 输出清单
const lines = [`dist/web build @ ${new Date().toISOString()}`, ""];
function list(dir, rel) {
  for (
    const e of [...Deno.readDirSync(dir)].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  ) {
    const p = `${rel}/${e.name}`;
    if (e.isDirectory) list(`${dir}/${e.name}`, p);
    else lines.push(p);
  }
}
list(OUT, ".");

Deno.writeTextFileSync(`${OUT}/MANIFEST.txt`, lines.join("\n") + "\n");
console.log(`[build-web] dist/web 组装完成（${lines.length - 1} 个文件）`);
