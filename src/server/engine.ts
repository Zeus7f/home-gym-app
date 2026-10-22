/**
 * src/server/engine.ts
 * اجرای عملیات دامنه روی دادهٔ PostgreSQL در یک تراکنش.
 *
 *   ۱. قفل ردیف باشگاه (SELECT … FOR UPDATE) تا درخواست‌های هم‌زمان یک باشگاه پشت سر هم اجرا شوند
 *   ۲. بارگذاری وضعیت باشگاه و ساخت موتور دامنه (GymStore) با هویت کاربر واردشده
 *   ۳. اجرای عملیات (src/lib/domain/operations.ts) — همهٔ قواعد رزرو، ظرفیت و مالکیت
 *   ۴. ذخیرهٔ فقط ردیف‌های تغییرکرده؛ در صورت شکست عملیات چیزی نوشته نمی‌شود
 */

import { sql } from 'drizzle-orm';
import { GymStore, emptyGymData, type ExerciseItem, type UserAccount } from '../lib/store/gymStore';
import type { OpResult } from '../lib/domain/operations';
import type { GymSnapshot } from '../lib/data/snapshot';
import type { Database } from '../db/index.ts';
import { loadGym, persistDiff, stateToRows, type LoadedGym, type Tx } from './repository.ts';

export class HttpError extends Error {
  constructor(
    public status: number,
    public messageKey: string,
    public params?: Record<string, string | number>
  ) {
    super(messageKey);
  }
}

/** موتور دامنه با دادهٔ یک باشگاه — کپی عمیق، تا وضعیت «قبل» دست نخورد */
export function buildStore(loaded: LoadedGym, actor: UserAccount): GymStore {
  const store = new GymStore();
  const state = structuredClone(loaded.state);
  Object.assign(store, emptyGymData(loaded.gym), state, {
    gym: structuredClone(loaded.gym),
    gyms: [structuredClone(loaded.gym)],
    users: structuredClone(loaded.users),
  });
  store.currentUser = structuredClone(actor);
  store.notify = () => {};
  return store;
}

export async function withGym<T>(
  db: Database,
  gymId: string,
  actor: UserAccount,
  op: (store: GymStore) => OpResult<T>
): Promise<{ result: OpResult<T>; store: GymStore; loaded: LoadedGym }> {
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT id FROM gyms WHERE id = ${gymId} FOR UPDATE`);
    const loaded = await loadGym(tx, gymId);
    if (!loaded) throw new HttpError(404, 'common.notFound');

    const store = buildStore(loaded, actor);
    const beforeRows = structuredClone(stateToRows(gymId, store, loaded.globalExercises));
    const result = op(store);
    if (result.success) {
      const afterRows = stateToRows(gymId, store, loaded.globalExercises);
      await persistDiff(
        tx as Tx,
        gymId,
        { rows: beforeRows, users: loaded.users },
        { rows: afterRows, users: store.users },
        { actorId: actor.id }
      );
    }
    return { result, store, loaded };
  });
}

/** فقط خواندن (بدون قفل) */
export async function readGym(db: Database, gymId: string, actor: UserAccount) {
  const loaded = await loadGym(db, gymId);
  if (!loaded) throw new HttpError(404, 'common.notFound');
  return { store: buildStore(loaded, actor), loaded };
}

// ── فیلتر داده بر اساس نقش ───────────────────────────────────────────────────

const noMoney = <T extends object>(o: T, keys: (keyof T)[]): T => {
  const copy = { ...o };
  for (const k of keys) (copy as any)[k] = 0;
  return copy;
};

export function snapshotFor(store: GymStore, loaded: LoadedGym, actor: UserAccount): GymSnapshot {
  const overrides: ExerciseItem[] = store.exercises.filter(e => {
    const g = loaded.globalExercises.get(e.id);
    return e.isCustom || !g || JSON.stringify(e) !== JSON.stringify(g);
  });
  const base: GymSnapshot = {
    gym: store.gym,
    trainers: store.trainers,
    members: store.members,
    todaySessions: store.todaySessions,
    pastSessions: store.pastSessions,
    memberPayments: store.memberPayments,
    trainerPayouts: store.trainerPayouts,
    sessionAdjustments: store.sessionAdjustments,
    auditLogs: store.auditLogs,
    exerciseOverrides: overrides,
    dailyCapacityConfigs: store.dailyCapacityConfigs,
    programs: store.programs,
    users: store.users.map(u => ({ ...u, password: '' })),
  };

  if (actor.role === 'owner' || actor.role === 'super_admin') return base;

  const trainersPublic = store.trainers.map(t =>
    noMoney(t, ['sessionRate', 'paidCompensation', 'outstandingCompensation'])
  );

  if (actor.role === 'trainer') {
    return {
      ...base,
      // مربی دستمزد مربیان دیگر و امور مالی اعضا را نمی‌بیند
      trainers: store.trainers.map(t => (t.id === actor.entityId ? t : noMoney(t, ['sessionRate', 'paidCompensation', 'outstandingCompensation']))),
      members: store.members.map(m => noMoney(m, ['packagePrice', 'paidAmount', 'outstandingBalance'])),
      memberPayments: [],
      trainerPayouts: store.trainerPayouts.filter(p => p.trainerId === actor.entityId),
      auditLogs: [],
      users: [],
    };
  }

  // ورزشکار: فقط دادهٔ خودش
  const me = actor.entityId;
  return {
    ...base,
    trainers: trainersPublic,
    members: store.members.filter(m => m.id === me),
    todaySessions: store.todaySessions.filter(s => s.memberId === me),
    pastSessions: store.pastSessions.filter(s => s.memberId === me),
    memberPayments: store.memberPayments.filter(p => p.memberId === me),
    trainerPayouts: [],
    sessionAdjustments: store.sessionAdjustments.filter(a => a.memberId === me),
    auditLogs: [],
    programs: store.programs.filter(p => p.memberId === me && p.status === 'published'),
    users: [],
  };
}
