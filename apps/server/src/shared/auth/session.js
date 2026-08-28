import { globalCache } from "../cache/memory-cache.js";
import { timingSafeEqual } from "../crypto/constant-time-compare.js";

const LOCKOUT_KEY = "auth:lockout";
const FAILURE_KEY = "auth:failures";

function getSecretKey() {
  const secret = Deno.env.get("APP_ENCRYPTION_KEY") || "dev-secret-encryption-key-for-local-32c";
  return new TextEncoder().encode(secret);
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

/**
 * PBKDF2 密码哈希
 */
export async function hashPassword(password, customSalt) {
  const encoder = new TextEncoder();
  const salt = customSalt || crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const hashBase64 = bytesToBase64(new Uint8Array(derivedBits));
  const saltBase64 = bytesToBase64(salt);
  return `${saltBase64}:${hashBase64}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [saltBase64, expectedHashBase64] = storedHash.split(":");
  const salt = base64ToBytes(saltBase64);
  const derived = await hashPassword(password, salt);
  const [, actualHashBase64] = derived.split(":");

  return timingSafeEqual(actualHashBase64, expectedHashBase64);
}

/**
 * 登录限流与锁定检查
 */
export function checkLockout() {
  const lockedUntil = globalCache.get(LOCKOUT_KEY);
  if (lockedUntil && Date.now() < lockedUntil) {
    const remainingSec = Math.ceil((lockedUntil - Date.now()) / 1000);
    return { locked: true, remainingSec };
  }
  return { locked: false };
}

export function recordLoginFailure() {
  const failures = (globalCache.get(FAILURE_KEY) || 0) + 1;
  globalCache.set(FAILURE_KEY, failures, 1800); // 30 min window

  if (failures >= 5) {
    // Exponential backoff: 30s * 2^(failures - 5), capped at 30 min (1800s)
    const backoffSec = Math.min(1800, 30 * Math.pow(2, failures - 5));
    const lockedUntil = Date.now() + backoffSec * 1000;
    globalCache.set(LOCKOUT_KEY, lockedUntil, backoffSec);
    return { locked: true, remainingSec: backoffSec };
  }

  return { locked: false, failuresRemaining: 5 - failures };
}

export function resetLoginFailures() {
  globalCache.delete(FAILURE_KEY);
  globalCache.delete(LOCKOUT_KEY);
}

/**
 * HMAC 会话令牌生成
 */
export async function issueSessionToken(durationSeconds, storageKind = "persistent", db) {
  const jti = crypto.randomUUID();
  const iat = Math.floor(Date.now() / 1000);
  const exp = durationSeconds ? iat + durationSeconds : null;

  const payload = { jti, iat, exp, storageKind };
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = bytesToBase64(new TextEncoder().encode(payloadJson));

  const key = await crypto.subtle.importKey(
    "raw",
    getSecretKey(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadBase64),
  );

  const sigBase64 = bytesToBase64(new Uint8Array(sigBuffer));
  const token = `${payloadBase64}.${sigBase64}`;

  // Persist session to core_sessions table
  if (db) {
    const issuedAt = new Date(iat * 1000).toISOString();
    const expiresAt = exp ? new Date(exp * 1000).toISOString() : null;
    await db.execute(
      "INSERT INTO core_sessions (id, issued_at, expires_at, storage_kind) VALUES (?, ?, ?, ?)",
      [jti, issuedAt, expiresAt, storageKind],
    );
  }

  return { token, payload };
}

/**
 * HMAC 令牌校验
 */
export async function verifySessionToken(token, db) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [payloadBase64, sigBase64] = token.split(".");
  if (!payloadBase64 || !sigBase64) return null;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      getSecretKey(),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const sigBytes = base64ToBytes(sigBase64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(payloadBase64),
    );

    if (!valid) return null;

    const payloadJson = new TextDecoder().decode(base64ToBytes(payloadBase64));
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    // Check revocation in core_sessions table (with 30s cache)
    if (db) {
      const sessionCacheKey = `session:${payload.jti}`;
      let session = globalCache.get(sessionCacheKey);
      if (!session) {
        const rows = await db.query("SELECT * FROM core_sessions WHERE id = ?", [payload.jti]);
        session = rows[0] || null;
        if (session) {
          globalCache.set(sessionCacheKey, session, 30);
        }
      }

      if (!session || session.revoked_at) {
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
}

export async function revokeSessionToken(jti, db) {
  if (!jti || !db) return;
  const now = new Date().toISOString();
  await db.execute("UPDATE core_sessions SET revoked_at = ? WHERE id = ?", [now, jti]);
  globalCache.delete(`session:${jti}`);
}
