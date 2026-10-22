/**
 * src/server/repository.ts
 * نگاشت مدل دامنه ↔ جداول PostgreSQL، و ذخیرهٔ تفاوت‌ها.
 *
 * هر درخواست تغییر: وضعیت باشگاه بار می‌شود (loadGym)، عملیات دامنه روی آن اجرا می‌شود،
 * و فقط ردیف‌های تغییرکرده/حذف‌شده نوشته می‌شوند (persistDiff) — همه در یک تراکنش.
 */

import { and, desc, eq, inArray, isNull, or, sql, getTableColumns } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import * as t from '../db/schema.ts';
import type { Database } from '../db/index.ts';
import type {
  AuditLog,
  DailyCapacityConfig,
  DailySession,
  ExerciseItem,
  Gym,
  Member,
  PaymentRecord,
  SessionAdjustmentRecord,
  SessionExercise,
  Trainer,
  TrainerPaymentRecord,
  UserAccount,
  WorkoutProgram,
} from '../lib/store/gymStore';
import type { AppRole } from '../lib/auth/permissions';
import { hashPassword } from './auth/crypto.ts';

/** تراکنش یا اتصال اصلی */
export type Tx = Database | Parameters<Parameters<Database['transaction']>[0]>[0];

/** تعداد ردیف ممیزی که با هر بارگذاری خوانده می‌شود */
const AUDIT_WINDOW = 300;

export interface GymState {
  trainers: Trainer[];
  members: Member[];
  todaySessions: DailySession[];
  pastSessions: DailySession[];
  memberPayments: PaymentRecord[];
  trainerPayouts: TrainerPaymentRecord[];
  sessionAdjustments: SessionAdjustmentRecord[];
  auditLogs: AuditLog[];
  exercises: ExerciseItem[];
  dailyCapacityConfigs: Record<string, DailyCapacityConfig>;
  programs: WorkoutProgram[];
}

export interface LoadedGym {
  gym: Gym;
  state: GymState;
  users: UserAccount[];
  /** کاتالوگ سراسری (برای تشخیص حرکت ویرایش‌شده) */
  globalExercises: Map<string, ExerciseItem>;
}

// ── کمکی‌ها ──────────────────────────────────────────────────────────────────

/** null → undefined تا مقایسهٔ JSON با شیء دامنه پایدار بماند */
function clean<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined) out[k] = v;
  return out as T;
}

export const dbRole = (role: AppRole): (typeof t.userRoleEnum.enumValues)[number] =>
  role === 'owner' ? 'gym_owner' : role;
export const appRole = (role: (typeof t.userRoleEnum.enumValues)[number]): AppRole =>
  role === 'gym_owner' ? 'owner' : role;

export function gymFromRow(row: typeof t.gyms.$inferSelect): Gym {
  return clean({
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    hourlyCapacity: row.hourlyCapacity ?? undefined,
    currency: row.currency,
    noShowDeductsSession: row.noShowDeductsSession,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  }) as Gym;
}

export function userFromRow(row: typeof t.users.$inferSelect): UserAccount {
  return clean({
    id: row.id,
    username: row.username,
    password: '',
    role: appRole(row.role),
    entityId: row.entityId ?? '',
    gymId: row.gymId ?? undefined,
    isActive: row.isActive,
    displayName: row.displayName,
    phone: row.phone ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }) as UserAccount;
}

function exerciseFromRow(row: typeof t.exercises.$inferSelect): ExerciseItem {
  return clean({
    id: row.exerciseId,
    name: row.name,
    nameFa: row.nameFa,
    bodyPart: row.bodyPart,
    bodyPartFa: row.bodyPartFa,
    equipment: row.equipment,
    equipmentName: row.equipmentName,
    equipmentFa: row.equipmentFa,
    pattern: row.pattern,
    patternFa: row.patternFa,
    position: row.position,
    positionFa: row.positionFa,
    gifUrl: row.gifUrl,
    instructionsEn: row.instructionsEn,
    instructionsFa: row.instructionsFa,
    defaultSets: row.defaultSets,
    defaultReps: row.defaultReps,
    isCustom: row.isCustom || undefined,
    primaryMuscle: row.primaryMuscle,
    primaryMuscleFa: row.primaryMuscleFa,
    secondaryMuscles: row.secondaryMuscles,
    secondaryMusclesFa: row.secondaryMusclesFa,
    source: row.source,
    sourceType: row.sourceType,
    videoUrl: row.videoUrl,
  }) as unknown as ExerciseItem;
}

export function exerciseToRow(e: ExerciseItem, gymId: string | null): typeof t.exercises.$inferInsert {
  return {
    id: gymId ? `${gymId}:${e.id}` : e.id,
    gymId,
    exerciseId: e.id,
    name: e.name,
    nameFa: e.nameFa,
    bodyPart: e.bodyPart,
    bodyPartFa: e.bodyPartFa,
    equipment: e.equipment,
    equipmentName: e.equipmentName ?? null,
    equipmentFa: e.equipmentFa,
    pattern: e.pattern,
    patternFa: e.patternFa,
    position: e.position,
    positionFa: e.positionFa,
    primaryMuscle: e.primaryMuscle ?? null,
    primaryMuscleFa: e.primaryMuscleFa ?? null,
    secondaryMuscles: e.secondaryMuscles ?? null,
    secondaryMusclesFa: e.secondaryMusclesFa ?? null,
    gifUrl: e.gifUrl ?? '',
    videoUrl: e.videoUrl ?? null,
    source: e.source ?? null,
    sourceType: e.sourceType ?? null,
    instructionsEn: e.instructionsEn ?? '',
    instructionsFa: e.instructionsFa ?? '',
    defaultSets: e.defaultSets ?? null,
    defaultReps: e.defaultReps ?? null,
    isCustom: !!e.isCustom,
  };
}

// ── بارگذاری ────────────────────────────────────────────────────────────────

/** پرس‌وجوها پشت سر هم: در تراکنش همهٔ آن‌ها روی یک اتصال اجرا می‌شوند */
async function sequential<T extends readonly (() => Promise<unknown>)[]>(fns: T): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const out: unknown[] = [];
  for (const fn of fns) out.push(await fn());
  return out as any;
}

export async function loadGym(db: Tx, gymId: string): Promise<LoadedGym | null> {
  const [gymRow] = await db.select().from(t.gyms).where(eq(t.gyms.id, gymId));
  if (!gymRow) return null;

  const [
    trainerRows,
    memberRows,
    sessionRows,
    exerciseRows,
    setRows,
    paymentRows,
    payoutRows,
    adjustmentRows,
    programRows,
    dayRows,
    itemRows,
    catalogRows,
    capacityRows,
    auditRows,
    userRows,
  ] = await sequential([
    () => db.select().from(t.trainers).where(eq(t.trainers.gymId, gymId)),
    () => db.select().from(t.members).where(eq(t.members.gymId, gymId)),
    () => db.select().from(t.sessions).where(eq(t.sessions.gymId, gymId)),
    () => db.select().from(t.sessionExercises).where(eq(t.sessionExercises.gymId, gymId)),
    () => db.select().from(t.sessionSetLogs).where(eq(t.sessionSetLogs.gymId, gymId)),
    () => db.select().from(t.payments).where(eq(t.payments.gymId, gymId)).orderBy(desc(t.payments.createdAt)),
    () => db.select().from(t.trainerPayouts).where(eq(t.trainerPayouts.gymId, gymId)).orderBy(desc(t.trainerPayouts.createdAt)),
    () => db.select().from(t.sessionAdjustments).where(eq(t.sessionAdjustments.gymId, gymId)).orderBy(desc(t.sessionAdjustments.createdAt)),
    () => db.select().from(t.workoutPrograms).where(eq(t.workoutPrograms.gymId, gymId)),
    () => db.select().from(t.programDays).where(eq(t.programDays.gymId, gymId)),
    () => db.select().from(t.programItems).where(eq(t.programItems.gymId, gymId)),
    () => db.select().from(t.exercises).where(or(isNull(t.exercises.gymId), eq(t.exercises.gymId, gymId))),
    () => db.select().from(t.capacityOverrides).where(eq(t.capacityOverrides.gymId, gymId)),
    () => db.select().from(t.auditLogs).where(eq(t.auditLogs.gymId, gymId)).orderBy(desc(t.auditLogs.createdAt)).limit(AUDIT_WINDOW),
    () => db.select().from(t.users).where(eq(t.users.gymId, gymId)),
  ] as const);

  // ست‌ها → حرکت → جلسه
  const setsByExercise = new Map<string, typeof setRows>();
  for (const s of setRows) {
    const list = setsByExercise.get(s.sessionExerciseId) ?? [];
    list.push(s);
    setsByExercise.set(s.sessionExerciseId, list);
  }
  const exercisesBySession = new Map<string, SessionExercise[]>();
  for (const e of [...exerciseRows].sort((a, b) => a.position - b.position)) {
    const sets = (setsByExercise.get(e.id) ?? []).sort((a, b) => a.setNumber - b.setNumber);
    const item = clean({
      // شناسهٔ ردیف «جلسه:حرکت» است؛ شناسهٔ دامنه بخش دوم آن است
      id: e.id.startsWith(`${e.sessionId}:`) ? e.id.slice(e.sessionId.length + 1) : e.id,
      exerciseId: e.exerciseId,
      name: e.name,
      gifUrl: e.gifUrl,
      imageUrl: e.imageUrl,
      bodyPart: e.bodyPart,
      equipment: e.equipment,
      sets: e.sets,
      reps: e.reps,
      weightKg: e.weightKg,
      durationSeconds: e.durationSeconds,
      notes: e.notes,
      completedSets: sets.length ? sets.map(s => ({ r: s.reps, w: s.weightKg, d: s.done })) : undefined,
    }) as SessionExercise;
    const list = exercisesBySession.get(e.sessionId) ?? [];
    list.push(item);
    exercisesBySession.set(e.sessionId, list);
  }

  const toSession = (r: (typeof sessionRows)[number]): DailySession =>
    clean({
      id: r.id,
      date: r.date,
      time: r.time,
      memberId: r.memberId,
      memberName: r.memberName,
      memberPhone: r.memberPhone,
      trainerId: r.trainerId,
      trainerName: r.trainerName,
      isDailyOverride: r.isDailyOverride || undefined,
      status: r.status,
      exercises: exercisesBySession.get(r.id) ?? [],
      completedAt: r.completedAt,
    }) as DailySession;

  const itemsByDay = new Map<string, typeof itemRows>();
  for (const it of itemRows) {
    const list = itemsByDay.get(it.dayId) ?? [];
    list.push(it);
    itemsByDay.set(it.dayId, list);
  }
  const daysByProgram = new Map<string, WorkoutProgram['days']>();
  for (const d of [...dayRows].sort((a, b) => a.position - b.position)) {
    const items = (itemsByDay.get(d.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map(it =>
        clean({
          exerciseId: it.exerciseId,
          name: it.name,
          bodyPart: it.bodyPart,
          equipment: it.equipment,
          sets: it.sets,
          repsMin: it.repsMin,
          repsMax: it.repsMax,
          loadKg: it.loadKg,
          notes: it.notes,
        }) as WorkoutProgram['days'][number]['items'][number]
      );
    const list = daysByProgram.get(d.programId) ?? [];
    list.push({ id: d.id, title: d.title, items });
    daysByProgram.set(d.programId, list);
  }

  const globalExercises = new Map<string, ExerciseItem>();
  const gymExercises = new Map<string, ExerciseItem>();
  for (const r of catalogRows) (r.gymId ? gymExercises : globalExercises).set(r.exerciseId, exerciseFromRow(r));
  const exercises = [
    ...[...globalExercises.values()].map(e => gymExercises.get(e.id) ?? { ...e }),
    ...[...gymExercises.values()].filter(e => !globalExercises.has(e.id)),
  ];

  const capacity: Record<string, DailyCapacityConfig> = {};
  for (const c of capacityRows) {
    capacity[c.date] = clean({ date: c.date, gymCapacity: c.gymCapacity, trainerCapacities: c.trainerCapacities }) as DailyCapacityConfig;
  }

  return {
    gym: gymFromRow(gymRow),
    users: userRows.map(userFromRow),
    globalExercises,
    state: {
      trainers: trainerRows.map(
        r =>
          clean({
            id: r.id,
            name: r.name,
            phone: r.phone,
            avatarUrl: r.avatarUrl,
            specialty: r.specialty,
            status: r.status as Trainer['status'],
            workingDays: r.workingDays,
            workingHours: r.workingHours,
            dailyCapacity: r.dailyCapacity,
            sessionRate: r.sessionRate,
            completedSessions: r.completedSessions,
            paidCompensation: r.paidCompensation,
            outstandingCompensation: r.outstandingCompensation,
          }) as Trainer
      ),
      members: memberRows.map(
        r =>
          clean({
            id: r.id,
            name: r.name,
            phone: r.phone,
            avatarUrl: r.avatarUrl,
            defaultTrainerId: r.defaultTrainerId,
            defaultTrainerName: r.defaultTrainerName,
            packageName: r.packageName,
            totalSessions: r.totalSessions,
            usedSessions: r.usedSessions,
            remainingSessions: r.remainingSessions,
            packagePrice: r.packagePrice,
            paidAmount: r.paidAmount,
            outstandingBalance: r.outstandingBalance,
            startDate: r.startDate,
            expirationDate: r.expirationDate,
            status: r.status as Member['status'],
            registrationDate: r.registrationDate,
            packagePending: r.packagePending || undefined,
            createdByTrainerId: r.createdByTrainerId,
          }) as Member
      ),
      todaySessions: sessionRows.filter(r => r.bucket !== 'past').map(toSession),
      pastSessions: sessionRows.filter(r => r.bucket === 'past').map(toSession),
      memberPayments: paymentRows.map(
        r =>
          ({
            id: r.id,
            memberId: r.memberId,
            memberName: r.memberName,
            amount: r.amount,
            date: r.date,
            method: r.method,
            description: r.description,
            recordedBy: r.recordedBy,
          }) as PaymentRecord
      ),
      trainerPayouts: payoutRows.map(
        r =>
          ({
            id: r.id,
            trainerId: r.trainerId,
            trainerName: r.trainerName,
            amount: r.amount,
            date: r.date,
            method: r.method,
            description: r.description,
          }) as TrainerPaymentRecord
      ),
      sessionAdjustments: adjustmentRows.map(
        r =>
          ({
            id: r.id,
            memberId: r.memberId,
            memberName: r.memberName,
            delta: r.delta,
            reason: r.reason,
            date: r.date,
            performedBy: r.performedBy,
          }) as SessionAdjustmentRecord
      ),
      auditLogs: auditRows.map(
        r =>
          ({
            id: r.id,
            action: r.action,
            entityType: r.entityType,
            entityId: r.entityId,
            details: r.details,
            timestamp: r.timestamp,
            user: r.userName,
          }) as AuditLog
      ),
      exercises,
      dailyCapacityConfigs: capacity,
      programs: programRows.map(
        r =>
          clean({
            id: r.id,
            memberId: r.memberId,
            memberName: r.memberName,
            trainerId: r.trainerId,
            trainerName: r.trainerName,
            title: r.title,
            description: r.description,
            days: daysByProgram.get(r.id) ?? [],
            status: r.status,
            createdAt: r.createdAtJalali,
            updatedAt: r.updatedAtJalali,
            publishedAt: r.publishedAt,
          }) as WorkoutProgram
      ),
    },
  };
}

// ── دامنه → ردیف ────────────────────────────────────────────────────────────

type Rows = Record<string, Record<string, unknown>[]>;

/** ترتیب درج (والد پیش از فرزند)؛ حذف به ترتیب برعکس */
const TABLE_ORDER: { key: string; table: PgTable & { id: any } }[] = [
  { key: 'trainers', table: t.trainers },
  { key: 'members', table: t.members },
  { key: 'sessions', table: t.sessions },
  { key: 'sessionExercises', table: t.sessionExercises },
  { key: 'sessionSetLogs', table: t.sessionSetLogs },
  { key: 'payments', table: t.payments },
  { key: 'trainerPayouts', table: t.trainerPayouts },
  { key: 'sessionAdjustments', table: t.sessionAdjustments },
  { key: 'workoutPrograms', table: t.workoutPrograms },
  { key: 'programDays', table: t.programDays },
  { key: 'programItems', table: t.programItems },
  { key: 'exercises', table: t.exercises },
  { key: 'capacityOverrides', table: t.capacityOverrides },
  { key: 'auditLogs', table: t.auditLogs },
];

export function stateToRows(gymId: string, s: GymState, globalExercises: Map<string, ExerciseItem>): Rows {
  const rows: Rows = Object.fromEntries(TABLE_ORDER.map(x => [x.key, []]));
  const n = <T>(v: T | undefined) => (v === undefined ? null : v);

  for (const tr of s.trainers) {
    rows.trainers.push({
      id: tr.id, gymId, name: tr.name, phone: tr.phone, avatarUrl: n(tr.avatarUrl), specialty: tr.specialty ?? '',
      status: tr.status, workingDays: tr.workingDays ?? [], workingHours: tr.workingHours ?? '', dailyCapacity: tr.dailyCapacity,
      sessionRate: tr.sessionRate, completedSessions: tr.completedSessions, paidCompensation: tr.paidCompensation,
      outstandingCompensation: tr.outstandingCompensation,
    });
  }
  for (const m of s.members) {
    rows.members.push({
      id: m.id, gymId, name: m.name, phone: m.phone, avatarUrl: n(m.avatarUrl), defaultTrainerId: m.defaultTrainerId ?? '',
      defaultTrainerName: m.defaultTrainerName ?? '', packageName: m.packageName ?? '', totalSessions: m.totalSessions,
      usedSessions: m.usedSessions, remainingSessions: m.remainingSessions, packagePrice: m.packagePrice, paidAmount: m.paidAmount,
      outstandingBalance: m.outstandingBalance, startDate: m.startDate ?? '', expirationDate: m.expirationDate ?? '',
      status: m.status, registrationDate: m.registrationDate ?? '', packagePending: !!m.packagePending,
      createdByTrainerId: n(m.createdByTrainerId),
    });
  }
  const seen = new Set<string>();
  const sessions: [DailySession, string][] = [
    ...s.todaySessions.map(x => [x, 'today'] as [DailySession, string]),
    ...s.pastSessions.map(x => [x, 'past'] as [DailySession, string]),
  ];
  for (const [ses, bucket] of sessions) {
    if (seen.has(ses.id)) continue;
    seen.add(ses.id);
    rows.sessions.push({
      id: ses.id, gymId, date: ses.date, time: ses.time, memberId: ses.memberId, memberName: ses.memberName,
      memberPhone: n(ses.memberPhone), trainerId: ses.trainerId, trainerName: ses.trainerName,
      isDailyOverride: !!ses.isDailyOverride, status: ses.status, completedAt: n(ses.completedAt), bucket,
    });
    (ses.exercises ?? []).forEach((e, position) => {
      // شناسهٔ حرکت فقط در همان جلسه یکتاست
      const rowId = `${ses.id}:${e.id ?? position}`;
      rows.sessionExercises.push({
        id: rowId, gymId, sessionId: ses.id, position, exerciseId: e.exerciseId, name: e.name, gifUrl: n(e.gifUrl),
        imageUrl: n(e.imageUrl), bodyPart: e.bodyPart ?? '', equipment: e.equipment ?? '', sets: e.sets ?? 0, reps: e.reps ?? 0,
        weightKg: n(e.weightKg), durationSeconds: n(e.durationSeconds), notes: n(e.notes),
      });
      (e.completedSets ?? []).forEach((set, i) => {
        rows.sessionSetLogs.push({
          id: `${rowId}:${i}`, gymId, sessionExerciseId: rowId, setNumber: i + 1, reps: set.r ?? 0, weightKg: set.w ?? 0, done: !!set.d,
        });
      });
    });
  }
  for (const p of s.memberPayments) {
    rows.payments.push({ id: p.id, gymId, memberId: p.memberId, memberName: p.memberName, amount: p.amount, date: p.date, method: p.method, description: p.description ?? '', recordedBy: p.recordedBy ?? '' });
  }
  for (const p of s.trainerPayouts) {
    rows.trainerPayouts.push({ id: p.id, gymId, trainerId: p.trainerId, trainerName: p.trainerName, amount: p.amount, date: p.date, method: p.method, description: p.description ?? '' });
  }
  for (const a of s.sessionAdjustments) {
    rows.sessionAdjustments.push({ id: a.id, gymId, memberId: a.memberId, memberName: a.memberName, delta: a.delta, reason: a.reason ?? '', date: a.date, performedBy: a.performedBy ?? '' });
  }
  for (const p of s.programs) {
    rows.workoutPrograms.push({
      id: p.id, gymId, memberId: p.memberId, memberName: p.memberName, trainerId: p.trainerId, trainerName: p.trainerName,
      title: p.title, description: n(p.description), status: p.status, createdAtJalali: p.createdAt, updatedAtJalali: p.updatedAt,
      publishedAt: n(p.publishedAt),
    });
    p.days.forEach((d, position) => {
      rows.programDays.push({ id: d.id, gymId, programId: p.id, position, title: d.title });
      d.items.forEach((it, i) => {
        rows.programItems.push({
          id: `${d.id}:${i}`, gymId, dayId: d.id, position: i, exerciseId: it.exerciseId, name: it.name, bodyPart: it.bodyPart ?? '',
          equipment: it.equipment ?? '', sets: it.sets, repsMin: it.repsMin, repsMax: it.repsMax, loadKg: n(it.loadKg), notes: n(it.notes),
        });
      });
    });
  }
  for (const e of s.exercises) {
    const global = globalExercises.get(e.id);
    // فقط حرکت سفارشی یا نسخهٔ ویرایش‌شدهٔ این باشگاه ذخیره می‌شود
    if (e.isCustom || !global || JSON.stringify(clean({ ...e } as any)) !== JSON.stringify(clean({ ...global } as any))) {
      rows.exercises.push(exerciseToRow(e, gymId) as Record<string, unknown>);
    }
  }
  for (const [date, c] of Object.entries(s.dailyCapacityConfigs)) {
    rows.capacityOverrides.push({ id: `${gymId}:${date}`, gymId, date, gymCapacity: n(c.gymCapacity), trainerCapacities: n(c.trainerCapacities) });
  }
  for (const a of s.auditLogs) {
    rows.auditLogs.push({ id: a.id, gymId, action: a.action, entityType: a.entityType, entityId: a.entityId, details: a.details ?? '', timestamp: a.timestamp, userName: a.user ?? '' });
  }
  return rows;
}

// ── ذخیرهٔ تفاوت‌ها ─────────────────────────────────────────────────────────

function index(rows: Record<string, unknown>[]) {
  return new Map(rows.map(r => [String(r.id), JSON.stringify(r)]));
}

/** INSERT … ON CONFLICT (id) DO UPDATE همهٔ ستون‌های داده‌شده */
async function upsert(db: Tx, table: PgTable & { id: any }, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const columns = getTableColumns(table) as Record<string, { name: string }>;
  const keys = Object.keys(rows[0]).filter(k => k !== 'id' && columns[k]);
  const set = Object.fromEntries(keys.map(k => [k, sql.raw(`excluded."${columns[k].name}"`)]));
  for (let i = 0; i < rows.length; i += 500) {
    await (db as any).insert(table).values(rows.slice(i, i + 500)).onConflictDoUpdate({ target: (table as any).id, set });
  }
}

export interface PersistOptions {
  /** کاربری که درخواست را فرستاده؛ رمزی که برای خودش تعیین می‌کند «تغییر اجباری» ندارد */
  actorId: string;
}

export async function persistDiff(
  db: Tx,
  gymId: string,
  before: { rows: Rows; users: UserAccount[] },
  after: { rows: Rows; users: UserAccount[] },
  opts: PersistOptions
) {
  // حذف: فرزند پیش از والد
  for (const { key, table } of [...TABLE_ORDER].reverse()) {
    if (key === 'auditLogs') continue; // ممیزی فقط افزودنی است
    const next = index(after.rows[key]);
    const removed = before.rows[key].map(r => String(r.id)).filter(id => !next.has(id));
    if (removed.length) await (db as any).delete(table).where(inArray((table as any).id, removed));
  }
  // درج/به‌روزرسانی: والد پیش از فرزند
  for (const { key, table } of TABLE_ORDER) {
    const prev = index(before.rows[key]);
    const changed = after.rows[key].filter(r => prev.get(String(r.id)) !== JSON.stringify(r));
    await upsert(db, table, changed);
  }
  await persistUsers(db, gymId, before.users, after.users, opts);
}

async function persistUsers(db: Tx, gymId: string, before: UserAccount[], after: UserAccount[], opts: PersistOptions) {
  const prev = new Map(before.map(u => [u.id, u]));
  for (const u of after) {
    if ((u.gymId ?? gymId) !== gymId) continue;
    const old = prev.get(u.id);
    const passwordSet = !!u.password;
    const profileChanged =
      !old ||
      old.isActive !== u.isActive ||
      old.displayName !== u.displayName ||
      old.phone !== u.phone ||
      old.entityId !== u.entityId;
    if (!passwordSet && !profileChanged) continue;

    const hash = passwordSet ? await hashPassword(u.password) : undefined;
    const mustChange = passwordSet ? u.id !== opts.actorId : undefined;
    if (!old) {
      if (!hash) continue; // حساب بدون رمز ساخته نمی‌شود
      await db.insert(t.users).values({
        id: u.id,
        gymId,
        role: dbRole(u.role),
        username: u.username.toLowerCase(),
        phone: u.phone ?? null,
        displayName: u.displayName,
        passwordHash: hash,
        mustChangePassword: mustChange ?? true,
        entityId: u.entityId || null,
        isActive: u.isActive !== false,
      });
      continue;
    }
    const bump = passwordSet || (old.isActive !== false && u.isActive === false);
    await db
      .update(t.users)
      .set({
        displayName: u.displayName,
        phone: u.phone ?? null,
        entityId: u.entityId || null,
        isActive: u.isActive !== false,
        ...(hash ? { passwordHash: hash, mustChangePassword: mustChange } : {}),
        ...(bump ? { sessionVersion: sql`${t.users.sessionVersion} + 1` } : {}),
      })
      .where(and(eq(t.users.id, u.id), eq(t.users.gymId, gymId)));
  }
}
