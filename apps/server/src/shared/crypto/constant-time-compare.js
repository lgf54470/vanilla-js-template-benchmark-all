/**
 * shared/crypto/constant-time-compare.js — 常数时间比较（docs/Auth.md §8）。
 *
 * 平台无关实现：先比对长度（长度本身不敏感，SQLite 哈希串定长），
 * 再对所有字节做 XOR 累积，避免时序攻击探测前缀正确性。
 */
export function constantTimeEqual(a, b) {
  const enc = new TextEncoder();
  const left = typeof a === "string" ? enc.encode(a) : a;
  const right = typeof b === "string" ? enc.encode(b) : b;
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}
