// vendoring 冒烟：验证两个 vendored 库的完整导入闭包可解析、可求值。
import { Hono } from "hono";
import * as cf from "hono/cloudflare-workers";
import * as dn from "hono/deno";
import * as vc from "hono/vercel";
import { createClient } from "@libsql/client/web";

const app = new Hono();
app.get("/", (c) => c.text("ok"));
const res = await app.request("/");
if (res.status !== 200 || (await res.text()) !== "ok") {
  throw new Error("hono route failed");
}
if (typeof cf.serveStatic !== "function") throw new Error("cf adapter");
if (typeof dn.serveStatic !== "function") throw new Error("deno adapter");
if (typeof vc.handle !== "function") throw new Error("vercel adapter");
if (typeof createClient !== "function") throw new Error("libsql web");

// 不真正连接，只验证 web 客户端对象可构造（lib: 协议走 hrana web socket）。
const client = createClient({ url: "libsql://smoke-test.example.com" });
if (typeof client.execute !== "function") throw new Error("libsql client");
client.close();

console.log("smoke-vendor: OK");
