// apps/server/src/shared/crypto/constant-time-compare.js — 常数时间比较（Auth.md §8）
//
// 平台无关的手写实现：不等长直接返回 false（长度本身不敏感），等长时
// 全字节异或累积，执行时间只与长度相关，不随内容早退。避免时序攻击
// 探测密码哈希/令牌签名的部分正确性。

/**
 * @param {Uint8Array | string} a
 * @param {Uint8Array | string} b
 * @returns {boolean}
 */
export function constantTimeEqual(a, b) {
  const ba = typeof a === "string" ? new TextEncoder().encode(a) : a;
  const bb = typeof b === "string" ? new TextEncoder().encode(b) : b;
  if (ba.length !== bb.length) return false;

  let diff = 0;
  for (let i = 0; i < ba.length; i++) {
    diff |= ba[i] ^ bb[i];
  }
  return diff === 0;
}
