/**
 * BlockQuest Classroom - Auth Module
 * WebCrypto HMAC-SHA256 token signing and verification.
 * Zero external dependencies.
 *
 * Format: base64url(JSON).base64url(HMAC-SHA256)
 * Payload: { p: <playerId>, exp: <epochSeconds> } (TTL 30 days)
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Convert bytes to base64url (no padding, URL-safe).
 */
export function bytesToBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode base64url string to Uint8Array.
 */
export function base64UrlToBytes(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected string for base64url decode');
  }
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

export function textToBase64Url(text) {
  return bytesToBase64Url(encoder.encode(text));
}

export function base64UrlToText(str) {
  return decoder.decode(base64UrlToBytes(str));
}

/**
 * Constant-time comparison of two Uint8Arrays or two strings.
 */
export function timingSafeEqual(a, b) {
  if (typeof a === 'string' && typeof b === 'string') {
    const aBytes = encoder.encode(a);
    const bBytes = encoder.encode(b);
    if (aBytes.byteLength !== bBytes.byteLength) return false;
    let diff = 0;
    for (let i = 0; i < aBytes.byteLength; i++) {
      diff |= aBytes[i] ^ bBytes[i];
    }
    return diff === 0;
  }
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    if (a.byteLength !== b.byteLength) return false;
    let diff = 0;
    for (let i = 0; i < a.byteLength; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }
  return false;
}

/**
 * Generate cryptographically random 16-byte base64 salt.
 */
export function randomSalt(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

async function getHmacKey(secret) {
  const secretBytes = typeof secret === 'string' ? encoder.encode(secret) : secret;
  return await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Sign a token.
 * Payload format: { p: playerId, exp: epochSeconds }
 * TTL: 30 days (default if exp is omitted)
 */
export async function signToken(payload, secret) {
  if (!payload || typeof payload !== 'object') {
    throw new TypeError('Payload must be an object');
  }
  if (!secret) {
    throw new TypeError('Secret is required');
  }

  const p = payload.p !== undefined ? payload.p : payload.playerId;
  const exp = typeof payload.exp === 'number'
    ? payload.exp
    : Math.floor(Date.now() / 1000) + 30 * 86400;

  const cleanPayload = { p, exp };
  const payloadB64 = textToBase64Url(JSON.stringify(cleanPayload));

  const key = await getHmacKey(secret);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(sigBuffer));

  return `${payloadB64}.${sigB64}`;
}

/**
 * Decode payload from token without signature verification.
 * Returns { p, exp } or null if malformed.
 */
export function decodePayload(token) {
  if (typeof token !== 'string') return null;
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return null;
  const payloadB64 = token.slice(0, dotIndex);
  try {
    const jsonStr = base64UrlToText(payloadB64);
    const payload = JSON.parse(jsonStr);
    if (!payload || typeof payload !== 'object') return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify a token using constant-time comparison.
 * Returns:
 *   { valid: true, payload: { p, exp } }
 *   { valid: false, error: 'invalid' }
 *   { valid: false, error: 'expired' }
 */
export async function verifyToken(token, secret, nowSeconds) {
  if (typeof token !== 'string' || !secret) {
    return { valid: false, error: 'invalid' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'invalid' };
  }

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) {
    return { valid: false, error: 'invalid' };
  }

  let sigBytes;
  try {
    sigBytes = base64UrlToBytes(sigB64);
  } catch {
    return { valid: false, error: 'invalid' };
  }

  if (sigBytes.byteLength !== 32) {
    return { valid: false, error: 'invalid' };
  }

  let key;
  try {
    key = await getHmacKey(secret);
  } catch {
    return { valid: false, error: 'invalid' };
  }

  const expectedSigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const expectedSigBytes = new Uint8Array(expectedSigBuffer);

  const isValidSig = timingSafeEqual(sigBytes, expectedSigBytes);
  if (!isValidSig) {
    return { valid: false, error: 'invalid' };
  }

  let payload;
  try {
    const jsonStr = base64UrlToText(payloadB64);
    payload = JSON.parse(jsonStr);
  } catch {
    return { valid: false, error: 'invalid' };
  }

  if (!payload || typeof payload !== 'object' || payload.p === undefined) {
    return { valid: false, error: 'invalid' };
  }

  const currentSec = typeof nowSeconds === 'number' ? nowSeconds : Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= currentSec) {
    return { valid: false, error: 'expired' };
  }

  return { valid: true, payload };
}
