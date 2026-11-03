/**
 * /api/auth — ورود، خروج، نشست فعلی و تغییر رمز.
 */

import { Router, type Request } from 'express';
import { eq, inArray, or, sql } from 'drizzle-orm';
import * as t from '../../db/schema.ts';
import type { Database } from '../../db/index.ts';
import { normalizeLoginId } from '../../lib/phone';
import { MIN_PASSWORD_LENGTH } from '../../lib/auth/accountRules';
import { hashPassword, verifyPassword } from '../auth/crypto.ts';
import { clearSession, deny, issueSession, requireAuth } from '../auth/session.ts';
import { appRole, gymFromRow, membershipsOf, userFromRow, type MembershipRow } from '../repository.ts';
import { route, str } from '../http.ts';
import { RateLimiter } from '../rateLimit.ts';
import type { RoleOption } from '../../lib/domain/gymManagement';

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

      // نقش‌های این هویت؛ ورود با تازه‌ترین نقشِ استفاده‌شده انجام می‌شود
      const memberships = await membershipsOf(db, row.id);
      const active = memberships[0];
      if (memberships.length > 0 && !active) return deny(res, 403, 'login.noRole');

      const gymId = active ? active.gymId : row.gymId;
      let gym: typeof t.gyms.$inferSelect | undefined;
      if (gymId) {
        [gym] = await db.select().from(t.gyms).where(eq(t.gyms.id, gymId));
        if (!gym?.isActive) return deny(res, 403, 'login.gymInactive');
      }

      perAccount.reset(key);
      await db.update(t.users).set({ lastLoginAt: new Date() }).where(eq(t.users.id, row.id));
      if (active) await touchMembership(db, active.id);
      issueSession(res, row, active?.id);
      res.json({
        success: true,
        messageKey: 'login.success',
        user: userFromRow(row, active),
        mustChangePassword: row.mustChangePassword,
        gym: gym ? gymFromRow(gym) : null,
        roles: await describeRoles(db, memberships),
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
        roles: await describeRoles(db, await membershipsOf(db, auth.user.id)),
      });
    })
  );

  /** تعویض نقش فعال — بدون ورود دوباره؛ فقط میان نقش‌های خودِ همین هویت */
  r.post(
    '/switch-role',
    requireAuth(db),
    route(async (req, res) => {
      const auth = req.auth!;
      const roleId = str(req.body?.roleId, 80);
      const memberships = await membershipsOf(db, auth.user.id);
      const next = memberships.find(m => m.id === roleId);
      if (!next) return deny(res, 404, 'auth.roleNotFound');

      let gym: typeof t.gyms.$inferSelect | undefined;
      if (next.gymId) {
        [gym] = await db.select().from(t.gyms).where(eq(t.gyms.id, next.gymId));
        if (!gym?.isActive) return deny(res, 403, 'login.gymInactive');
      }

      const [row] = await db.select().from(t.users).where(eq(t.users.id, auth.user.id));
      await touchMembership(db, next.id);
      issueSession(res, row, next.id);
      res.json({
        success: true,
        messageKey: 'auth.roleSwitched',
        user: userFromRow(row, next),
        mustChangePassword: row.mustChangePassword,
        gym: gym ? gymFromRow(gym) : null,
        roles: await describeRoles(db, memberships),
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


/** آخرین استفاده از یک نقش — نقش پیش‌فرض ورود بعدی را تعیین می‌کند. */
async function touchMembership(db: Database, roleId: string) {
  await db.update(t.userRoles).set({ lastUsedAt: new Date() }).where(eq(t.userRoles.id, roleId));
}

/**
 * نقش‌ها به شکلی که رابط کاربری نشان می‌دهد: نام باشگاه و نام شخص در آن نقش.
 * فهرست تک‌عضوی هم برگردانده می‌شود تا مرورگر لازم نباشد حالت خاص بسازد.
 */
async function describeRoles(db: Database, memberships: MembershipRow[]): Promise<RoleOption[]> {
  if (memberships.length === 0) return [];

  const gymIds = [...new Set(memberships.map(m => m.gymId).filter(Boolean))] as string[];
  const gymRows = gymIds.length
    ? await db.select({ id: t.gyms.id, name: t.gyms.name }).from(t.gyms).where(inArray(t.gyms.id, gymIds))
    : [];
  const gymNames = new Map(gymRows.map(g => [g.id, g.name]));

  const trainerIds = memberships.filter(m => m.role === 'trainer' && m.entityId).map(m => m.entityId!);
  const memberIds = memberships.filter(m => m.role === 'member' && m.entityId).map(m => m.entityId!);
  const trainerRows = trainerIds.length
    ? await db.select({ id: t.trainers.id, name: t.trainers.name }).from(t.trainers).where(inArray(t.trainers.id, trainerIds))
    : [];
  const memberRows = memberIds.length
    ? await db.select({ id: t.members.id, name: t.members.name }).from(t.members).where(inArray(t.members.id, memberIds))
    : [];
  const labels = new Map([...trainerRows, ...memberRows].map(x => [x.id, x.name]));

  return memberships.map(m => ({
    id: m.id,
    role: appRole(m.role),
    gymId: m.gymId ?? undefined,
    gymName: m.gymId ? gymNames.get(m.gymId) : undefined,
    label: m.entityId ? labels.get(m.entityId) : undefined,
  }));
}
