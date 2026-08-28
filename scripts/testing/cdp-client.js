/**
 * scripts/testing/cdp-client.js — 极简 Chrome DevTools Protocol 客户端
 * （ARCHITECTURE §13：零依赖，自研，基于原生 fetch + WebSocket）。
 *
 * 用法（通常在冒烟脚本内）：
 *   import { launchChrome, connectCDP } from "../testing/cdp-client.js";
 *   const chrome = await launchChrome();          // 独立 headless 实例
 *   try {
 *     const cdp = await connectCDP(chrome.port, url);
 *     const v = await cdp.evaluate("1 + 1");      // → 2
 *     await cdp.navigate(url2);
 *     ...
 *   } finally {
 *     await chrome.close();
 *   }
 *
 * 前置：本机有 google-chrome / chromium（可用 CHROME_BIN 覆盖）。
 */

const CDP_PORT = 9223;

/** 拉起独立 headless Chrome（独立 user-data-dir，不干扰用户浏览器） */
export async function launchChrome() {
  const bin = Deno.env.get("CHROME_BIN") ??
    await findFirst([
      "google-chrome-stable",
      "google-chrome",
      "chromium",
      "chromium-browser",
    ]);
  if (!bin) throw new Error("未找到 Chrome/Chromium（可用 CHROME_BIN 指定）");

  const userDataDir = await Deno.makeTempDir({ prefix: "cdp-profile-" });
  const cmd = new Deno.Command(bin, {
    args: [
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    stdout: "null",
    stderr: "null",
  });
  const proc = cmd.spawn();
  unref(proc); // 仅脱离事件循环引用，绝不 await（否则等于等 Chrome 退出）

  // 等待 CDP 端口就绪（最多 10s）
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) {
        return {
          proc,
          port: CDP_PORT,
          userDataDir,
          close: () => closeChrome(proc, userDataDir),
        };
      }
    } catch { /* 未就绪，继续等 */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  await closeChrome(proc, userDataDir);
  throw new Error("Chrome CDP 端口 10s 内未就绪");
}

async function closeChrome(proc, userDataDir) {
  try {
    proc.kill("SIGTERM");
  } catch { /* 已退出 */ }
  await Deno.remove(userDataDir, { recursive: true }).catch(() => {});
}

/** 脱离事件循环引用（仅防 Deno 因子进程而挂起；不等待） */
function unref(proc) {
  proc.status.then(() => {}); // promise 悬置即可，不 await
}

async function findFirst(candidates) {
  for (const bin of candidates) {
    try {
      const cmd = new Deno.Command("which", {
        args: [bin],
        stdout: "piped",
        stderr: "null",
      });
      const out = await cmd.output();
      if (out.success && new TextDecoder().decode(out.stdout).trim() !== "") {
        return bin;
      }
    } catch { /* 不存在 */ }
  }
  return null;
}

/**
 * 连接到已运行的 Chrome，打开/复用一个 page target。
 * @param {number} port CDP 端口
 * @param {string} url 初始导航地址（可省略）
 */
export async function connectCDP(port, url) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`))
    .json();
  let page = targets.find((t) => t.type === "page");
  if (!page) {
    // 新版 Chrome 要求 PUT（GET 返回 405）
    page = await (
      await fetch(`http://127.0.0.1:${port}/json/new`, { method: "PUT" })
    ).json();
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const wsOpen = (timeoutMs) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`CDP WebSocket ${timeoutMs}ms 内未握手`)),
        timeoutMs,
      );
      ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error("CDP WebSocket 连接失败"));
      };
    });
  await wsOpen(5000);

  let seq = 0;
  const pending = new Map();
  const eventWaiters = [];

  const CMD_TIMEOUT_MS = 10_000;
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject, timer } = pending.get(msg.id);
      clearTimeout(timer);
      pending.delete(msg.id);
      if (msg.error) {
        reject(new Error(`${msg.error.message}（${msg.error.code}）`));
      } else resolve(msg.result);
      return;
    }
    for (let i = eventWaiters.length - 1; i >= 0; i--) {
      const w = eventWaiters[i];
      if (w.method === msg.method) {
        eventWaiters.splice(i, 1);
        w.resolve(msg.params);
      }
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP 命令 ${method} ${CMD_TIMEOUT_MS}ms 未响应`));
      }, CMD_TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });

  /** 等 Page.loadEventFired（带超时兜底） */
  const waitLoad = (timeoutMs = 5000) =>
    new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      eventWaiters.push({
        method: "Page.loadEventFired",
        resolve: (p) => {
          clearTimeout(timer);
          resolve(p);
        },
      });
    });

  const cdp = {
    /** 导航并等待 load（超时不抛错，交由断言判定） */
    async navigate(target) {
      const loaded = waitLoad();
      await send("Page.navigate", { url: target });
      await loaded;
      return target;
    },
    /** 在页面上下文求值（支持 await 表达式，如 waitFor 辅助） */
    async evaluate(expression) {
      const r = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (r.exceptionDetails) {
        throw new Error(
          r.exceptionDetails.exception?.description ?? "页面求值异常",
        );
      }
      return r.result.value;
    },
    /** 轮询等待页面内条件成立（模块脚本与 load 事件无序，不可只等 load） */
    async waitFor(expression, timeoutMs = 5000) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const ok = await this.evaluate(expression);
        if (ok) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    },
    close: () => {
      try {
        ws.close();
      } catch { /* 已关 */ }
    },
  };

  await send("Page.enable");
  if (url) await cdp.navigate(url);
  return cdp;
}
