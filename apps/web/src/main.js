// 应用入口（ARCHITECTURE.md §3：src/main.js）。
// M1：令牌层就位后初始化外观引擎（PREPAINT 已先行应用，此处幂等对齐并接管）。
// M4 起改为「无令牌渲染独立登录页 / 已登录装配 AppShell」的门控装配
// （docs/Auth.md §1 前端门控）。

import { initAppearance } from "@shared/lib/appearance.js";

initAppearance();

console.debug("[vanilla-js-template] M1 tokens ready");
