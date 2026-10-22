/**
 * src/server/auth/crypto.ts
 * hash رمز (scrypt) و توکن JWT (HS256) فقط با ماژول crypto خود Node — بدون سرویس خارجی.
 */

import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const scrypt = (password: string, salt: Buffer, keylen: number, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)))
  );

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/** قالب ذخیره: scrypt$N$r$p$salt(base64)$hash(base64) */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 64 * 1024 * 1024 });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const key = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

// ── JWT (HS256) ─────────────────────────────────────────────────────────────

export interface SessionClaims {
  /** شناسهٔ کاربر */
  sub: string;
  /** نسخهٔ نشست: با تغییر رمز یا غیرفعال‌سازی عوض می‌شود تا توکن‌های قبلی باطل شوند */
  ver: number;
  iat: number;
  exp: number;
}

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

export function signJwt(claims: Omit<SessionClaims, 'iat' | 'exp'>, secret: string, ttlSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ ...claims, iat: now, exp: now + ttlSeconds }));
  const sig = b64url(createHmac('sha256', secret).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

export function verifyJwt(token: string, secret: string): SessionClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
  const given = fromB64url(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const h = JSON.parse(fromB64url(header).toString('utf8'));
    if (h.alg !== 'HS256') return null;
    const claims = JSON.parse(fromB64url(payload).toString('utf8')) as SessionClaims;
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') return null;
    if (claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}
