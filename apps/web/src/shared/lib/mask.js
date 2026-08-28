// apps/web/src/shared/lib/mask.js — 敏感字段掩码（Database.md §5.3）
//
// mask-type: email(u***@e***.com) | phone(138****1234) | generic(首尾各留 1-2 字符)

/**
 * @param {string} value 明文
 * @param {'email'|'phone'|'generic'} type
 * @returns {string} 掩码文本
 */
export function maskValue(value, type = "generic") {
  if (!value) return "";
  if (type === "email") return maskEmail(value);
  if (type === "phone") return maskPhone(value);
  return maskGeneric(value);
}

function maskEmail(email) {
  const at = email.indexOf("@");
  if (at <= 0) return maskGeneric(email);
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.indexOf(".");
  const domainPart = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : "";
  const ml = maskGeneric(local, 2);
  const md = maskGeneric(domainPart, 1);
  return `${ml}@${md}${tld}`;
}

function maskPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return phone.replace(/./g, "*");
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  const starLen = digits.length - 7;
  return `${head}${"*".repeat(Math.max(starLen, 4))}${tail}`;
}

function maskGeneric(str, keep = 1) {
  if (str.length <= keep * 2) return "*".repeat(str.length);
  return str.slice(0, keep) + "*".repeat(str.length - keep * 2) +
    str.slice(-keep);
}
