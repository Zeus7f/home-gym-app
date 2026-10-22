/**
 * /api/auth — ورود، خروج، نشست فعلی و تغییر رمز.
 */

import { Router, type Request } from 'express';
import { eq, or, sql } from 'drizzle-orm';
import * as t from '../../db/schema.ts';
import type { Database } from '../../db/index.ts';
import { normalizeLoginId } from '../../lib/phone';
import { MIN_PASSWORD_LENGTH } from '../../lib/auth/accountRules';
import { hashPassword, verifyPassword } from '../auth/crypto.ts';
import { clearSession, deny, issueSession, requireAuth } from '../auth/session.ts';
import { gymFromRow, userFromRow } from '../repository.ts';
import { route, str } from '../http.ts';
import { RateLimiter } from '../rateLimit.ts';

// ۸ تلاش ناموفق در ۱۵ دقیقه برای هر IP + شناسه؛ ۳۰ تلاش برای هر IP
const perAccount = new RateLimiter(8, 15 * 60_000);
const perIp = new RateLimiter(30, 15 * 60_000);
const clientIp = (req: Request) => req.ip ?? req.socket.remoteAddress ?? 'unknown';

/** hash ثابت تا زمان پاسخ برای کاربر ناموجود هم مشابه باشد */
let dummyHash: Promise<string> | null = null;

export function authRoutes(db: Database) {
  const r = Router();

  r.post(
    '/login',
    route(async (req, res) => {
      const identifier = normalizeLoginId(str(req.body?.identifier ?? req.body?.username, 64));
      const password = str(req.body?.password, 200);
      if (!identifier || !password) return deny(res, 400, 'login.badCredentials');

      const ip = clientIp(req);
      const key = `${ip}|${identifier}`;
      if (perAccount.blocked(key) || perIp.blocked(ip)) return deny(res, 429, 'login.tooManyAttempts');

      const [row] = await db
        .select()
        .from(t.users)
        .where(or(eq(t.users.username, identifier), eq(t.users.phone, identifier)))
        .limit(1);

      dummyHash ??= hashPassword('timing-equaliser-password');
      const valid = await verifyPassword(password, row?.passwordHash ?? (await dummyHash));
      if (!row || !valid) {
        perAccount.hit(key);
        perIp.hit(ip);
        return deny(res, 401, 'login.badCredentials');
      }
      if (!row.isActive) return deny(res, 403, 'login.inactive');

      let gym: typeof t.gyms.$inferSelect | undefined;
      if (row.gymId) {
        [gym] = await db.select().from(t.gyms).where(eq(t.gyms.id, row.gymId));
        if (!gym?.isActive) return deny(res, 403, 'login.gymInactive');
      }

      perAccount.reset(key);
      await db.update(t.users).set({ lastLoginAt: new Date() }).where(eq(t.users.id, row.id));
      issueSession(res, row);
      res.json({
        success: true,
        messageKey: 'login.success',
        user: userFromRow(row),
        mustChangePassword: row.mustChangePassword,
        gym: gym ? gymFromRow(gym) : null,
      });
    })
  );

  r.post('/logout', (_req, res) => {
    clearSession(res);
    res.json({ success: true, messageKey: 'common.saved' });
  });

  r.get(
    '/me',
    requireAuth(db),
    route(async (req, res) => {
      const auth = req.auth!;
      const [gym] = auth.gymId ? await db.select().from(t.gyms).where(eq(t.gyms.id, auth.gymId)) : [];
      res.json({
        success: true,
        user: auth.user,
        mustChangePassword: auth.mustChangePassword,
        gym: gym ? gymFromRow(gym) : null,
      });
    })
  );

  r.post(
    '/change-password',
    requireAuth(db),
    route(async (req, res) => {
      const current = str(req.body?.currentPassword, 200);
      const next = str(req.body?.newPassword, 200);
      const [row] = await db.select().from(t.users).where(eq(t.users.id, req.auth!.user.id));
      if (!row || !(await verifyPassword(current, row.passwordHash))) return deny(res, 422, 'auth.wrongCurrentPassword');
      if (next.trim().length < MIN_PASSWORD_LENGTH) return deny(res, 422, 'account.weakPassword');
      if (next === current) return deny(res, 422, 'auth.samePassword');

      const [updated] = await db
        .update(t.users)
        .set({
          passwordHash: await hashPassword(next.trim()),
          mustChangePassword: false,
          sessionVersion: sql`${t.users.sessionVersion} + 1`,
        })
        .where(eq(t.users.id, row.id))
        .returning();
      // نشست‌های دیگر باطل می‌شوند؛ این دستگاه نشست تازه می‌گیرد
      issueSession(res, updated);
      res.json({ success: true, messageKey: 'account.passwordChanged' });
    })
  );

  return r;
}
