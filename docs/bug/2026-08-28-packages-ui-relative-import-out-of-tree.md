# 2026-08-28: packages/ui 跨包相对路径引用 apps/web 导致浏览器动态 ESM 加载 404 白屏

- 影响范围：前端所有通过 `@ui` 或 `packages/ui` 动态引入组件的页面模块，导致浏览器控制台报 `TypeError: Failed to fetch dynamically imported module`
- 发现方式：浏览器点击组件库路由时报错 `Failed to load module components: TypeError: Failed to fetch dynamically imported module: http://localhost:8788/src/modules/components/index.js`

## 现象

访问 `http://localhost:8788/#/components?c=button` 时，控制台报错：

```
module-registry.js:41 Failed to load module components: TypeError: Failed to fetch dynamically imported module: http://localhost:8788/src/modules/components/index.js
```

## 排查过程

1. 编写自动化 ESM 依赖拓扑递归爬虫脚本（`crawl.js`），模拟浏览器 ESM 加载链路；
2. 递归遍历 `http://127.0.0.1:8788/src/modules/components/index.js` 及其全部静态与动态导入；
3. 发现其中 `packages/ui/appearance-sheet/appearance-sheet.js` 存在跨包相对路径引用：
   ```javascript
   import { ... } from "../../../apps/web/src/shared/lib/appearance.js";
   ```
4. 浏览器在加载 `/packages/ui/appearance-sheet/appearance-sheet.js` 时，计算出的相对 URL 为 `/apps/web/src/shared/lib/appearance.js`；
5. 由于后端静态资源处理器的 Web 根目录为 `apps/web/`，该请求被路由映射为 `apps/web/apps/web/src/shared/lib/appearance.js`，返回 HTTP 404，进而中断了整棵 ESM 依赖树的解析。

## 根因

公共包 `packages/ui/` 违反了 Monorepo 单向依赖与边界隔离原则，反向相对引用了应用层 `apps/web/` 下的源码文件。

## 修复

1. 将 `appearance-sheet` 所需的主题状态计算逻辑下沉并独立到 `packages/ui/appearance-sheet/appearance-state.js`；
2. 移除 `packages/ui/appearance-sheet/appearance-sheet.js` 中所有对 `apps/web/` 的相对引用，严格保证 `packages/ui` 的无依赖纯粹性；
3. 编写全站 120+ 个 ESM 模块拓扑爬取测试，确保整站模块依赖树 100% 返回 HTTP 200。

## 如何避免复发

- 严禁 `packages/*` 公共包通过相对路径（`../`）引用任何 `apps/*` 应用层代码；
- 每次组件库改动后运行 ESM 拓扑图完整性自动化扫描。
