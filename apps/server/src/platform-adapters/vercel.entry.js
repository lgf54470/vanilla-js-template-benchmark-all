import { createApp } from "../app.js";

const app = createApp();

export default function handler(request) {
  return app.fetch(request);
}
