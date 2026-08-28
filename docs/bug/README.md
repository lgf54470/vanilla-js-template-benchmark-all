# docs/bug/ — 事故与缺陷复盘库

记录**已经发生、值得留档**的 bug——不是日常的 issue 跟踪（那属于 GitHub Issues），而是“排查过程本身有参考价值”或“根因不明显、以后可能再犯”的问题。文件名规范：`YYYY-MM-DD-<slug>.md`。

## 什么值得写在这里

- 排查耗时较长、过程中走过弯路的问题（记录弯路本身就是价值，帮后来者少走）。
- 根因涉及本模板的架构假设被打破的情况（如原生 ES 模块裸导入限制、W3C Custom Elements 标准限制等）。
- 任何最终改动了 `ARCHITECTURE.md`/`docs/*.md` 规范或测试套件机制的 bug。

## 记录索引

### 1. 原生 ES 模块与加载链路

- [2026-08-28: 原生 ES 模块导入 @contracts/ 裸路径解析失败](./2026-08-28-contracts-import-path.md)
- [2026-08-28: resize-handle.js 导出函数命名不一致导致整站白屏](./2026-08-28-resize-handle-export-mismatch.md)
- [2026-08-28: @contracts/constants.js 遗漏 RADII 导出导致语法错误](./2026-08-28-contracts-radii-export-missing.md)

### 2. Web Components 标准与组件生命周期

- [2026-08-28: 同一构造函数多次注册 CustomElementRegistry 抛 NotSupportedError](./2026-08-28-toast-duplicate-customelement-define.md)

### 3. 多语言体系与响应式联动

- [2026-08-28: 切换语言后主页面及侧边栏未即时响应重绘](./2026-08-28-i18n-locale-change-non-reactive.md)

### 4. 路由系统与模块加载规范

- [2026-08-28: 前端路由器带 Query 参数的 Hash 路由解析 404](./2026-08-28-router-hash-query-moduleid-mismatch.md)
