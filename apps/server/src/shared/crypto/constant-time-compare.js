/**
 * 常数时间比较两个字符串或 Uint8Array，防止时序侧信道攻击
 */
export function timingSafeEqual(a, b) {
  if (typeof a === "string" && typeof b === "string") {
    const encoder = new TextEncoder();
    return timingSafeEqualBytes(encoder.encode(a), encoder.encode(b));
  }
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    return timingSafeEqualBytes(a, b);
  }
  return false;
}

function timingSafeEqualBytes(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let c = 0;
  for (let i = 0; i < a.length; i++) {
    c |= a[i] ^ b[i];
  }
  return c === 0;
}
