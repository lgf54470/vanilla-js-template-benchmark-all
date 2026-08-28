import { createApp } from "../app.js";

const port = Number(Deno.env.get("PORT")) || 8787;
const app = createApp();

console.log(`[local] Server running on http://127.0.0.1:${port}`);
Deno.serve({ port }, app.fetch);
