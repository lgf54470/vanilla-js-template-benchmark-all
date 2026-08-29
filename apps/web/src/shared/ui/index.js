// apps/web/src/shared/ui/index.js — 组件库聚合入口
// 画廊与 AppShell 统一从这里导入全部组件（副作用：注册自定义元素）。
// 新增组件后在此登记。

import "./button/button.js";
import "./input/input.js";
import "./checkbox/checkbox.js";
import "./display/display.js";
import "./tooltip/tooltip.js";
import "./segmented-control/segmented-control.js";
import "./dropdown-menu/dropdown-menu.js";
import "./dialog/dialog.js";
import "./sheet/sheet.js";
import "./toast/toast.js";
import "./breadcrumb/breadcrumb.js";
import "./masked-field/masked-field.js";
import "./theme-switch/theme-switch.js";
import "./tabs/tabs.js";
import "./sidebar/sidebar-provider.js";
import "./sidebar/sidebar.js";
import "./sidebar/sidebar-menu.js";
import "./sidebar/workspace-switcher.js";
import "./sidebar/nav-user.js";

export { toast } from "./toast/toast.js";
export { confirmDialog } from "./dialog/dialog.js";
export { maskValue } from "../lib/mask.js";
