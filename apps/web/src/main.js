// apps/web/src/main.js — 应用入口
// M1：实例化外观引擎（加载偏好 + 应用到 <html>）；M4 起登录门控 + 装配 AppShell。
import { appearance } from "@shared/lib/appearance.js";

appearance.apply();

const app = document.querySelector("#app");
app.textContent = "vanilla-js-template — 外观引擎就绪";
