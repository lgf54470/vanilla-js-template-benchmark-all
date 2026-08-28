#!/usr/bin/env -S deno run --allow-read
// run-checks.js — 零依赖治理脚本编排器（ARCHITECTURE.md §16）。
// 串联全部 check 脚本：任一失败即退出码 1（`just lint` / CI 调用）。
// 各 check 脚本自包含（不互相 import），可被 scripts/tests 单独复制执行
// （docs/Testing.md §7.1 临时工作区方案）。

import { run as runModuleBoundaries } from "./check-module-boundaries.js";
import { run as runFileLength } from "./check-file-length.js";
import { run as runHardcodedTokens } from "./check-hardcoded-tokens.js";
import { run as runWindowDialogs } from "./check-window-dialogs.js";
import { run as runSqlConcat } from "./check-sql-concat.js";
import { run as runWorkspaceScope } from "./check-workspace-scope.js";
import { run as runI18nKeys } from "./check-i18n-keys.js";

const CHECKS = [
  runModuleBoundaries,
  runFileLength,
  runHardcodedTokens,
  runWindowDialogs,
  runSqlConcat,
  runWorkspaceScope,
  runI18nKeys,
];

let failed = 0;
for (const run of CHECKS) {
  const result = await run();
  if (result.ok) {
    const scanned = result.scanned > 0
      ? `（扫描 ${result.scanned} 个文件）`
      : "";
    console.log(`✓ ${result.name}${scanned}`);
  } else {
    failed++;
    console.error(`✗ ${result.name}`);
    for (const message of result.messages) {
      console.error(`    ${message}`);
    }
  }
}

if (failed > 0) {
  console.error(`[run-checks] ${failed} 个治理检查未通过`);
  Deno.exit(1);
}
