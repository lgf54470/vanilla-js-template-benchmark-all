/**
 * shared/crypto/field-crypto.js — 敏感字段 AES-GCM 加解密（docs/Database.md §5.2）。
 *
 * 密文格式：base64(iv[12] || ciphertext)。keyMaterial 来自平台机密
 * APP_ENCRYPTION_KEY；经 SHA-256 收敛为 256-bit AES 密钥（允许人读机密串）。
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

const keyCache = new Map();

async function importKey(keyMaterial) {
  if (keyCache.has(keyMaterial)) return keyCache.get(keyMaterial);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(keyMaterial),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
  keyCache.set(keyMaterial, key);
  return key;
}

/** 加密明文字段，返回 base64 密文。 */
export async function encryptField(plaintext, keyMaterial) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importKey(keyMaterial);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );
  const bytes = new Uint8Array(iv.length + cipher.byteLength);
  bytes.set(iv);
  bytes.set(new Uint8Array(cipher), iv.length);
  return toBase64(bytes);
}

/** 解密 encryptField 产出的密文；密钥不符/密文损坏时抛错。 */
export async function decryptField(payload, keyMaterial) {
  const bytes = fromBase64(payload);
  const iv = bytes.slice(0, 12);
  const key = await importKey(keyMaterial);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    bytes.slice(12),
  );
  return decoder.decode(plain);
}
