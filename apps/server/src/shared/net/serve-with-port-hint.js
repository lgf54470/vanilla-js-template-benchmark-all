export function serveWithPortHint(options, fetchHandler) {
  const port = options.port || 8787;

  try {
    return Deno.serve(options, fetchHandler);
  } catch (err) {
    if (err.name === "AddrInUse" || err.message?.includes("address already in use")) {
      console.error(`\n[ERROR] Port ${port} is already in use.`);
      console.error(`To troubleshoot, identify the occupying process:`);
      console.error(`  ss -tlnp | grep :${port}           # Linux`);
      console.error(`  lsof -iTCP:${port} -sTCP:LISTEN -n -P # macOS / Linux`);
      console.error(`\nOr specify a different port in .env (e.g. PORT=8788)\n`);
    }
    throw err;
  }
}
