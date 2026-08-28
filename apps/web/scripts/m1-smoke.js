// M1 冒烟编排：spawn local.entry → 进程内 CDP 断言 → 汇总。
// Uso: deno run -A apps/web/scripts/m1-smoke.js (requiere .env + Chrome local)
const WT = "/home/kubuntu/code/templates/vanilla-js-template-glm53f-thinking";
const { launchChrome, connectCDP } = await import(
  `${WT}/scripts/testing/cdp-client.js`
);

const _server = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    "--env-file=.env",
    `${WT}/apps/server/src/platform-adapters/local.entry.js`,
  ],
  env: { PORT: "8788" },
  stdout: "inherit",
  stderr: "inherit",
}).spawn();

let health = 0;
for (let i = 0; i < 25; i++) {
  await new Promise((r) => setTimeout(r, 200));
  health = await fetch("http://127.0.0.1:8788/api/health").then((r) => r.status)
    .catch(() => 0);
  if (health === 200) break;
}

if (health !== 200) {
  console.error("SMOKE-FAIL: server not ready");
  Deno.exit(1);
}

const chrome = await launchChrome();
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    console.log(`  ok - ${name}`);
  } catch (e) {
    failures.push(name);
    console.error(`  NOT OK - ${name}: ${e.message}`);
  }
}

try {
  const cdp = await connectCDP(chrome.port, "http://127.0.0.1:8788/");
  try {
    await check("entry module mounts the M1 playground", async () => {
      if (!(await cdp.waitFor("document.querySelector('.pg-main') != null"))) {
        throw new Error(".pg-main absent after 5s");
      }
    });
    await check("theme toggle applies dark instantly", async () => {
      const r = await cdp.evaluate(
        `(function(){ localStorage.setItem("pref:theme","dark");
        document.querySelector('[data-set="theme"][data-value="dark"]').click();
        return { dark: document.documentElement.classList.contains("dark"), t: document.documentElement.dataset.theme }; })()`,
      );
      if (!r.dark || r.t !== "dark") throw new Error(JSON.stringify(r));
    });
    await check("refresh restores dark from PREPAINT (no flash)", async () => {
      await cdp.navigate("http://127.0.0.1:8788/");
      await cdp.waitFor("document.querySelector('.pg-main') != null");
      const r = await cdp.evaluate(
        `({ dark: document.documentElement.classList.contains("dark"), t: localStorage.getItem("pref:theme") })`,
      );
      if (!r.dark || r.t !== "dark") throw new Error(JSON.stringify(r));
    });
    await check("palette switch restyles primary instantly", async () => {
      // 先回 light（前序用例停在 dark；dark 下 base-blue primary 是另一个官方值）
      await cdp.evaluate(
        `document.querySelector('[data-set="theme"][data-value="light"]').click()`,
      );
      await cdp.evaluate(
        `document.querySelector('[data-set="palette"][data-value="base-blue"]').click()`,
      );
      const p = await cdp.evaluate(
        `({ cls: document.documentElement.className, v: getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() })`,
      );
      if (!/oklch\(0\.488 0\.243 264/.test(p.v)) {
        throw new Error(JSON.stringify(p));
      }
      await cdp.evaluate(
        `document.querySelector('[data-set="palette"][data-value="base-zinc"]').click()`,
      );
      await cdp.evaluate(
        `document.querySelector('[data-set="theme"][data-value="dark"]').click()`,
      );
    });
    await check("cleanup", async () => {
      await cdp.evaluate("localStorage.clear()");
    });
  } finally {
    cdp.close();
  }
} finally {
  await chrome.close();
}

console.log(failures.length ? `SMOKE-FAIL (${failures.length})` : "SMOKE-PASS");
Deno.exit(failures.length ? 1 : 0);
