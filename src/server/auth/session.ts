/**
 * src/server/auth/session.ts
 * نشست کاربر: کوکی HttpOnly (یا هدر Bearer برای کلاینت‌های API) → کاربر PostgreSQL.
 *
 *   requireAuth   توکن معتبر، کاربر فعال، باشگاه فعال، نسخهٔ نشست برابر
 *   requireRole   نقش مجاز (permissions.ts)
 *   requireGym    باشگاه درخواست: باشگاه خود کاربر؛ مدیر کل با هدر X-Gym-Id
 */

import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import * as t from '../../db/schema.ts';
import type { Database } from '../../db/index.ts';
import type { AppRole } from '../../lib/auth/permissions';
import type { UserAccount } from '../../lib/store/gymStore';
import { signJwt, verifyJwt } from './crypto.ts';
import { userFromRow } from '../repository.ts';

export const SESSION_COOKIE = 'hg_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface AuthContext {
  user: UserAccount;
  mustChangePassword: boolean;
  /** باشگاهی که درخواست روی آن اجرا می‌شود */
  gymId: string | null;
  /** هویت عملیات: مدیر کل داخل یک باشگاه با اختیارات مدیر همان باشگاه عمل می‌کند */
  actor: UserAccount;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters');
  }
  return secret;
}

export function issueSession(res: Response, user: { id: string; sessionVersion: number }) {
  const token = signJwt({ sub: user.id, ver: user.sessionVersion }, jwtSecret(), SESSION_TTL_SECONDS);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: '/',
  });
  return token;
}

export function clearSession(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

function tokenFrom(req: Request): string | null {
  const cookie = (req as any).cookies?.[SESSION_COOKIE];
  if (cookie) return cookie;
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

/** پاسخ خطای استاندارد: کلید پیام تا مرورگر آن را ترجمه کند */
export function deny(res: Response, status: number, messageKey: string) {
  return res.status(status).json({ success: false, messageKey });
}

/** مسیرهایی که با «تغییر رمز اجباری» هم در دسترس‌اند */
const ALLOWED_BEFORE_PASSWORD_CHANGE = new Set(['/api/auth/me', '/api/auth/logout', '/api/auth/change-password']);

export function requireAuth(db: Database) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = tokenFrom(req);
      const claims = token ? verifyJwt(token, jwtSecret()) : null;
      if (!claims) return deny(res, 401, 'auth.unauthenticated');

      const [row] = await db.select().from(t.users).where(eq(t.users.id, claims.sub));
      if (!row || !row.isActive || row.sessionVersion !== claims.ver) {
        clearSession(res);
        return deny(res, 401, row && !row.isActive ? 'login.inactive' : 'auth.unauthenticated');
      }
      if (row.gymId) {
        const [gym] = await db.select({ isActive: t.gyms.isActive }).from(t.gyms).where(eq(t.gyms.id, row.gymId));
        if (!gym?.isActive) {
          clearSession(res);
          return deny(res, 403, 'login.gymInactive');
        }
      }

      const user = userFromRow(row);
      req.auth = { user, mustChangePassword: row.mustChangePassword, gymId: row.gymId, actor: user };

      if (row.mustChangePassword && !ALLOWED_BEFORE_PASSWORD_CHANGE.has(req.originalUrl.split('?')[0])) {
        return deny(res, 403, 'auth.passwordChangeRequired');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireRole(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.user.role;
    if (!role || !roles.includes(role)) return deny(res, 403, 'auth.forbidden');
    next();
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * باشگاه درخواست. مدیر کل باشگاه ندارد و با هدر X-Gym-Id وارد پنل یک باشگاه می‌شود؛
 * در آن حالت با اختیارات مدیر همان باشگاه عمل می‌کند.
 */
export function requireGym(db: Database) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = req.auth!;
      if (auth.user.role === 'super_admin') {
        const gymId = String(req.headers['x-gym-id'] ?? '');
        if (!UUID.test(gymId)) return deny(res, 400, 'common.invalidInput');
        const [gym] = await db.select({ id: t.gyms.id }).from(t.gyms).where(eq(t.gyms.id, gymId));
        if (!gym) return deny(res, 404, 'common.notFound');
        auth.gymId = gymId;
        auth.actor = { ...auth.user, role: 'owner', entityId: gymId, gymId };
      }
      if (!auth.gymId) return deny(res, 403, 'auth.forbidden');
      next();
    } catch (err) {
      next(err);
    }
  };
}
