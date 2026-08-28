#!/usr/bin/env -S deno run --allow-read --allow-env --allow-run

const checks = [
  "scripts/check-hardcoded-tokens.js",
];

let allPassed = true;

for (const check of checks) {
  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-read", "--allow-env", check],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await process.output();
  if (code !== 0) {
    allPassed = false;
  }
}

if (!allPassed) {
  console.error("\n[run-checks] Some governance checks failed.");
  Deno.exit(1);
} else {
  console.log("\n[run-checks] All governance checks passed.");
  Deno.exit(0);
}
