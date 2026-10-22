/**
 * /api/admin — پنل مدیر کل: باشگاه‌ها، حساب مدیران و وضعیت سامانه.
 */

import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { and, count, eq, sql } from 'drizzle-orm';
import * as t from '../../db/schema.ts';
import type { Database } from '../../db/index.ts';
import { isValidMobile, normalizePhone } from '../../lib/phone';
import { MIN_PASSWORD_LENGTH } from '../../lib/auth/accountRules';
import { hashPassword } from '../auth/crypto.ts';
import { deny } from '../auth/session.ts';
import { gymFromRow, userFromRow } from '../repository.ts';
import { bool, num, route, str } from '../http.ts';

const startedAt = Date.now();

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'gym'}-${randomUUID().slice(0, 8)}`;
}

export function adminRoutes(db: Database) {
  const r = Router();

  r.get(
    '/gyms',
    route(async (_req, res) => {
      const gyms = await db.select().from(t.gyms).orderBy(t.gyms.createdAt);
      const trainerCounts = await db.select({ gymId: t.trainers.gymId, n: count() }).from(t.trainers).groupBy(t.trainers.gymId);
      const memberCounts = await db.select({ gymId: t.members.gymId, n: count() }).from(t.members).groupBy(t.members.gymId);
      const owners = await db.select().from(t.users).where(eq(t.users.role, 'gym_owner'));
      const tc = new Map(trainerCounts.map(x => [x.gymId, Number(x.n)]));
      const mc = new Map(memberCounts.map(x => [x.gymId, Number(x.n)]));
      res.json({
        success: true,
        gyms: gyms.map(g => ({
          gym: gymFromRow(g),
          trainers: tc.get(g.id) ?? 0,
          members: mc.get(g.id) ?? 0,
          owner: owners.find(o => o.gymId === g.id) ? userFromRow(owners.find(o => o.gymId === g.id)!) : undefined,
        })),
      });
    })
  );

  /** باشگاه تازه + حساب مدیر آن (مدیر در اولین ورود رمز را عوض می‌کند) */
  r.post(
    '/gyms',
    route(async (req, res) => {
      const name = str(req.body?.name, 255).trim();
      const capacity = Math.round(num(req.body?.capacity));
      const ownerName = str(req.body?.ownerName, 255).trim();
      const phone = normalizePhone(str(req.body?.ownerPhone, 30));
      const password = str(req.body?.ownerPassword, 200).trim();
      if (!name) return deny(res, 422, 'gym.invalidName');
      if (!(capacity >= 1 && capacity <= 1000)) return deny(res, 422, 'gym.invalidCapacity');
      if (!ownerName) return deny(res, 422, 'account.invalidName');
      if (!isValidMobile(phone)) return deny(res, 422, 'account.invalidPhone');
      if (password.length < MIN_PASSWORD_LENGTH) return deny(res, 422, 'account.weakPassword');

      const passwordHash = await hashPassword(password);
      const gym = await db.transaction(async tx => {
        const [g] = await tx.insert(t.gyms).values({ name, slug: slugify(name), capacity, hourlyCapacity: 6 }).returning();
        await tx.insert(t.users).values({
          id: randomUUID(),
          gymId: g.id,
          role: 'gym_owner',
          username: phone,
          phone,
          displayName: ownerName,
          passwordHash,
          mustChangePassword: true,
          entityId: g.id,
        });
        return g;
      });
      res.status(201).json({ success: true, messageKey: 'gym.created', params: { gym: gym.name }, gymId: gym.id });
    })
  );

  r.patch(
    '/gyms/:id',
    route(async (req, res) => {
      const active = bool(req.body?.isActive);
      const [g] = await db.update(t.gyms).set({ isActive: active, updatedAt: new Date() }).where(eq(t.gyms.id, req.params.id)).returning();
      if (!g) return deny(res, 404, 'common.notFound');
      res.json({ success: true, messageKey: active ? 'gym.activated' : 'gym.deactivated' });
    })
  );

  r.get(
    '/accounts',
    route(async (_req, res) => {
      const owners = await db.select().from(t.users).where(eq(t.users.role, 'gym_owner'));
      res.json({ success: true, accounts: owners.map(userFromRow) });
    })
  );

  /** تغییر رمز مدیر یک باشگاه */
  r.post(
    '/accounts/:id/password',
    route(async (req, res) => {
      const password = str(req.body?.password, 200).trim();
      if (password.length < MIN_PASSWORD_LENGTH) return deny(res, 422, 'account.weakPassword');
      const [u] = await db
        .update(t.users)
        .set({ passwordHash: await hashPassword(password), mustChangePassword: true, sessionVersion: sql`${t.users.sessionVersion} + 1` })
        .where(and(eq(t.users.id, req.params.id), eq(t.users.role, 'gym_owner')))
        .returning({ id: t.users.id });
      if (!u) return deny(res, 404, 'common.notFound');
      res.json({ success: true, messageKey: 'account.passwordChanged' });
    })
  );

  r.get(
    '/system',
    route(async (_req, res) => {
      const t0 = Date.now();
      await db.execute(sql`SELECT 1`);
      const dbLatencyMs = Date.now() - t0;
      const [[gyms], [users], [sessions]] = await Promise.all([
        db.select({ n: count() }).from(t.gyms),
        db.select({ n: count() }).from(t.users),
        db.select({ n: count() }).from(t.sessions),
      ]);
      res.json({
        success: true,
        system: {
          status: 'ok',
          uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
          dbLatencyMs,
          node: process.version,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          counts: { gyms: Number(gyms.n), users: Number(users.n), sessions: Number(sessions.n) },
        },
      });
    })
  );

  return r;
}
