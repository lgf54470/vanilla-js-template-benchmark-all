// apps/server/src/shared/crypto/password.js — PBKDF2 密码哈希（Auth.md §10.1）
//
// 存储格式: pbkdf2$<iterations>$<saltB64>$<hashB64>
// 零依赖：crypto.subtle.deriveBits。比较用常数时间比较。

import { constantTimeEqual } from "./constant-time-compare.js";

const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const PREFIX = "pbkdf2";

function base64Encode(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64Decode(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function derive(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    keyMaterial,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/**
 * @param {string} password
 * @returns {Promise<string>} 可持久化的哈希字符串
 */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${base64Encode(salt)}$${base64Encode(hash)}`;
}

/**
 * @param {string} password 明文
 * @param {string} stored pbkdf2$... 哈希字符串
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== PREFIX) return false;
  const iterations = Number(parts[1]);
  const salt = base64Decode(parts[2]);
  const expected = base64Decode(parts[3]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const actual = await derive(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}
