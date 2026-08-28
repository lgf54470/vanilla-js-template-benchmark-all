// apps/server/src/shared/auth/token.js — HMAC 会话令牌签发/校验（Auth.md §7）
//
// 令牌 = base64url(payloadJson) + "." + base64url(hmacSha256(payload, secret))
// payload: { jti, iat, exp? }。secret 来自 APP_ENCRYPTION_KEY。
// 平台无关（WebCrypto HMAC-SHA256）。

function base64UrlEncode(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function importKey(secret) {
  const material = typeof secret === "string"
    ? new TextEncoder().encode(secret)
    : secret;
  const keyBytes = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * 签发令牌。
 * @param {{ jti: string, exp?: number }} payload 除 iat 外由调用方给定
 * @param {string | Uint8Array} secret
 */
export async function signSessionToken(payload, secret) {
  const full = { iat: Math.floor(Date.now() / 1000), ...payload };
  const json = JSON.stringify(full);
  const data = new TextEncoder().encode(json);
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${base64UrlEncode(data)}.${base64UrlEncode(new Uint8Array(sig))}`;
}

/**
 * 校验签名与 exp，返回 payload；非法返回 null。
 * @param {string} token
 * @param {string | Uint8Array} secret
 * @returns {Promise<{ jti: string, iat: number, exp?: number } | null>}
 */
export async function verifySessionToken(token, secret) {
  if (typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const [payloadB64, sigB64] = [token.slice(0, dot), token.slice(dot + 1)];
  let payloadBytes;
  try {
    payloadBytes = base64UrlDecode(payloadB64);
    const expectedSig = base64UrlDecode(sigB64);
    const key = await importKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      expectedSig,
      payloadBytes,
    );
    if (!ok) return null;
  } catch {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }
  if (typeof payload?.jti !== "string") return null;

  if (
    typeof payload.exp === "number" &&
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return payload;
}
