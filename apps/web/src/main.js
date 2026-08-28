/**
 * 应用入口（ARCHITECTURE.md §3）。
 * M0 骨架：探测后端健康检查；登录页/AppShell 在 M4+ 接入。
 */
const el = document.querySelector("#app");

try {
  const res = await fetch("/api/health");
  const body = await res.json();
  el.textContent = `M0 skeleton — backend: ${body.target}`;
} catch {
  el.textContent = "M0 skeleton — backend unreachable";
}
