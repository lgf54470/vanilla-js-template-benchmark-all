// 治理脚本执行链（ARCHITECTURE §16）：自动发现 scripts/check-*.js 并逐个执行，
// 任一失败即整体失败。接入 `just lint`。零依赖（仅 Deno 内置 + node:path/url）。
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const SCRIPTS_DIR = join(fileURLToPath(new URL(".", import.meta.url)));
const decoder = new TextDecoder();

const checks = [];
for await (const entry of Deno.readDir(SCRIPTS_DIR)) {
  if (entry.isFile && /^check-[\w-]+\.js$/.test(entry.name)) {
    checks.push(entry.name);
  }
}
checks.sort();

if (checks.length === 0) {
  console.log("[run-checks] 未发现治理脚本（scripts/check-*.js）");
  process.exit(0);
}

const failed = [];
for (const name of checks) {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", join(SCRIPTS_DIR, name)],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await command.output();
  const output = decoder.decode(stdout) + decoder.decode(stderr);
  if (output.trim().length > 0) process.stdout.write(output);
  if (code !== 0) failed.push(name);
}

if (failed.length > 0) {
  console.error(`[run-checks] 失败的治理脚本：${failed.join(", ")}`);
  process.exit(1);
}
console.log(`[run-checks] ${checks.length} 个治理脚本全部通过`);
