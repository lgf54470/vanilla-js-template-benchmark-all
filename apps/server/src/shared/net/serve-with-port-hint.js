/**
 * shared/net/serve-with-port-hint.js — 端口占用时给出进程线索（docs/Deployment.md §9）。
 *
 * 进程识别尽力而为：无 ss/lsof/netstat 或缺少 --allow-run 权限时退回通用建议。
 */
async function findOccupant(port) {
  const commands = [
    ["netstat", ["-ano", "-p", "tcp"]], // Windows
    ["ss", ["-tlnp"]], // Linux
    ["lsof", ["-iTCP:" + port, "-sTCP:LISTEN", "-n", "-P"]], // macOS/Linux
  ];
  for (const [cmd, args] of commands) {
    try {
      const output = await new Deno.Command(cmd, {
        args,
        stdout: "piped",
        stderr: "null",
      }).output();
      const text = new TextDecoder().decode(output.stdout);
      const line = text.split("\n").find((l) =>
        l.includes(`:${port}`) && /LISTEN/i.test(l)
      );
      if (line) return line.trim();
    } catch { /* 该平台无此命令或无权限 */ }
  }
  return null;
}

/** Deno.serve 包装：AddrInUse 时打印占用进程与建议后退出。 */
export async function serveWithPortHint({ port, handler, signal }) {
  try {
    const server = Deno.serve({ port, signal }, handler);
    return await server.finished;
  } catch (err) {
    if (String(err?.message ?? err).includes("AddrInUse")) {
      const occupant = await findOccupant(port);
      console.error(`端口 ${port} 已被占用（AddrInUse）。`);
      if (occupant) console.error(`  占用连接：${occupant}`);
      console.error(
        "  排查：结束占用进程，或在 .env 把 PORT 改为空闲端口（详见 docs/Deployment.md §9）。",
      );
      Deno.exit(1);
    }
    throw err;
  }
}
