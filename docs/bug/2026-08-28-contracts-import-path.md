# 2026-08-28: 原生 ES 模块导入 @contracts/ 裸路径解析失败

- 影响范围：前端所有依赖 `@contracts/` 的模块与页面，导致首页无法加载脚本白屏
- 发现方式：浏览器控制台报 `TypeError: Failed to resolve module specifier "@contracts/constants.js"`

## 现象

浏览器控制台报错：

```
(index):1 Uncaught TypeError: Failed to resolve module specifier "@contracts/constants.js". Relative references must start with either "/", "./", or "../".
```

## 排查过程

1. 检查各前端模块的 `import` 语句，发现模块中引用了共享契约 `import { ... } from "@contracts/constants.js"`。
2. 浏览器原生 ES Module 环境下不支持未配置的裸模块导入（Bare Specifier），必须以 `/`、`./`、`../` 开头，或者借助浏览器原生 `<script type="importmap">`。
3. 进一步排查本地开发服务器静态资源路由，发现本地 Hono 静态文件中间件仅挂载了 `apps/web/`，未开放根目录下 `packages/contracts/` 目录的静态映射。

## 根因

1. `index.html` 缺失 importmap 声明，浏览器无法解析 `@contracts/` 路径。
2. 后端开发环境静态资源处理器缺少对 `packages/contracts` 的额外根路径（`extraRoots`）映射。

## 修复

1. 在 `apps/web/index.html` 的 `<head>` 中添加标准 importmap：
   ```html
   <script type="importmap">
   {
     "imports": {
       "@contracts/": "/packages/contracts/"
     }
   }
   </script>
   ```
2. 在 `apps/server/src/shared/static/static-handler.js` 中支持 `extraRoots` 配置：
   ```javascript
   extraRoots: {
     "/packages/contracts": "packages/contracts"
   }
   ```

## 如何避免复发

- 在 `apps/server/tests/integration/app/full-flow.test.js` 和 UI 冒烟测试中增加对静态资源路由与 importmap 路径解析的断言。
