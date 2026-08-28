/**
 * 本地开发入口（just dev，ARCHITECTURE.md §15）。
 * M0 骨架：Deno.serve + Hono fetch 接口；数据库/静态服务在 M2 接入。
 */
import { createApp } from "../app.js";

const app = createApp();
const port = Number(Deno.env.get("PORT") ?? 8787);

Deno.serve({ port }, app.fetch);
