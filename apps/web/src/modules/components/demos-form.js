import { toast } from "../../shared/ui/index.js";

export function getFormDemo(id) {
  switch (id) {
    case "input":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 22rem; width: 100%;">
              <ds-input placeholder="标准输入框 (Default Input)..." id="demo-inp-1"></ds-input>
              <ds-input placeholder="带初始值的输入框..." value="https://antigravity.google.com"></ds-input>
              <ds-input placeholder="禁用状态 (Disabled)" disabled value="只读内容"></ds-input>
            </div>
          `;
          container.querySelector("#demo-inp-1")?.addEventListener("ds-change", (e) => {
            toast.info(`输入变更: ${e.detail.value}`);
          });
        },
        code: `<ds-input placeholder="请输入内容..."></ds-input>`,
        slots: `data-slot="input"`,
      };

    case "textarea":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="max-width: 24rem; width: 100%;">
              <ds-textarea placeholder="请输入多行文本或备注信息..." rows="4"></ds-textarea>
            </div>
          `;
        },
        code: `<ds-textarea placeholder="请输入备注..." rows="4"></ds-textarea>`,
        slots: `data-slot="textarea"`,
      };

    case "select":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="max-width: 20rem; width: 100%;">
              <ds-select id="demo-select"></ds-select>
            </div>
          `;
          const sel = container.querySelector("#demo-select");
          if (sel) {
            sel.placeholder = "请选择部署区域";
            sel.options = [
              { value: "us-east", label: "美东 (US East - N. Virginia)" },
              { value: "ap-east", label: "亚太 (Asia Pacific - Hong Kong)" },
              { value: "eu-west", label: "欧洲 (Europe - Frankfurt)" },
            ];
            sel.addEventListener("ds-change", (e) => {
              toast.info(`已选区域: ${e.detail.value}`);
            });
          }
        },
        code:
          `<ds-select placeholder="请选择..."></ds-select>\n\n<script>\n  const sel = document.querySelector("ds-select");\n  sel.options = [\n    { value: "opt1", label: "选项一" },\n    { value: "opt2", label: "选项二" }\n  ];\n</script>`,
        slots: `data-slot="select", data-slot="select-trigger", data-slot="select-content"`,
      };

    case "native-select":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="max-width: 18rem; width: 100%;">
              <ds-native-select>
                <option value="system">跟随系统 (System)</option>
                <option value="light">浅色模式 (Light)</option>
                <option value="dark">深色模式 (Dark)</option>
              </ds-native-select>
            </div>
          `;
        },
        code:
          `<ds-native-select>\n  <option value="1">选项一</option>\n  <option value="2">选项二</option>\n</ds-native-select>`,
        slots: `data-slot="native-select"`,
      };

    case "checkbox":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              <ds-checkbox label="接收每日工作汇总简报" checked></ds-checkbox>
              <ds-checkbox label="允许邮件接收重要安全更新通知"></ds-checkbox>
              <ds-checkbox label="禁用选项 (不可编辑)" disabled></ds-checkbox>
            </div>
          `;
        },
        code: `<ds-checkbox label="我已阅读并同意用户协议" checked></ds-checkbox>`,
        slots: `data-slot="checkbox", data-slot="checkbox-indicator"`,
      };

    case "switch":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 20rem; width: 100%;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: var(--text-sm); font-weight: 500;">飞行模式</span>
                <ds-switch id="sw-airplane"></ds-switch>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: var(--text-sm); font-weight: 500;">无线局域网</span>
                <ds-switch id="sw-wifi" checked></ds-switch>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: var(--text-sm); font-weight: 500;">蓝牙设置 (禁用)</span>
                <ds-switch id="sw-bt" disabled></ds-switch>
              </div>
            </div>
          `;
          container.querySelector("#sw-airplane")?.addEventListener("ds-change", (e) => {
            toast.info(`飞行模式: ${e.detail.checked ? "已开启" : "已关闭"}`);
          });
          container.querySelector("#sw-wifi")?.addEventListener("ds-change", (e) => {
            toast.info(`无线网络: ${e.detail.checked ? "已开启" : "已关闭"}`);
          });
        },
        code: `<ds-switch checked></ds-switch>`,
        slots: `data-slot="switch", data-slot="switch-thumb"`,
      };

    case "radio-group":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="max-width: 20rem; width: 100%;">
              <ds-radio-group id="demo-radio" value="pro"></ds-radio-group>
            </div>
          `;
          const rg = container.querySelector("#demo-radio");
          if (rg) {
            rg.items = [
              { value: "free", label: "免费版 (Starter - $0/月)" },
              { value: "pro", label: "专业版 (Pro - $20/月)" },
              { value: "enterprise", label: "企业版 (Enterprise)" },
            ];
            rg.addEventListener("ds-change", (e) => {
              toast.info(`选择订阅计划: ${e.detail.value}`);
            });
          }
        },
        code: `<ds-radio-group value="pro"></ds-radio-group>`,
        slots: `data-slot="radio-group", data-slot="radio-group-item"`,
      };

    case "slider":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 22rem; width: 100%;">
              <div style="display: flex; justify-content: space-between; font-size: var(--text-sm);">
                <span>屏幕亮度调节</span>
                <span id="slider-val" style="font-weight: 600;">75%</span>
              </div>
              <ds-slider min="0" max="100" value="75" id="demo-slider"></ds-slider>
            </div>
          `;
          const sl = container.querySelector("#demo-slider");
          sl?.addEventListener("ds-input", (e) => {
            const valEl = container.querySelector("#slider-val");
            if (valEl) valEl.textContent = `${e.detail.value}%`;
          });
        },
        code: `<ds-slider min="0" max="100" value="75"></ds-slider>`,
        slots: `data-slot="slider"`,
      };

    case "input-otp":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-3); align-items: center;">
              <div style="font-size: var(--text-sm); color: var(--color-fg-muted);">请输入发送至手机的 6 位验证码</div>
              <ds-input-otp length="6" id="demo-otp"></ds-input-otp>
            </div>
          `;
          container.querySelector("#demo-otp")?.addEventListener("ds-change", (e) => {
            if (e.detail.value.length === 6) {
              toast.success(`验证码输入完成: ${e.detail.value}`);
            }
          });
        },
        code: `<ds-input-otp length="6"></ds-input-otp>`,
        slots: `data-slot="input-otp", data-slot="input-otp-slot"`,
      };

    case "input-group":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 24rem; width: 100%;">
              <ds-input-group prefix-text="https://">
                <ds-input placeholder="my-custom-domain.com"></ds-input>
              </ds-input-group>
              <ds-input-group suffix-text="@example.com">
                <ds-input placeholder="alex.chen"></ds-input>
              </ds-input-group>
            </div>
          `;
        },
        code:
          `<ds-input-group prefix-text="https://">\n  <ds-input placeholder="domain.com"></ds-input>\n</ds-input-group>`,
        slots: `data-slot="input-group"`,
      };

    case "field":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="max-width: 22rem; width: 100%;">
              <ds-field label="工作空间名称" description="支持 2-30 位中英文字符。" error="">
                <ds-input value="生产研发中心"></ds-input>
              </ds-field>
            </div>
          `;
        },
        code:
          `<ds-field label="用户名" description="您的唯一标识" error="">\n  <ds-input></ds-input>\n</ds-field>`,
        slots: `data-slot="field", data-slot="field-label", data-slot="field-description"`,
      };

    case "label":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; align-items: center; gap: var(--space-3);">
              <ds-checkbox id="cb-terms"></ds-checkbox>
              <ds-label for="cb-terms">我已完整阅读并同意《服务条款与隐私政策》</ds-label>
            </div>
          `;
        },
        code: `<ds-label for="cb-id">表单项说明标签</ds-label>`,
        slots: `data-slot="label"`,
      };

    case "combobox":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="max-width: 20rem; width: 100%;">
              <ds-combobox>
                <ds-button slot="trigger" variant="outline" icon="search">选择框架技术栈...</ds-button>
                <div style="padding: var(--space-2); display: flex; flex-direction: column; gap: var(--space-1);">
                  <ds-button variant="ghost" size="sm" style="width: 100%; justify-content: flex-start;">Vanilla JS</ds-button>
                  <ds-button variant="ghost" size="sm" style="width: 100%; justify-content: flex-start;">Hono</ds-button>
                  <ds-button variant="ghost" size="sm" style="width: 100%; justify-content: flex-start;">Web Components</ds-button>
                </div>
              </ds-combobox>
            </div>
          `;
        },
        code:
          `<ds-combobox>\n  <ds-button slot="trigger">选择...</ds-button>\n  <div>选项列表...</div>\n</ds-combobox>`,
        slots: `data-slot="combobox"`,
      };

    default:
      return null;
  }
}
