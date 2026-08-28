// scripts/run-checks.js — 串联执行 scripts/ 下所有 check-*.js 治理脚本（零依赖）
//
// 规则：只扫描 scripts/ 直接子目录的 check-*.js（不递归，避免误入 scripts/tests/）。
// 新增治理脚本只需放入 scripts/ 并命名为 check-<name>.js，无需改动本文件。
const scriptsDir = import.meta.dirname;
const names = [];
for (const entry of Deno.readDirSync(scriptsDir)) {
  if (entry.isFile && /^check-.+\.js$/.test(entry.name)) {
    names.push(entry.name);
  }
}
names.sort();

let failed = false;
for (const name of names) {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", `${scriptsDir}/${name}`],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await cmd.output();
  if (code !== 0) {
    failed = true;
    console.error(`[run-checks] ${name} 失败（退出码 ${code}）`);
  }
}

if (failed) {
  console.error(`[run-checks] ${names.length} 个治理脚本中有失败项`);
  Deno.exit(1);
}
console.log(`[run-checks] ${names.length} 个治理脚本全部通过`);
