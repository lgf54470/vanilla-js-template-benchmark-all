// apps/web/src/main.js — 应用入口
// M1：实例化外观引擎（加载偏好 + 应用到 <html>）；M3：dev 画廊路由
// /__dev/components；M4 起登录门控 + 装配 AppShell。
import { appearance } from "@shared/lib/appearance.js";

appearance.apply();

const app = document.querySelector("#app");

if (location.pathname === "/__dev/components") {
  import("@shared/gallery.js").then(({ renderGallery }) => renderGallery(app));
} else {
  app.textContent = "freebuff — 外观引擎就绪";
}
