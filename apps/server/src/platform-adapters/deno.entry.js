import { createApp } from "../app.js";

const app = createApp();
const port = Number(Deno.env.get("PORT")) || 8000;

Deno.serve({ port }, app.fetch);
