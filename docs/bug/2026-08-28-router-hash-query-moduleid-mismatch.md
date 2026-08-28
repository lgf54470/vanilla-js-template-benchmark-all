# 2026-08-28: 前端路由器带 Query 参数的 Hash 路由解析 404

- 影响范围：前端所有携带 URL Query 参数的模块导航（如 `#/components?c=switch`），导致模块无法正确挂载并显示 404 错误页
- 发现方式：访问带查询参数的路由链接（如 `#/components?c=switch`）时，页面显示 404 "Module 'components?c=switch' not found"

## 现象

访问 `http://127.0.0.1:8788/#/components?c=switch` 时，页面未正常渲染组件库页面，而是渲染了 404 空状态占位与「返回首页」按钮，面包屑显示为 `modules.components?c=switch`。

## 排查过程

1. 检查前端单页路由器 `apps/web/src/shared/core/router.js` 中的 `getCurrentModuleId()` 实现；
2. 发现原有逻辑为 `hash.replace(/^#\/?/, "").split("/")[0]`，仅以斜杠 `/` 分割路径，未剥离 URL 查询字符串 `?`；
3. 导致计算出的 `moduleId` 为 `"components?c=switch"`，而模块注册表中注册的模块 ID 为 `"components"`，两者匹配失败触发 404 分支；
4. 同时排查发现 `apps/web/src/modules/components/index.js` 默认导出了函数而非标准生命周期对象 `{ mount, unmount }`。

## 根因

1. `Router.getCurrentModuleId()` 缺少对 `?` 查询参数的过滤截断；
2. 新增模块 `components` 的入口导出格式未对齐标准模块协议 `{ mount, unmount }`。

## 修复

1. 修改 `apps/web/src/shared/core/router.js` 中的 `getCurrentModuleId()`：
   ```javascript
   getCurrentModuleId() {
     const hash = globalThis.window ? globalThis.window.location.hash : "";
     const clean = hash.replace(/^#\/?/, "").split("?")[0].split("/")[0] || "";
     return clean || "dashboard";
   }
   ```
2. 重构 `apps/web/src/modules/components/index.js`，采用标准模块生命周期对象导出：
   ```javascript
   export default {
     async mount(container) { ... },
     async unmount() { ... }
   };
   ```
3. 在 `apps/web/tests/unit/core/router.test.js` 中增加针对带 query 参数路由的单元测试断言。

## 如何避免复发

- 单元测试覆盖带 `?` 参数、带子路径 `/` 等不同 Hash 格式的模块 ID 解析与加载验证；
- 遵循统一的模块导出规范（遵循 `mount(container, ctx)` / `unmount()` 接口）。
