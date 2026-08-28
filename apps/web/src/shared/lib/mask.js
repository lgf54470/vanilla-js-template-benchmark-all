/**
 * 敏感数据前端掩码处理
 */
export function maskValue(value, maskType = "generic") {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (!str) return "";

  if (maskType === "email") {
    const atIndex = str.indexOf("@");
    if (atIndex > 1) {
      const user = str.slice(0, atIndex);
      const domain = str.slice(atIndex + 1);
      const maskedUser = user[0] + "***" + (user.length > 2 ? user[user.length - 1] : "");
      const dotIndex = domain.lastIndexOf(".");
      const domainName = dotIndex > 0 ? domain.slice(0, dotIndex) : domain;
      const tld = dotIndex > 0 ? domain.slice(dotIndex) : "";
      const maskedDomain = (domainName.length > 1 ? domainName[0] : "") + "***" + tld;
      return `${maskedUser}@${maskedDomain}`;
    }
    return str[0] + "***";
  }

  if (maskType === "phone") {
    if (str.length >= 11) {
      return str.slice(0, 3) + "****" + str.slice(7);
    } else if (str.length >= 7) {
      return str.slice(0, 3) + "****" + str.slice(-2);
    }
    return str.slice(0, 1) + "***" + str.slice(-1);
  }

  // Generic mask: keep head & tail, mask middle
  if (str.length <= 4) {
    return str[0] + "***";
  } else if (str.length <= 8) {
    return str.slice(0, 2) + "****" + str.slice(-2);
  } else {
    return str.slice(0, 3) + "******" + str.slice(-3);
  }
}
