import { createApp } from "../app.js";

const app = createApp();

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);

    // If request is not /api and ASSETS binding is present, let ASSETS serve it
    if (!url.pathname.startsWith("/api/") && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return app.fetch(request, env, ctx);
  },
};
