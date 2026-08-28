// apps/server/src/shared/net/serve.js — Deno.serve 封装（Deployment.md §9）
//
// 端口占用时尽力识别占用进程并给出改端口建议（无 ss/lsof/netstat 或无
// --allow-run 权限时退回通用建议）。

import { createLogger } from "../logger/logger.js";

const log = createLogger({ module: "net" });

function findProcessHint(port) {
  const candidates = [
    ["ss", ["-tlnp", `sport = :${port}`]],
    ["lsof", ["-iTCP", `:${port}`, "-sTCP:LISTEN", "-n", "-P"]],
    ["netstat", ["-ano", "|", "findstr", `:${port}`]],
  ];
  for (const [cmd, args] of candidates) {
    try {
      const proc = new Deno.Command(cmd, {
        args,
        stdout: "piped",
        stderr: "piped",
      }).outputSync();
      const out = new TextDecoder().decode(proc.stdout);
      if (out.trim()) {
        return `${cmd}: ${out.trim().split("\n").slice(0, 3).join(" | ")}`;
      }
    } catch {
      // 命令不存在或无权限，尝试下一个
    }
  }
  return null;
}

/**
 * 启动 HTTP 服务；AddrInUse 时给出诊断。
 * @param {(req: Request) => Response | Promise<Response>} handler
 * @param {number} port
 * @param {{ hostname?: string }} [opts]
 * @returns {Promise<void>}
 */
export async function serveWithPortHint(handler, port, opts = {}) {
  const { hostname = "0.0.0.0" } = opts;
  try {
    const server = Deno.serve({
      port,
      hostname,
      onListen: ({ port: p }) => {
        log.info(
          `listening on http://${
            hostname === "0.0.0.0" ? "localhost" : hostname
          }:${p}`,
        );
      },
    }, handler);
    await server.finished;
  } catch (err) {
    if (err instanceof Error && err.message.includes("AddrInUse")) {
      const hint = findProcessHint(port);
      log.error(
        `端口 ${port} 已被占用${
          hint ? `（${hint}）` : ""
        }。改 .env 的 PORT 换一个空闲端口再试，` +
          `或结束占用进程后重跑 just dev（Deployment.md §9）`,
      );
    }
    throw err;
  }
}
