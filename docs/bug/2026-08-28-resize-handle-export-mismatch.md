# 2026-08-28: resize-handle.js 导出函数命名不一致导致整站白屏

- 影响范围：前端应用 Shell (`<app-shell>`) 无法初始化，页面完全空白
- 发现方式：浏览器控制台报 `SyntaxError: The requested module './resize-handle.js' does not provide an export named 'initSidebarResize'`

## 现象

浏览器控制台报错：

```
app-shell.js:3 Uncaught SyntaxError: The requested module './resize-handle.js' does not provide an export named 'initSidebarResize' (at app-shell.js:3:10)
```

## 排查过程

1. 检查 `app-shell.js` 头部：
   `import { initSidebarResize } from "./resize-handle.js";`
2. 检查 `resize-handle.js`，发现文件内部仅导出了 `export function initResizeHandle(handleElement)`，函数名不一致导致 ES Module 解析失败。
3. 之前测试仅导入了 `src/shared/ui/index.js`，未导入 `app-shell.js` 和业务模块，导致未能提前在 CI 阶段发现此错误。

## 根因

重构代码时修改了导出的函数名，但调用方的导入语句未同步更新，且单元测试覆盖范围缺少对 Shell 主入口及业务模块的动态加载断言。

## 修复

1. 在 `resize-handle.js` 中同时实现并导出 `initSidebarResize` 和 `initResizeHandle`。
2. 升级 `apps/web/tests/unit/ui/components-import.test.js`，动态加载并断言 `app-shell.js`、`resize-handle.js` 以及全部 9 个业务模块（`analytics`, `appearance`, `bookmarks`, `dashboard`, `notes`, `passwords`, `settings`, `todo`, `workspace`）。

## 如何避免复发

- 在单元测试套件中实施全站模块全量动态导入机制，任何未导出的函数、类型错漏或语法错误均会在 `just test` 阶段立即报错并阻断提交。
