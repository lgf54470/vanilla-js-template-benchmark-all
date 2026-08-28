// scripts/tests/helpers/check-runner.js — 治理脚本测试基建（docs/Testing.md §7.1/7.2）
//
// 治理脚本以 import.meta.dirname/.. 作为 ROOT 扫描整个仓库，负测试若直接在仓库里
// 摆破损文件会误伤真实代码。因此把被测脚本**复制进系统临时目录**的 scripts/ 下
// （ROOT 即落在 fixture 上），摆入正常/故意破损的文件，子进程执行后断言退出码 +
// 输出片段，跑完递归删除（Deno.remove，注意 Deno 2.x 已移除 Deno.rm）。
// node:assert/strict 提供 deepStrictEqual；docs/Testing.md 示例中的 assertEquals 在
// node:assert 里不存在，这里按 doc 命名习惯别名到 deepStrictEqual（零依赖）。
import { deepStrictEqual as assertEquals } from "node:assert/strict";

/** 创建系统临时目录（withWorkspace 内部使用） */
export function tempDir(prefix = "check-fixture-") {
  return Deno.makeTempDirSync({ prefix });
}

/** 递归删除（不存在时静默） */
export function rmrf(path) {
  try {
    Deno.removeSync(path, { recursive: true });
  } catch {
    // 已不存在
  }
}

/** 在临时工作区写入文件（自动建父目录） */
export function writeFile(ws, rel, content) {
  const full = `${ws}/${rel}`;
  const parent = full.slice(0, full.lastIndexOf("/"));
  Deno.mkdirSync(parent, { recursive: true });
  Deno.writeTextFileSync(full, content);
}

/**
 * withWorkspace(files, fn)：{ "相对路径": "内容" } → 临时目录，回调后自动清理。
 */
export async function withWorkspace(files, fn) {
  const ws = tempDir();
  try {
    for (const [rel, content] of Object.entries(files)) {
      writeFile(ws, rel, content);
    }
    return await fn(ws);
  } finally {
    rmrf(ws);
  }
}

/**
 * runCheck(ws, scriptName, args?)：把 scripts/<scriptName> 复制到临时目录的
 * scripts/ 下执行（ROOT 因此落在 fixture 上）。
 * 权限：--allow-read --allow-env --allow-run=deno,just,which
 * （check-justfile / check-deno-tasks 要执行子进程）。
 */
export function runCheck(ws, scriptName, args = []) {
  const script = `${import.meta.dirname}/../../${scriptName}`;
  Deno.mkdirSync(`${ws}/scripts`, { recursive: true });
  Deno.copyFileSync(script, `${ws}/scripts/${scriptName}`);
  return runScript(ws, [
    "run",
    "--allow-read",
    "--allow-env",
    "--allow-run=deno,just,which",
    `${ws}/scripts/${scriptName}`,
    ...args,
  ]);
}

/** runScript(ws, args, { env })：通用子进程执行，返回 { code, combined } */
export async function runScript(ws, args, { env = {} } = {}) {
  const cmd = new Deno.Command(Deno.execPath(), {
    args,
    cwd: ws,
    env: { ...Deno.env.toObject(), ...env },
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await cmd.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);
  return { code, stdout: out, stderr: err, combined: out + err };
}

/** assertResult(res, expectCode, expectFragment)：退出码 + 输出片段双断言 */
export function assertResult(res, expectCode, expectFragment) {
  assertEquals(
    res.code,
    expectCode,
    `退出码应为 ${expectCode}，实际 ${res.code}\n输出:\n${res.combined}`,
  );
  if (expectFragment !== undefined) {
    if (!res.combined.includes(expectFragment)) {
      throw new Error(
        `输出应包含片段 "${expectFragment}"，实际:\n${res.combined}`,
      );
    }
  }
}

/** 读取临时工作区文件内容 */
export function readWorkspaceFile(ws, rel) {
  return Deno.readTextFileSync(`${ws}/${rel}`);
}
