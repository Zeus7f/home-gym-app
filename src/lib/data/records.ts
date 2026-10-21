/**
 * src/lib/data/records.ts
 * B-03: نگاشت خالص بین وضعیت استور و ردیف‌های جدول app_records (بدون شبکه، قابل تست).
 */

import type {
  AuditLog,
  DailyCapacityConfig,
  DailySession,
  Member,
  PaymentRecord,
  SessionAdjustmentRecord,
  Trainer,
  TrainerPaymentRecord,
  WorkoutProgram,
} from '../domain/gymManagement';
import { EXERCISE_CATALOG, type ExerciseItem } from '../exercises/catalog';

export type RecordKind =
  | 'trainer'
  | 'member'
  | 'session'
  | 'payment'
  | 'payout'
  | 'adjustment'
  | 'program'
  | 'capacity'
  | 'exercise'
  | 'audit';

export interface RecordRow {
  kind: RecordKind;
  id: string;
  member_id: string | null;
  trainer_id: string | null;
  data: Record<string, unknown>;
}

/** بخش‌هایی از استور که در ابر ذخیره می‌شوند */
export interface GymDataState {
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

const CATALOG_BY_ID = new Map(EXERCISE_CATALOG.map(e => [e.id, JSON.stringify(e)]));

function row(
  kind: RecordKind,
  id: string,
  data: object,
  member_id: string | null = null,
  trainer_id: string | null = null
): RecordRow {
  return { kind, id, member_id, trainer_id, data: data as Record<string, unknown> };
}

/** وضعیت استور → ردیف‌ها. حرکات کاتالوگ فقط اگر سفارشی یا ویرایش‌شده باشند ذخیره می‌شوند. */
export function stateToRecords(state: GymDataState): RecordRow[] {
  const rows: RecordRow[] = [];
  for (const t of state.trainers) rows.push(row('trainer', t.id, t, null, t.id));
  for (const m of state.members) rows.push(row('member', m.id, m, m.id, m.defaultTrainerId || null));

  const seen = new Set<string>();
  const sessions: [DailySession, 'today' | 'past'][] = [
    ...state.todaySessions.map(s => [s, 'today'] as [DailySession, 'today']),
    ...state.pastSessions.map(s => [s, 'past'] as [DailySession, 'past']),
  ];
  for (const [s, bucket] of sessions) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    rows.push(row('session', s.id, { ...s, _bucket: bucket }, s.memberId, s.trainerId));
  }

  for (const p of state.memberPayments) rows.push(row('payment', p.id, p, p.memberId));
  for (const p of state.trainerPayouts) rows.push(row('payout', p.id, p, null, p.trainerId));
  for (const a of state.sessionAdjustments) rows.push(row('adjustment', a.id, a, a.memberId));
  for (const p of state.programs) rows.push(row('program', p.id, p, p.memberId, p.trainerId));
  for (const [date, c] of Object.entries(state.dailyCapacityConfigs)) rows.push(row('capacity', date, c));
  for (const e of state.exercises) {
    if (e.isCustom || CATALOG_BY_ID.get(e.id) !== JSON.stringify(e)) rows.push(row('exercise', e.id, e));
  }
  for (const a of state.auditLogs) rows.push(row('audit', a.id, a));
  return rows;
}

/** ردیف‌ها → وضعیت استور. ترتیب‌ها مثل استور محلی: جدیدترین اول برای پرداخت‌ها و ممیزی. */
export function recordsToState(rows: RecordRow[]): GymDataState {
  const of = <T>(kind: RecordKind) => rows.filter(r => r.kind === kind).map(r => r.data as unknown as T);
  const sessions = rows.filter(r => r.kind === 'session').map(r => r.data as unknown as DailySession & { _bucket?: string });
  const strip = ({ _bucket, ...s }: DailySession & { _bucket?: string }) => s as DailySession;

  const edited = new Map(of<ExerciseItem>('exercise').map(e => [e.id, e]));
  const exercises = [
    ...EXERCISE_CATALOG.map(e => edited.get(e.id) ?? { ...e }),
    ...[...edited.values()].filter(e => !CATALOG_BY_ID.has(e.id)),
  ];

  const capacity: Record<string, DailyCapacityConfig> = {};
  for (const r of rows) if (r.kind === 'capacity') capacity[r.id] = r.data as unknown as DailyCapacityConfig;

  const newestFirst = <T extends { id: string }>(list: T[], key: (x: T) => string) =>
    [...list].sort((a, b) => key(b).localeCompare(key(a)));

  return {
    trainers: of<Trainer>('trainer'),
    members: of<Member>('member'),
    todaySessions: sessions.filter(s => s._bucket !== 'past').map(strip),
    pastSessions: sessions.filter(s => s._bucket === 'past').map(strip),
    memberPayments: newestFirst(of<PaymentRecord>('payment'), p => p.date),
    trainerPayouts: newestFirst(of<TrainerPaymentRecord>('payout'), p => p.date),
    sessionAdjustments: newestFirst(of<SessionAdjustmentRecord>('adjustment'), a => a.date),
    auditLogs: of<AuditLog>('audit'),
    exercises,
    dailyCapacityConfigs: capacity,
    programs: of<WorkoutProgram>('program'),
  };
}

const keyOf = (r: Pick<RecordRow, 'kind' | 'id'>) => `${r.kind}\u0000${r.id}`;

/** نمایهٔ ردیف‌ها برای مقایسه: کلید → JSON */
export function indexRecords(rows: RecordRow[]): Map<string, string> {
  return new Map(rows.map(r => [keyOf(r), JSON.stringify(r)]));
}

/** تفاوت دو وضعیت: ردیف‌های تازه/تغییرکرده و ردیف‌های حذف‌شده */
export function diffRecords(
  previous: Map<string, string>,
  next: RecordRow[]
): { upserts: RecordRow[]; deletes: Pick<RecordRow, 'kind' | 'id'>[] } {
  const upserts: RecordRow[] = [];
  const nextKeys = new Set<string>();
  for (const r of next) {
    const k = keyOf(r);
    nextKeys.add(k);
    if (previous.get(k) !== JSON.stringify(r)) upserts.push(r);
  }
  const deletes: Pick<RecordRow, 'kind' | 'id'>[] = [];
  for (const k of previous.keys()) {
    if (!nextKeys.has(k)) {
      const [kind, id] = k.split('\u0000');
      deletes.push({ kind: kind as RecordKind, id });
    }
  }
  return { upserts, deletes };
}
