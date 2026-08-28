// scripts/e2e/headless.js — Chrome DevTools Protocol 冒烟测试工具（M7 CDP 冒烟）
//
// 零依赖：Deno 原生 WebSocket + fetch。用法：
//   import { launchHeadless, cdps } from "./headless.js";
//
// launchHeadless({ port }) 启动 headless Chrome，返回 { close, page }：
//   page.eval(expr)        —— 在页面执行表达式并返回 JSON 序列化结果
//   page.navigate(url)     —— 等待 load 事件
//   page.consoleErrors()   —— 已捕获的 console.error 消息
// 服务器进程由调用方管理；本工具只负责浏览器端。

const CHROME_BIN = Deno.env.get("CHROME_BIN") ??
  ["google-chrome", "chromium", "chromium-browser", "chrome"]
    .map((name) => {
      try {
        return new Deno.Command("which", { args: [name] }).outputSync().success
          ? name
          : null;
      } catch {
        return null;
      }
    })
    .find(Boolean);

export function hasChrome() {
  return !!CHROME_BIN;
}

/**
 * @param {{ port?: number, url?: string, headless?: boolean }} [opts]
 */
export async function launchHeadless(opts = {}) {
  if (!CHROME_BIN) {
    throw new Error(
      "未找到 Chrome（CHROME_BIN 或 PATH 中的 google-chrome/chromium）",
    );
  }

  const proc = new Deno.Command(CHROME_BIN, {
    args: [
      opts.headless === false ? "" : "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--remote-debugging-port=0",
      "--user-data-dir=/tmp/fb-cdp-profile",
      "--window-size=1280,900",
      opts.url ?? "about:blank",
    ].filter(Boolean),
    stdout: "piped",
    stderr: "piped",
  }).spawn();

  // 从 stderr 读取 "DevTools listening on ws://..." 行拿到调试端口
  const reader = proc.stderr.getReader();
  const decoder = new TextDecoder();
  let wsUrl = null;
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline && !wsUrl) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    const m = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (m) wsUrl = m[1];
  }
  if (!wsUrl) {
    proc.kill();
    throw new Error("Chrome 未在 15s 内输出 DevTools ws 地址");
  }

  // 浏览器级 ws 只管理 target；先经 HTTP /json/new 创建页面 target，
  // 再连接该页面的 ws（Runtime.enable 等命令需要 page 级端点）
  const debugPort = new URL(wsUrl).port;
  const created = await fetch(
    `http://127.0.0.1:${debugPort}/json/new?${
      encodeURIComponent(opts.url ?? "about:blank")
    }`,
    { method: "PUT" },
  ).then((r) => r.json());
  const pageWsUrl = created.webSocketDebuggerUrl;

  const { page, close: closePage } = await connectPage(pageWsUrl);

  return {
    proc,
    page,
    async close() {
      try {
        await closePage();
      } catch {
        // 页面已关闭
      }
      proc.kill();
      await proc.status;
    },
  };
}

/** 连接 ws 调试端点，创建一个页面，返回 { page, close } */
async function connectPage(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error("WebSocket 连接失败"));
  });

  let nextId = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (
      msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error"
    ) {
      const text = (msg.params.args ?? [])
        .map((a) => a.value ?? a.description ?? "")
        .join(" ");
      consoleErrors.push(text);
    }
  };

  function send(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Runtime.enable");
  await send("Page.enable");

  return {
    page: {
      /** @param {string} expr @returns {Promise<unknown>} */
      async eval(expr) {
        const result = await send("Runtime.evaluate", {
          expression: expr,
          awaitPromise: true,
          returnByValue: true,
        });
        if (result.exceptionDetails) {
          throw new Error(
            `页面执行异常: ${
              result.exceptionDetails.exception?.description ??
                result.exceptionDetails.text
            }`,
          );
        }
        return result.result.value;
      },
      /** @param {string} url 等待 load 事件后返回 */
      async navigate(url) {
        const loaded = new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("页面加载超时")),
            15000,
          );
          const handler = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.method === "Page.loadEventFired") {
              clearTimeout(timer);
              ws.removeEventListener("message", handler);
              resolve();
            }
          };
          ws.addEventListener("message", handler);
        });
        await send("Page.navigate", { url });
        await loaded;
        // 等一帧让动态 import 完成
        await new Promise((r) => setTimeout(r, 800));
      },
      consoleErrors() {
        return [...consoleErrors];
      },
    },
    close() {
      ws.close();
    },
  };
}
