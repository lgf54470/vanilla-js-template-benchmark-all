import assert from "node:assert/strict";

Deno.test("governance: check-hardcoded-tokens 脚本验证", async () => {
  const scriptPath = new URL("../check-hardcoded-tokens.js", import.meta.url).pathname;
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-read", scriptPath],
  });
  const { code } = await cmd.output();
  assert.strictEqual(code, 0);
});
