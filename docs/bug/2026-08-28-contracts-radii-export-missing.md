# 2026-08-28: @contracts/constants.js 遗漏 RADII 导出导致语法错误

- 影响范围：`<ds-appearance-sheet>` 和外观定制中心无法加载，导致脚本执行中断
- 发现方式：浏览器控制台报 `SyntaxError: The requested module '@contracts/constants.js' does not provide an export named 'RADII'`

## 现象

浏览器控制台报错：

```
appearance-sheet.js:2 Uncaught SyntaxError: The requested module '@contracts/constants.js' does not provide an export named 'RADII' (at appearance-sheet.js:2:37)
```

## 排查过程

1. 检查 `appearance-sheet.js` 头部导入：
   `import { BASE_COLORS, CHART_COLORS, FONTS, RADII, STYLES } from "@contracts/constants.js";`
2. 检查 `packages/contracts/constants.js`，发现仅导出了 `STORAGE_KEYS`、`BREAKPOINTS`、`SESSION_DURATIONS`、`STYLES`、`BASE_COLORS` 等，遗漏了 `RADII` 常量定义。

## 根因

契约文件与 UI 组件在迭代过程中接口不一致，缺少 `RADII` 的命名导出。

## 修复

在 `packages/contracts/constants.js` 中补齐标准 `RADII` 数组常量：

```javascript
export const RADII = [
  { value: "default", labelKey: "settings.radiusOptions.default", px: "0.625rem" },
  { value: "none", labelKey: "settings.radiusOptions.none", px: "0rem" },
  { value: "sm", labelKey: "settings.radiusOptions.sm", px: "0.25rem" },
  { value: "md", labelKey: "settings.radiusOptions.md", px: "0.5rem" },
  { value: "lg", labelKey: "settings.radiusOptions.lg", px: "0.75rem" },
  { value: "full", labelKey: "settings.radiusOptions.full", px: "9999px" },
];
```

## 如何避免复发

- 将 `@contracts/constants.js` 的完整命名导出引入前端单元测试断言中。
