/**
 * shared/auth/token.js — HMAC-SHA256 会话令牌签发与校验（docs/Auth.md §7）。
 *
 * 令牌结构：base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload))。
 * payload：{ jti, iat, exp? }；exp 缺省表示 sessionStorage 类会话（浏览器关闭
 * 即失效由客户端存储保证，服务端留 30 天兜底由调用方写入 exp）。
 */
const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(
    /=+$/,
    "",
  );
}

function fromBase64Url(text) {
  const padded = text.replaceAll("-", "+").replaceAll("_", "/") +
    "=".repeat((4 - text.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** 签发令牌。exp（Unix 秒）可缺省。 */
export async function signHmacToken(payload, secret) {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(body),
  );
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

/**
 * 校验令牌签名与有效期，通过返回 payload，否则返回 null。
 * 不查吊销表（那是 auth-middleware 的事）。
 */
export async function verifyHmacToken(token, secret) {
  if (typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64Url(sig),
      encoder.encode(body),
    );
  } catch {
    return null;
  }
  if (!valid) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (typeof payload.jti !== "string") return null;
    if (
      payload.exp !== undefined && payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
