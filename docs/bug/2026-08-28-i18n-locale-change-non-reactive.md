# 2026-08-28: 切换语言后主页面及侧边栏未即时响应重绘

- 影响范围：用户切换语言（例如选择 English）后，主视图（如外观定制）与侧边栏部分文案仍然显示为之前的语言
- 发现方式：用户在右上角语言菜单切换后反馈内容未更新

## 现象

在语言切换器中选择 English，虽然本地存储更新且广播了 `locale:changed` 事件，但主视图（`<main>` 内挂载的模块）依然停留在中文，侧边栏菜单标题亦未刷新。

## 排查过程

1. 检查 `i18n.js` 的 `setLocale`，确认已触发 `eventBus.emit("locale:changed", { locale })`。
2. 检查路由系统 `router.js`，发现 `router.js` 仅监听了 `hashchange` 和 `router:navigate`，未监听 `locale:changed`。
3. 检查 `app-shell.js`，发现侧栏菜单项标题使用的是 `module.json` 中写死的中文文本 `m.title`，未走 `t("modules." + m.id)` 动态多语言字典。

## 根因

1. 路由中心缺少对 `locale:changed` 事件的订阅，未能在语言切换时重新装载渲染当前激活路由视图。
2. 侧边栏及部分模块未采用响应式事件监听或缺少完整的多语言字典命名空间。

## 修复

1. 在 `router.js` 中监听 `locale:changed` 事件并重新执行当前路由的挂载渲染：
   ```javascript
   eventBus.on("locale:changed", () => {
     this._handleHashChange();
   });
   ```
2. 在 `apps/web/src/shared/i18n/{zh-CN,zh-TW,en}.json` 中补齐 `modules`、`sidebar`、`user` 等完整命名空间。
3. 在 `app-shell.js`、`nav-user.js` 与 `appearance/index.js` 中全面接入动态翻译与事件响应机制。

## 如何避免复发

- 在 i18n 单元测试与端到端测试中增加语言切换后全局多语言字典渲染的回归断言。
