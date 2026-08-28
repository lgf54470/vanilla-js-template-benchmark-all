// apps/server/src/shared/crypto/field-crypto.js — 字段级 AES-GCM 加解密（Database.md §5.2）
//
// 密钥来自平台机密 APP_ENCRYPTION_KEY：先 SHA-256 归一化为 32 字节 raw key，
// 再 AES-GCM 加密。密文 = base64(iv || ciphertext)。平台无关（WebCrypto），
// 本地/边缘运行时同一份代码。

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

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

async function importKey(keyMaterial) {
  const material = typeof keyMaterial === "string"
    ? new TextEncoder().encode(keyMaterial)
    : keyMaterial;
  const keyBytes = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * @param {string} plaintext
 * @param {string | Uint8Array} keyMaterial 来自 APP_ENCRYPTION_KEY
 * @returns {Promise<string>} base64(iv || ciphertext)
 */
export async function encryptField(plaintext, keyMaterial) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importKey(keyMaterial);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return base64Encode(concatBytes(iv, new Uint8Array(cipher)));
}

/**
 * @param {string} payload base64(iv || ciphertext)
 * @param {string | Uint8Array} keyMaterial
 * @returns {Promise<string>}
 */
export async function decryptField(payload, keyMaterial) {
  const bytes = base64Decode(payload);
  const iv = bytes.slice(0, 12);
  const key = await importKey(keyMaterial);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    bytes.slice(12),
  );
  return new TextDecoder().decode(plain);
}
