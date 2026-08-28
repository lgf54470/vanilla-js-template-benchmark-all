#!/usr/bin/env -S deno run -A
/**
 * run-checks.js — 治理脚本调度器（ARCHITECTURE §16）。
 *
 * 自动发现 scripts/check-*.js 并逐个以子进程运行；任一失败则整体失败。
 * 新增治理脚本只需按 check-<name>.js 命名放入本目录，无需登记。
 * 每个里程碑按需新增对应 check 脚本（M1 tokens / M2 sql / M5 i18n …）。
 */

const SCRIPTS_DIR = new URL(".", import.meta.url).pathname;

const checks = [];
for await (const entry of Deno.readDir(SCRIPTS_DIR)) {
  if (entry.isFile && /^check-.+\.js$/.test(entry.name)) {
    checks.push(entry.name);
  }
}
checks.sort();

if (checks.length === 0) {
  console.error("run-checks: 未发现任何 scripts/check-*.js 治理脚本");
  Deno.exit(1);
}

let failed = false;
for (const name of checks) {
  console.log(`\n▶ ${name}`);
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", `${SCRIPTS_DIR}${name}`],
    stdout: "inherit",
    stderr: "inherit",
  });
  const status = await cmd.spawn().status;
  if (!status.success) {
    console.error(`✗ ${name} 失败`);
    failed = true;
  }
}

console.log(
  failed
    ? "\n✗ 治理检查未全部通过"
    : `\n✓ 全部 ${checks.length} 项治理检查通过`,
);
Deno.exit(failed ? 1 : 0);
