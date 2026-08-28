// apps/web/src/main.js — 应用入口
// M1：实例化外观引擎（加载偏好 + 应用到 <html>）；
// M3：dev 画廊路由 /__dev/components（先加载 zh-CN 字典供组件文案翻译）；
// M4 起：登录门控 + 装配 AppShell（bootstrap）。
import { appearance } from "@shared/lib/appearance.js";

appearance.apply();

const app = document.querySelector("#app");

if (location.pathname === "/__dev/components") {
  Promise.all([
    import("@shared/gallery.js"),
    import("@shared/lib/i18n.js"),
  ]).then(async ([{ renderGallery }, { injectDictionary }]) => {
    // 画廊离线/独立打开时也能展示中文文案：注入 zh-CN 字典（fetch 失败不阻塞）
    try {
      const res = await fetch("/src/shared/i18n/zh-CN.json");
      if (res.ok) injectDictionary("zh-CN", await res.json());
    } catch {
      // 静默：无字典时组件显示 key
    }
    renderGallery(app);
  });
} else {
  import("./app/assemble.js").then(({ bootstrap }) => bootstrap());
}
