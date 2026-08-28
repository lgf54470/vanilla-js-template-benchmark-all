import { createApp } from "../app.js";
import { createStaticHandler } from "../shared/static/static-handler.js";
import { serveWithPortHint } from "../shared/net/serve-with-port-hint.js";

const port = Number(Deno.env.get("PORT")) || 8787;
const staticRoot = Deno.env.get("STATIC_ROOT") || "./public";

const app = createApp();
const staticHandler = createStaticHandler({
  root: staticRoot,
  extraRoots: {
    "/packages/contracts": `${staticRoot}/packages/contracts`,
  },
});

const fetchHandler = async (req) => {
  const staticRes = await staticHandler({ req });
  if (staticRes) return staticRes;
  return app.fetch(req);
};

console.log(`[docker] Server running on port ${port}`);
serveWithPortHint({ port }, fetchHandler);
