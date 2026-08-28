/**
 * 应用入口（ARCHITECTURE.md §3）。
 * M1：启动外观引擎（接管 PREPAINT 写入的类，监听 system 亮暗变化）；
 * AppShell/路由在 M4+ 接入。
 */
import { initAppearance } from "/src/shared/lib/appearance.js";

initAppearance();

const el = document.querySelector("#app");

try {
  const res = await fetch("/api/health");
  const body = await res.json();
  el.textContent = `M1 tokens — backend: ${body.target}`;
} catch {
  el.textContent = "M1 tokens — backend unreachable";
}
