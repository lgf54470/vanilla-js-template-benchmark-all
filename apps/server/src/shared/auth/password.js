/**
 * shared/auth/password.js — PBKDF2 密码哈希（ARCHITECTURE.md §10.1）。
 *
 * 存储格式：pbkdf2$<iterations>$<saltB64>$<hashB64>（自描述，便于未来升级参数）。
 * 比较用 constantTimeEqual（docs/Auth.md §8）。
 */
import { constantTimeEqual } from "../crypto/constant-time-compare.js";

const ITERATIONS = 100_000;

function toBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      256,
    ),
  );
}

/** 哈希明文密码（注册/修改密码时用）。 */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** 校验明文密码与存储哈希是否匹配（常数时间）。 */
export async function verifyPassword(password, stored) {
  const parts = String(stored ?? "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;
  const salt = fromBase64(parts[2]);
  const expected = fromBase64(parts[3]);
  const actual = await derive(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}
