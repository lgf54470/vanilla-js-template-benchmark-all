// cdp-client.js — 自研极简 Chrome DevTools Protocol 客户端（docs/Testing.md §4）。
// 不引入 Playwright/Puppeteer：基于 Deno/浏览器原生 WebSocket，直连 CDP。
// 用法见 apps/web/tests/e2e/（M7 落地冒烟用例）。

/** 连接一个已就绪的 CDP WebSocket 端点。 */
export async function connectCdp(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  const listeners = new Set();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    } else if (message.method) {
      for (const listener of listeners) listener(message);
    }
  });

  return {
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    /** 订阅事件（Page.loadEventFired / Runtime.exceptionThrown 等）。 */
    onEvent(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close() {
      socket.close();
    },
  };
}

async function httpJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`CDP HTTP ${response.status}: ${url}`);
  }
  return response.json();
}

export async function chromeReachable(port) {
  try {
    await httpJson(`http://127.0.0.1:${port}/json/version`);
    return true;
  } catch {
    return false;
  }
}

/** 新开一个标签页并连接其 CDP 会话（调用方负责 cdp.close()）。 */
export async function openPage(port, url) {
  const target = await httpJson(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,
    { method: "PUT" },
  );
  const cdp = await connectCdp(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  return {
    cdp,
    targetId: target.id,
    close() {
      cdp.close();
      // 关闭标签页，避免 profile 残留
      fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(
        () => {},
      );
    },
  };
}

/** 等待页面 load 事件（或超时）。 */
export function waitForLoad(cdp, timeoutMs = 10_000) {
  return new Promise((resolve) => {
    const timer = setTimeout(done, timeoutMs);
    const off = cdp.onEvent((message) => {
      if (message.method === "Page.loadEventFired") done();
    });
    function done() {
      clearTimeout(timer);
      off();
      resolve();
    }
  });
}

/** 在页面里求值一个表达式（表达式需返回可 JSON 化的值）。 */
export async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      `evaluate failed: ${
        result.exceptionDetails.exception?.description ?? "unknown"
      }`,
    );
  }
  return result.result.value;
}
