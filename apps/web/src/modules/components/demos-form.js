import { toast } from "../../shared/ui/index.js";

export function getFormDemo(id) {
  switch (id) {
    case "input":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-6); max-width: 26rem; width: 100%;">
              <!-- 1. 基础与类型 (Basic & Types) -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">基础输入与不同类型 (Basic & Types)</div>
                <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                  <ds-input type="email" placeholder="电子邮箱 (Email)" id="demo-inp-email"></ds-input>
                  <ds-input type="password" placeholder="密码输入 (Password)" value="Secret@123"></ds-input>
                  <ds-input type="text" placeholder="带初始值 (Default Value)" value="https://ui.shadcn.com"></ds-input>
                </div>
              </div>

              <!-- 2. 带图标 (With Icons) -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">前置与后置图标 (With Icons)</div>
                <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                  <ds-input icon="search" icon-position="start" placeholder="搜索关键字..."></ds-input>
                  <ds-input icon="mail" icon-position="start" placeholder="alex.chen@example.com"></ds-input>
                  <ds-input icon="lock" icon-position="end" type="password" placeholder="安全凭证"></ds-input>
                </div>
              </div>

              <!-- 3. 校验失败与禁用态 (Invalid & Disabled) -->
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">错误校验与禁用态 (Invalid & Disabled)</div>
                <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                  <ds-input invalid value="invalid-email-format" placeholder="错误状态"></ds-input>
                  <ds-input disabled value="已锁定的只读配置" placeholder="禁用状态"></ds-input>
                </div>
              </div>
            </div>
          `;
          container.querySelector("#demo-inp-email")?.addEventListener("ds-change", (e) => {
            toast.info(`邮箱输入: ${e.detail.value}`);
          });
        },
        code:
          `<ds-input type="email" placeholder="Email"></ds-input>\n<ds-input icon="search" placeholder="Search..."></ds-input>\n<ds-input invalid value="bad-value"></ds-input>\n<ds-input disabled></ds-input>`,
        slots: `data-slot="input", data-slot="input-wrapper"`,
      };

    case "textarea":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 26rem; width: 100%;">
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">多行文本域 (Textarea)</div>
                <ds-textarea placeholder="请输入您的系统需求或反馈建议..." rows="4"></ds-textarea>
              </div>
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">禁用态 (Disabled)</div>
                <ds-textarea disabled rows="3">此文本区域已由系统策略全局锁定，禁止编辑。</ds-textarea>
              </div>
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
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 22rem; width: 100%;">
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">部署云区域 (Select)</div>
                <ds-select id="demo-select"></ds-select>
              </div>
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">禁用态 (Disabled)</div>
                <ds-select disabled placeholder="当前环境不可选"></ds-select>
              </div>
            </div>
          `;
          const sel = container.querySelector("#demo-select");
          if (sel) {
            sel.placeholder = "请选择数据中心区域";
            sel.options = [
              { value: "us-east", label: "美东 (US East - N. Virginia)" },
              { value: "ap-east", label: "亚太 (Asia Pacific - Hong Kong)" },
              { value: "eu-west", label: "欧洲 (Europe - Frankfurt)" },
              { value: "sa-east", label: "南美 (South America - São Paulo)" },
            ];
            sel.addEventListener("ds-change", (e) => {
              toast.info(`已选区域: ${e.detail.value}`);
            });
          }
        },
        code:
          `<ds-select placeholder="请选择..."></ds-select>\n\n<script>\n  const sel = document.querySelector("ds-select");\n  sel.options = [\n    { value: "us-east", label: "US East" },\n    { value: "eu-west", label: "EU West" }\n  ];\n</script>`,
        slots: `data-slot="select", data-slot="select-wrapper"`,
      };

    case "native-select":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 20rem; width: 100%;">
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-fg);">外观主题 (Native Select)</div>
                <ds-native-select>
                  <option value="system">跟随系统 (System)</option>
                  <option value="light">浅色模式 (Light)</option>
                  <option value="dark">深色模式 (Dark)</option>
                </ds-native-select>
              </div>
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
            <div style="display: flex; flex-direction: column; gap: var(--space-5); max-width: 26rem; width: 100%;">
              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                <div style="font-size: var(--text-xs); color: var(--color-fg-muted); font-weight: 600;">基础状态 (Basic States)</div>
                <ds-checkbox label="接收每日工作汇总简报" checked id="demo-cb-1"></ds-checkbox>
                <ds-checkbox label="允许邮件接收重要安全更新通知" id="demo-cb-2"></ds-checkbox>
              </div>

              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                <div style="font-size: var(--text-xs); color: var(--color-fg-muted); font-weight: 600;">带说明文本 (With Description)</div>
                <div style="display: flex; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background-color: var(--color-card);">
                  <ds-checkbox checked id="demo-cb-desc"></ds-checkbox>
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-size: var(--text-sm); font-weight: 500; color: var(--color-fg);">双重身份验证 (2FA)</span>
                    <span style="font-size: var(--text-xs); color: var(--color-fg-muted);">每次从新设备登录时，均需通过认证器输入动态验证码。</span>
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                <div style="font-size: var(--text-xs); color: var(--color-fg-muted); font-weight: 600;">禁用状态 (Disabled)</div>
                <ds-checkbox label="已锁定配置项 (选中且禁用)" checked disabled></ds-checkbox>
                <ds-checkbox label="无权限修改项 (未选且禁用)" disabled></ds-checkbox>
              </div>
            </div>
          `;

          container.querySelectorAll("ds-checkbox:not([disabled])").forEach((cb) => {
            cb.addEventListener("ds-change", (e) => {
              const label = cb.getAttribute("label") || "复选框";
              toast.info(`${label}: ${e.detail.checked ? "已勾选" : "已取消"}`);
            });
          });
        },
        code:
          `<div class="flex items-center space-x-2">\n  <ds-checkbox id="terms" checked></ds-checkbox>\n  <ds-label for="terms">我已同意《服务协议》</ds-label>\n</div>`,
        slots: `data-slot="checkbox", data-slot="checkbox-indicator"`,
      };

    case "switch":
      return {
        render: (container) => {
          container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 22rem; width: 100%;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: var(--text-sm); font-weight: 500;">飞行模式</div>
                  <div style="font-size: var(--text-xs); color: var(--color-fg-muted);">禁用所有无线电广播</div>
                </div>
                <ds-switch id="sw-airplane"></ds-switch>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: var(--text-sm); font-weight: 500;">无线局域网 (Wi-Fi)</div>
                  <div style="font-size: var(--text-xs); color: var(--color-fg-muted);">已连接至 Office-5G</div>
                </div>
                <ds-switch id="sw-wifi" checked></ds-switch>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: var(--text-sm); font-weight: 500;">蓝牙设置 (禁用)</div>
                  <div style="font-size: var(--text-xs); color: var(--color-fg-muted);">策略禁止开启</div>
                </div>
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
            <div style="max-width: 22rem; width: 100%;">
              <ds-radio-group id="demo-radio" value="pro"></ds-radio-group>
            </div>
          `;
          const rg = container.querySelector("#demo-radio");
          if (rg) {
            rg.items = [
              { value: "free", label: "免费版 (Starter - $0/月)" },
              { value: "pro", label: "专业版 (Pro - $20/月)" },
              { value: "enterprise", label: "企业版 (Enterprise - 定制)" },
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
                <span>音量输出级别</span>
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
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 26rem; width: 100%;">
              <ds-input-group prefix-text="https://">
                <ds-input placeholder="my-custom-domain.com"></ds-input>
              </ds-input-group>
              <ds-input-group suffix-text="@google.com">
                <ds-input placeholder="username"></ds-input>
              </ds-input-group>
              <ds-input-group prefix-text="$" suffix-text=".00">
                <ds-input placeholder="1,000"></ds-input>
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
            <div style="display: flex; flex-direction: column; gap: var(--space-4); max-width: 24rem; width: 100%;">
              <ds-field label="工作空间名称" description="支持 2-30 位中英文字符。">
                <ds-input value="生产研发中心"></ds-input>
              </ds-field>
              <ds-field label="访问密钥 (API Key)" description="请妥善保管您的端到端密钥。" error="密钥格式错误，必须以 sk_live_ 开头">
                <ds-input invalid value="invalid_key_xxx"></ds-input>
              </ds-field>
            </div>
          `;
        },
        code:
          `<ds-field label="用户名" description="您的唯一标识" error="">\n  <ds-input></ds-input>\n</ds-field>`,
        slots:
          `data-slot="field", data-slot="field-label", data-slot="field-description", data-slot="field-error"`,
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
            <div style="max-width: 22rem; width: 100%;">
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
