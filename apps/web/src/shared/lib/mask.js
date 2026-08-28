/**
 * shared/lib/mask.js — 敏感字段前端掩码（docs/Database.md §5.3）。
 *
 * 纯函数：email → `u***@e***.com`；phone → `138****1234`；
 * generic → 首尾各留 1-2 字符。明文经 property 传入组件，掩码态为默认展示态，
 * 眼睛图标切换由 <masked-field> 组件负责（本文件只做算法）。
 */

/**
 * @param {string} value
 * @param {"email" | "phone" | "generic"} type
 * @returns {string}
 */
export function maskValue(value, type = "generic") {
  const text = String(value ?? "");
  if (!text) return "";
  if (type === "email") return maskEmail(text);
  if (type === "phone") return maskPhone(text);
  return maskGeneric(text);
}

/** `u***@e***.com`：本地部分/域名各留首字符，TLD 完整保留。 */
function maskEmail(text) {
  const at = text.indexOf("@");
  if (at <= 0 || at === text.length - 1) return maskGeneric(text);
  const local = text.slice(0, at);
  const domain = text.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  const name = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : "";
  return `${local.slice(0, 1)}***@${name.slice(0, 1)}***${tld}`;
}

/** `138****1234`：前 3 后 4，中间固定 4 星；长度不足时退化为 generic。 */
function maskPhone(text) {
  const digits = text.replace(/\D/g, "");
  if (digits.length < 11) return maskGeneric(text);
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

/** 首尾各留 1-2 字符，中间以 *** 概括。 */
function maskGeneric(text) {
  if (text.length <= 2) return "*";
  if (text.length <= 6) return `${text.slice(0, 1)}***${text.slice(-1)}`;
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
}
