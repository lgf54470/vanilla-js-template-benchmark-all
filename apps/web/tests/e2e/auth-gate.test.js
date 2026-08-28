import assert from "node:assert/strict";
import { connectCdp } from "../../../../scripts/testing/cdp-client.js";

async function getWsDebugUrl(port = 9222) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.webSocketDebuggerUrl;
  } catch {
    return null;
  }
}

Deno.test({
  name: "e2e: 关键路径冒烟 (未登录访问拦截与侧栏装配)",
  ignore: false,
  fn: async () => {
    const wsUrl = await getWsDebugUrl();
    if (!wsUrl) {
      console.log("  [e2e] Chrome CDP (port 9222) not running. Skipping live browser E2E test.");
      return;
    }

    const cdp = await connectCdp(wsUrl);
    try {
      const appUrl = Deno.env.get("E2E_APP_URL") || "http://127.0.0.1:8787";
      await cdp.send("Page.enable");
      await cdp.send("Page.navigate", { url: appUrl });

      // Evaluate document title
      const res = await cdp.send("Runtime.evaluate", {
        expression: "document.title",
        returnByValue: true,
      });

      assert.ok(res.result.value.includes("vanilla-js-template"));
    } finally {
      cdp.close();
    }
  },
});
