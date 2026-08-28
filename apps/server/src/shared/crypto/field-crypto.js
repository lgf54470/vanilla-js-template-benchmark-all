/**
 * 字段级 AES-GCM 加解密
 * 密钥来自 APP_ENCRYPTION_KEY 环境变量
 */

function getKeyMaterial() {
  const rawKey = Deno.env.get("APP_ENCRYPTION_KEY") || "dev-secret-encryption-key-for-local-32c";
  return new TextEncoder().encode(rawKey.padEnd(32, "0").slice(0, 32));
}

async function getCryptoKey(keyMaterial) {
  return await crypto.subtle.importKey(
    "raw",
    keyMaterial || getKeyMaterial(),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptField(plaintext, customKey) {
  if (plaintext === null || plaintext === undefined) return plaintext;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getCryptoKey(customKey);
  const encoded = new TextEncoder().encode(String(plaintext));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  return bytesToBase64(combined);
}

export async function decryptField(payload, customKey) {
  if (!payload || typeof payload !== "string") return payload;
  try {
    const combined = base64ToBytes(payload);
    if (combined.length < 13) return payload; // Invalid ciphertext

    const iv = combined.slice(0, 12);
    const cipherBytes = combined.slice(12);
    const key = await getCryptoKey(customKey);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherBytes,
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    // Return original string if not encrypted or decryption fails
    return payload;
  }
}
