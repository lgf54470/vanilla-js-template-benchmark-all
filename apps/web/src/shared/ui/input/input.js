// apps/web/src/shared/ui/input/input.js — <ds-input> / <ds-textarea> / <ds-select>
import { attachStyles, define } from "../base.js";
import { iconSvg } from "../../lib/icons.js";

const FIELD_CSS = `
:host{display:block;width:100%}
.field{position:relative;width:100%}
input,textarea,select{width:100%;height:var(--ds-input-height);
  padding:0 var(--ds-input-padding-x);border-radius:var(--ds-input-radius);
  font-size:var(--ds-input-font-size);line-height:1.4;
  background:var(--ds-input-bg);border:1px solid var(--ds-input-border);
  color:var(--color-fg)}
textarea{height:auto;min-height:6rem;padding:calc(var(--ds-input-height)/2 - .7rem) var(--ds-input-padding-x);resize:vertical}
select{appearance:none;padding-right:2rem;background-image:linear-gradient(45deg,transparent 50%,var(--color-fg-muted) 50%),linear-gradient(135deg,var(--color-fg-muted) 50%,transparent 50%);background-position:calc(100% - 1.1rem) 50%,calc(100% - .8rem) 50%;background-size:.3rem .3rem;background-repeat:no-repeat}
input:focus-visible,textarea:focus-visible,select:focus-visible{outline:none;border-color:var(--color-ring);box-shadow:0 0 0 2px var(--ds-input-focus-ring)}
input::placeholder,textarea::placeholder{color:var(--color-fg-muted)}
input:disabled,textarea:disabled,select:disabled{opacity:.5;cursor:not-allowed}
.prefix-icon{position:absolute;left:.7rem;top:50%;transform:translateY(-50%);color:var(--color-fg-muted);pointer-events:none}
.prefix-icon + input{padding-left:2.2rem}
`;

class DsInput extends HTMLElement {
  static observedAttributes = [
    "placeholder",
    "value",
    "type",
    "disabled",
    "readonly",
  ];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, FIELD_CSS);
    this._input = null;
  }
  connectedCallback() {
    this._render();
    this._input.addEventListener("input", () => {
      // 实时输入反射回宿主 value 属性（登录/表单多用 getAttribute("value") 读取）
      this.setAttribute("value", this._input.value);
      this.dispatchEvent(new CustomEvent("input", { bubbles: true }));
    });
    this._input.addEventListener("change", () => {
      this.dispatchEvent(new CustomEvent("change", { bubbles: true }));
    });
    // 单行输入框 Enter 提交宿主所在 light-DOM 表单（shadow 内原生 input 与
    // 表单无关联，浏览器不会自动提交——就历史 bug ds-input/button 同源）
    this._input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const form = this.closest?.("form");
      if (form?.requestSubmit) {
        e.preventDefault();
        form.requestSubmit();
      }
    });
  }
  attributeChangedCallback(name) {
    if (!this._input) return;
    if (name === "value") {
      // 仅值变化：直接同步内部 input，避免整棵 re-render 丢失焦点/光标
      const v = this.getAttribute("value") ?? "";
      if (this._input.value !== v) this._input.value = v;
      return;
    }
    this._render();
  }
  _render() {
    const type = this.getAttribute("type") ?? "text";
    const placeholder = this.getAttribute("placeholder") ?? "";
    const value = this.getAttribute("value") ?? "";
    const icon = this.getAttribute("icon");
    this.shadowRoot.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "field";
    if (icon) {
      const holder = document.createElement("span");
      holder.className = "prefix-icon";
      holder.innerHTML = iconSvg(icon, 15);
      wrap.append(holder);
    }
    const input = document.createElement("input");
    input.type = type;
    input.placeholder = placeholder;
    input.value = value;
    if (this.hasAttribute("disabled")) input.disabled = true;
    if (this.hasAttribute("readonly")) input.readOnly = true;
    wrap.append(input);
    this.shadowRoot.append(wrap);
    this._input = input;
  }
  get value() {
    return this._input?.value ?? "";
  }
  set value(v) {
    this.setAttribute("value", v ?? "");
  }
}
define("ds-input", DsInput);

class DsTextarea extends HTMLElement {
  static observedAttributes = ["placeholder", "value", "disabled"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, FIELD_CSS);
    this._area = null;
  }
  connectedCallback() {
    this._render();
    this._area.addEventListener("input", () => {
      // 与 ds-input 一致：实时输入反射回宿主 value 属性
      this.setAttribute("value", this._area.value);
      this.dispatchEvent(new CustomEvent("input", { bubbles: true }));
    });
  }
  attributeChangedCallback(name) {
    if (!this._area) return;
    if (name === "value") {
      const v = this.getAttribute("value") ?? "";
      if (this._area.value !== v) this._area.value = v;
      return;
    }
    this._render();
  }
  _render() {
    const placeholder = this.getAttribute("placeholder") ?? "";
    const value = this.getAttribute("value") ?? "";
    this.shadowRoot.innerHTML = "";
    const area = document.createElement("textarea");
    area.placeholder = placeholder;
    area.value = value;
    if (this.hasAttribute("disabled")) area.disabled = true;
    this.shadowRoot.append(area);
    this._area = area;
  }
  get value() {
    return this._area?.value ?? "";
  }
  set value(v) {
    this.setAttribute("value", v ?? "");
  }
}
define("ds-textarea", DsTextarea);

class DsSelect extends HTMLElement {
  static observedAttributes = ["value", "disabled", "placeholder"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, FIELD_CSS);
    this._select = null;
  }
  connectedCallback() {
    this._render();
    this._select.addEventListener("change", () => {
      this.setAttribute("value", this._select.value);
      this.dispatchEvent(
        new CustomEvent("change", {
          bubbles: true,
          detail: { value: this._select.value },
        }),
      );
    });
  }
  attributeChangedCallback() {
    if (this._select && this.getAttribute("value") !== this._select.value) {
      this._render();
    }
  }
  _render() {
    const value = this.getAttribute("value") ?? "";
    const placeholder = this.getAttribute("placeholder");
    this.shadowRoot.innerHTML = "";
    const select = document.createElement("select");
    if (this.hasAttribute("disabled")) select.disabled = true;
    if (placeholder) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholder;
      opt.disabled = true;
      select.append(opt);
    }
    for (const child of [...this.children]) {
      if (child.tagName === "OPTION") {
        const opt = document.createElement("option");
        opt.value = child.getAttribute("value") ?? child.textContent;
        opt.textContent = child.textContent;
        select.append(opt);
      } else if (child.tagName === "OPTGROUP") {
        const group = document.createElement("optgroup");
        group.label = child.getAttribute("label") ?? "";
        for (const oc of child.children) {
          const opt = document.createElement("option");
          opt.value = oc.getAttribute("value") ?? oc.textContent;
          opt.textContent = oc.textContent;
          group.append(opt);
        }
        select.append(group);
      }
    }
    select.value = value;
    this.shadowRoot.append(select);
    this._select = select;
  }
  get value() {
    return this._select?.value ?? "";
  }
  set value(v) {
    this.setAttribute("value", v);
  }
}
define("ds-select", DsSelect);
