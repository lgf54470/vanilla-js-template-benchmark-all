# 2026-08-28: 同一构造函数多次注册 CustomElementRegistry 抛 NotSupportedError

- 影响范围：`<ds-toast>` 与 `<ds-toast-host>` 组件初始化失败，导致整站脚本执行中断白屏
- 发现方式：浏览器控制台报 `NotSupportedError: Failed to execute 'define' on 'CustomElementRegistry'`

## 现象

浏览器控制台报错：

```
toast.js:96 Uncaught NotSupportedError: Failed to execute 'define' on 'CustomElementRegistry': this constructor has already been used with this registry
    at toast.js:96:53
```

## 排查过程

1. 检查 `apps/web/src/shared/ui/toast/toast.js` 底部注册逻辑：
   ```javascript
   if (!customElements.get("ds-toast")) {
     customElements.define("ds-toast", DsToast);
   }
   if (!customElements.get("ds-toast-host")) {
     customElements.define("ds-toast-host", DsToast);
   }
   ```
2. 开发者试图给同一个 `DsToast` 类定义两个标签名别名（`ds-toast` 与 `ds-toast-host`）。
3. 根据 W3C Custom Elements 标准规范（DOM Standard 4.1.2），`customElements.define(name, constructor)` 要求 `constructor` 在 registry 中必须全局唯一，重复传入相同的构造函数必然抛出 `NotSupportedError`。

## 根因

同一个 JavaScript 类（构造函数引用）被多次传递给 `customElements.define`，违反了 W3C Web Components 标准。

## 修复

派生出继承自基类的专属子类：

```javascript
export class DsToastHost extends DsToast {}

if (!customElements.get("ds-toast")) {
  customElements.define("ds-toast", DsToast);
}
if (!customElements.get("ds-toast-host")) {
  customElements.define("ds-toast-host", DsToastHost);
}
```

## 如何避免复发

- 在 `apps/web/tests/unit/ui/components-import.test.js` 中严密模拟 W3C 标准的 `CustomElementRegistry`（增加 `constructorSet.has(constructor)` 校验），自动化回归测试所有 Web Components 注册行为。
