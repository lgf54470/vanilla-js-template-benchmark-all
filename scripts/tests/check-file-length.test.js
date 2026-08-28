import assert from "node:assert/strict";

Deno.test("governance: check-file-length 脚本验证", async () => {
  const scriptPath = new URL("../check-file-length.js", import.meta.url).pathname;
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-read", scriptPath],
  });
  const { code } = await cmd.output();
  assert.strictEqual(code, 0);
});
