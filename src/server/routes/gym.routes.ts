/**
 * /api/gym — دادهٔ باشگاه (فیلترشده برای نقش)، تنظیمات، ظرفیت روزانه و اعلان‌ها.
 */

import { Router } from 'express';
import type { Database } from '../../db/index.ts';
import * as ops from '../../lib/domain/operations';
import { buildNotifications } from '../../lib/domain/notifications';
import { getTodayJalaliKey } from '../../lib/date/jalali';
import { translations } from '../../lib/i18n';
import { readGym, snapshotFor } from '../engine.ts';
import { bool, gymOp, num, route, str } from '../http.ts';

export function gymRoutes(db: Database) {
  const r = Router();

  r.get(
    '/snapshot',
    route(async (req, res) => {
      const auth = req.auth!;
      const { store, loaded } = await readGym(db, auth.gymId!, auth.actor);
      res.json({ success: true, messageKey: 'common.saved', snapshot: snapshotFor(store, loaded, auth.actor) });
    })
  );

  r.patch(
    '/settings',
    gymOp(db, (store, actor, req) => {
      const b = req.body ?? {};
      const patch: Parameters<typeof ops.updateGymSettings>[2] = {};
      if (b.name !== undefined) patch.name = str(b.name, 255);
      if (b.capacity !== undefined) patch.capacity = num(b.capacity);
      if (b.hourlyCapacity !== undefined) patch.hourlyCapacity = b.hourlyCapacity === null ? undefined : num(b.hourlyCapacity);
      if (b.noShowDeductsSession !== undefined) patch.noShowDeductsSession = bool(b.noShowDeductsSession);
      return ops.updateGymSettings(store, actor, patch);
    })
  );

  /** ظرفیت سفارشی یک روز — تاریخ جلالی در بدنه (YYYY/MM/DD) */
  r.put(
    '/capacity',
    gymOp(db, (store, actor, req) => {
      const date = str(req.body?.date, 10);
      const capacity = num(req.body?.capacity);
      const trainerId = str(req.body?.trainerId, 80);
      return trainerId
        ? ops.setTrainerDailyCapacity(store, actor, { date, trainerId, capacity })
        : ops.setGymDailyCapacity(store, actor, { date, capacity });
    })
  );

  /** اعلان‌ها از دادهٔ زندهٔ باشگاه ساخته می‌شوند (جدول جداگانه لازم ندارند) */
  r.get(
    '/notifications',
    route(async (req, res) => {
      const auth = req.auth!;
      const lang = req.query.lang === 'en' ? 'en' : 'fa';
      const { store, loaded } = await readGym(db, auth.gymId!, auth.actor);
      const snap = snapshotFor(store, loaded, auth.actor);
      const notifications = buildNotifications({
        currentUser: { role: auth.actor.role, entityId: auth.actor.entityId },
        members: snap.members,
        trainers: snap.trainers,
        todaySessions: snap.todaySessions,
        pastSessions: snap.pastSessions,
        programs: snap.programs,
        todayKey: getTodayJalaliKey(),
        labels: translations[lang].notifications as any,
        lang,
      });
      res.json({ success: true, notifications });
    })
  );

  return r;
}
