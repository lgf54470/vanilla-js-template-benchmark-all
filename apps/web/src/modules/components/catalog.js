/**
 * apps/web/src/modules/components/catalog.js
 * 62款官方 Shadcn Base UI 组件目录聚合入口
 */

import { CORE_COMPONENTS } from "./catalog-core.js";
import { EXTRA_COMPONENTS } from "./catalog-extra.js";

export const COMPONENT_CATEGORIES = [
  { id: "all", label: "全部组件" },
  { id: "general", label: "通用基础" },
  { id: "form", label: "表单输入" },
  { id: "data", label: "数据与展示" },
  { id: "feedback", label: "反馈与弹层" },
  { id: "navigation", label: "导航与布局" },
];

export const COMPONENT_CATALOG = [
  ...CORE_COMPONENTS,
  ...EXTRA_COMPONENTS,
];
