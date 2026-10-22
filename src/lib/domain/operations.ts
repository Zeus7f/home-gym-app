/**
 * src/lib/domain/operations.ts
 * همهٔ عملیات تغییر داده — اعتبارسنجی، مجوز نقش و مالکیت، و اجرای قاعدهٔ دامنه.
 *
 * سرور (src/server/routes) هر درخواست را با همین تابع‌ها اجرا می‌کند؛ بنابراین قواعد
 * رزرو، ظرفیت، مهلت ۴ ساعته و مالکیت سمت سرور اعمال می‌شوند. تست‌های واحد همین تابع‌ها
 * را روی استور محلی اجرا می‌کنند. «actor» کاربر واردشده‌ای است که سرور از توکن شناخته است.
 *
 * خروجی همیشه کلید پیام (نه متن) است تا مرورگر آن را به زبان فعال ترجمه کند.
 */

import type { GymStore } from '../store/gymStore';
import type {
  ExerciseItem,
  Gym,
  Member,
  SessionExercise,
  Trainer,
  UserAccount,
  WorkoutProgram,
} from '../store/gymStore';
import type { StoreMessageKey, StoreMessageParams, StoreResult } from './storeMessages';
import { can, type Action } from '../auth/permissions';
import { getTodayJalaliString } from '../date/jalali';

export interface OpResult<T = unknown> {
  success: boolean;
  messageKey: StoreMessageKey;
  params?: StoreMessageParams;
  data?: T;
}

const ok = <T>(messageKey: StoreMessageKey, params?: StoreMessageParams, data?: T): OpResult<T> => ({
  success: true,
  messageKey,
  params,
  data,
});
const fail = (messageKey: StoreMessageKey, params?: StoreMessageParams): OpResult<never> => ({
  success: false,
  messageKey,
  params,
});
const fromStore = <T>(r: StoreResult, data?: T): OpResult<T> => ({
  success: r.success,
  messageKey: r.messageKey,
  params: r.params,
  data,
});

export const FORBIDDEN = fail('auth.forbidden');

type Actor = Pick<UserAccount, 'id' | 'role' | 'entityId' | 'gymId'>;

function allowed(actor: Actor, action: Action) {
  return can(actor.role, action);
}

/** مدیر و مدیر کل همه‌کار؛ مربی فقط روی رکوردهای خودش */
function staffOwns(actor: Actor, trainerId: string | undefined) {
  if (actor.role === 'owner' || actor.role === 'super_admin') return true;
  return actor.role === 'trainer' && !!trainerId && trainerId === actor.entityId;
}

function findSession(store: GymStore, sessionId: string) {
  return store.getSessionById(sessionId);
}

// ── جلسات ───────────────────────────────────────────────────────────────────

export function scheduleSession(
  store: GymStore,
  actor: Actor,
  a: { date: string; time: string; memberId: string; trainerId: string; exercises?: SessionExercise[] }
) {
  if (!allowed(actor, 'schedule.own') || !staffOwns(actor, a.trainerId)) return FORBIDDEN;
  const r = store.scheduleSessionOnDate(a.date, a.time, a.memberId, a.trainerId, a.exercises ?? []);
  return fromStore(r, r.session);
}

export function addSessionToToday(store: GymStore, actor: Actor, a: { memberId: string; trainerId: string; time?: string }) {
  if (!allowed(actor, 'schedule.own') || !staffOwns(actor, a.trainerId)) return FORBIDDEN;
  const r = store.addSessionToToday(a.memberId, a.trainerId, a.time);
  return fromStore(r, r.session);
}

export function checkInSession(store: GymStore, actor: Actor, a: { sessionId: string }) {
  const s = findSession(store, a.sessionId);
  if (!s) return fail('session.notFound');
  if (!allowed(actor, 'schedule.own') || !staffOwns(actor, s.trainerId)) return FORBIDDEN;
  store.checkInSession(a.sessionId);
  return ok('common.saved');
}

export function completeSession(store: GymStore, actor: Actor, a: { sessionId: string; exercises?: SessionExercise[] }) {
  const s = findSession(store, a.sessionId);
  if (!s) return fail('session.notFound');
  if (!allowed(actor, 'schedule.own') || !staffOwns(actor, s.trainerId)) return FORBIDDEN;
  const r = store.completeMemberSession(a.sessionId, a.exercises);
  return fromStore(r, { idempotent: r.idempotent, remainingSessions: r.remainingSessions });
}

export function cancelSession(store: GymStore, actor: Actor, a: { sessionId: string; reason?: string }) {
  const s = findSession(store, a.sessionId);
  if (!s) return fail('session.notFound');
  if (!allowed(actor, 'schedule.own') || !staffOwns(actor, s.trainerId)) return FORBIDDEN;
  return fromStore(store.cancelSession(a.sessionId, a.reason));
}

export function rescheduleSession(store: GymStore, actor: Actor, a: { sessionId: string; newTime: string; reason?: string }) {
  const s = findSession(store, a.sessionId);
  if (!s) return fail('session.notFound');
  const memberOwn = actor.role === 'member' && s.memberId === actor.entityId;
  if (!memberOwn && !(allowed(actor, 'schedule.own') && staffOwns(actor, s.trainerId))) return FORBIDDEN;
  return fromStore(store.rescheduleSession(a.sessionId, a.newTime, a.reason));
}

export function cancelSessionByMember(store: GymStore, actor: Actor, a: { sessionId: string; reason?: string }) {
  const s = findSession(store, a.sessionId);
  if (!s) return fail('session.notFound');
  if (!(actor.role === 'member' && s.memberId === actor.entityId)) return FORBIDDEN;
  return fromStore(store.cancelSessionByMember(a.sessionId, a.reason));
}

export function reassignDailyTrainer(store: GymStore, actor: Actor, a: { sessionId: string; newTrainerId: string }) {
  if (!allowed(actor, 'schedule.all')) return FORBIDDEN;
  return fromStore(store.reassignDailyTrainer(a.sessionId, a.newTrainerId));
}

// ── ظرفیت و تنظیمات باشگاه ─────────────────────────────────────────────────

const validCapacity = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 1000;

export function setGymDailyCapacity(store: GymStore, actor: Actor, a: { date: string; capacity: number }) {
  if (!allowed(actor, 'settings.manage')) return FORBIDDEN;
  if (!validCapacity(a.capacity)) return fail('gym.invalidCapacity');
  store.setGymDailyCapacity(a.date, a.capacity);
  return ok('common.saved');
}

export function setTrainerDailyCapacity(store: GymStore, actor: Actor, a: { date: string; trainerId: string; capacity: number }) {
  if (!allowed(actor, 'settings.manage')) return FORBIDDEN;
  if (!validCapacity(a.capacity)) return fail('gym.invalidCapacity');
  store.setTrainerDailyCapacity(a.date, a.trainerId, a.capacity);
  return ok('common.saved');
}

export function updateGymSettings(
  store: GymStore,
  actor: Actor,
  a: Partial<Pick<Gym, 'capacity' | 'hourlyCapacity' | 'noShowDeductsSession' | 'name'>>
) {
  if (!allowed(actor, 'settings.manage')) return FORBIDDEN;
  return fromStore(store.updateGymSettings(a));
}

// ── ورزشکاران و امور مالی ──────────────────────────────────────────────────

export function recordMemberPayment(
  store: GymStore,
  actor: Actor,
  a: { memberId: string; amount: number; method: 'card' | 'cash' | 'transfer'; description: string }
) {
  if (!allowed(actor, 'member.package')) return FORBIDDEN;
  const member = store.members.find(m => m.id === a.memberId);
  if (!member) return fail('member.notFound');
  if (!Number.isFinite(a.amount) || a.amount <= 0) return fail('payment.invalidAmount');
  if (!['card', 'cash', 'transfer'].includes(a.method)) return fail('payment.invalidAmount');
  store.recordMemberPayment(a.memberId, a.amount, a.method, String(a.description ?? ''));
  return ok('member.paymentRecorded', { debt: member.outstandingBalance });
}

export function adjustMemberSessions(store: GymStore, actor: Actor, a: { memberId: string; delta: number; reason: string }) {
  if (!allowed(actor, 'member.package')) return FORBIDDEN;
  const member = store.members.find(m => m.id === a.memberId);
  if (!member) return fail('member.notFound');
  if (!Number.isInteger(a.delta) || a.delta === 0) return fail('member.invalidDelta');
  if (member.totalSessions + a.delta < member.usedSessions) return fail('session.adjustTooLow');
  store.adjustMemberSessions(a.memberId, a.delta, String(a.reason ?? ''));
  return ok('member.sessionsAdjusted', { remaining: member.remainingSessions });
}

export function changeMemberTrainer(store: GymStore, actor: Actor, a: { memberId: string; trainerId: string }) {
  if (!allowed(actor, 'member.package')) return FORBIDDEN;
  return fromStore(store.changeMemberDefaultTrainer(a.memberId, a.trainerId));
}

export function assignMemberPackage(
  store: GymStore,
  actor: Actor,
  a: { memberId: string } & Parameters<GymStore['assignMemberPackage']>[1]
) {
  if (!allowed(actor, 'member.package')) return FORBIDDEN;
  const { memberId, ...pkg } = a;
  return fromStore(store.assignMemberPackage(memberId, pkg));
}

export function recordTrainerPayout(
  store: GymStore,
  actor: Actor,
  a: { trainerId: string; amount: number; method: 'card' | 'transfer' | 'cash'; description: string }
) {
  if (!allowed(actor, 'finance.view')) return FORBIDDEN;
  const trainer = store.trainers.find(t => t.id === a.trainerId);
  if (!trainer) return fail('session.memberOrTrainerNotFound');
  if (!Number.isFinite(a.amount) || a.amount <= 0) return fail('payment.invalidAmount');
  store.recordTrainerPayout(a.trainerId, a.amount, a.method, String(a.description ?? ''));
  return ok('common.saved');
}

// ── حساب‌ها ──────────────────────────────────────────────────────────────────

export type NewTrainerInput = Omit<Trainer, 'id' | 'completedSessions' | 'paidCompensation' | 'outstandingCompensation'>;
export type NewMemberInput = Omit<Member, 'id' | 'usedSessions' | 'remainingSessions' | 'outstandingBalance' | 'registrationDate'>;

export function createTrainer(store: GymStore, actor: Actor, a: { data: NewTrainerInput; password: string }) {
  if (!allowed(actor, 'staff.manage')) return FORBIDDEN;
  const r = store.addTrainer({ ...a.data, status: 'active' }, a.password);
  return fromStore(r, r.trainer);
}

export function createMember(store: GymStore, actor: Actor, a: { data: NewMemberInput; password: string }) {
  if (!allowed(actor, 'member.package')) return FORBIDDEN;
  const d = a.data;
  if (!String(d.packageName ?? '').trim() || !(Number(d.totalSessions) >= 1)) return fail('member.invalidPackage');
  const trainer = store.trainers.find(t => t.id === d.defaultTrainerId);
  if (!trainer) return fail('session.memberOrTrainerNotFound');
  const r = store.addMember({ ...d, defaultTrainerName: trainer.name, packagePending: false }, a.password);
  return fromStore(r, r.member);
}

/** مربی: ورزشکار با پروفایل حداقلی، وصل به خود مربی، منتظر تعیین بسته */
export function createMemberAsTrainer(store: GymStore, actor: Actor, a: { name: string; phone: string; password: string }) {
  if (actor.role !== 'trainer' || !allowed(actor, 'member.create')) return FORBIDDEN;
  const trainer = store.trainers.find(t => t.id === actor.entityId);
  if (!trainer) return FORBIDDEN;
  const r = store.addMember(
    {
      name: a.name,
      phone: a.phone,
      defaultTrainerId: trainer.id,
      defaultTrainerName: trainer.name,
      packageName: '',
      totalSessions: 0,
      packagePrice: 0,
      paidAmount: 0,
      startDate: getTodayJalaliString(),
      expirationDate: '',
      status: 'active',
    },
    a.password,
    { byTrainerId: trainer.id }
  );
  return fromStore(r, r.member);
}

/** مدیر: فقط حساب مربی و ورزشکار همین باشگاه */
function staffAccount(store: GymStore, userId: string) {
  return store.users.find(u => u.id === userId && (u.role === 'trainer' || u.role === 'member'));
}

export function resetAccountPassword(store: GymStore, actor: Actor, a: { userId: string; password: string }) {
  if (!allowed(actor, 'staff.manage')) return FORBIDDEN;
  if (!staffAccount(store, a.userId)) return fail('member.notFound');
  return fromStore(store.resetPassword(a.userId, String(a.password ?? '')));
}

export function setAccountActive(store: GymStore, actor: Actor, a: { userId: string; active: boolean }) {
  if (!allowed(actor, 'staff.manage')) return FORBIDDEN;
  if (!staffAccount(store, a.userId)) return fail('member.notFound');
  return fromStore(store.setAccountActive(a.userId, a.active === true));
}

// ── برنامه‌های تمرینی ───────────────────────────────────────────────────────

export function saveProgram(
  store: GymStore,
  actor: Actor,
  a: Omit<WorkoutProgram, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'publishedAt'> & { id?: string }
) {
  if (!allowed(actor, 'schedule.own')) return FORBIDDEN;
  const existing = a.id ? store.programs.find(p => p.id === a.id) : undefined;
  if (existing && !staffOwns(actor, existing.trainerId)) return FORBIDDEN;
  // مربی همیشه برنامه را به نام خودش ذخیره می‌کند
  const trainerId = actor.role === 'trainer' ? actor.entityId : a.trainerId;
  const trainer = store.trainers.find(t => t.id === trainerId);
  if (!trainer || !store.members.some(m => m.id === a.memberId)) return fail('program.notFound');
  const program = store.saveProgram({ ...a, trainerId: trainer.id, trainerName: trainer.name });
  return ok('common.saved', undefined, program);
}

function ownProgram(store: GymStore, actor: Actor, programId: string) {
  const p = store.programs.find(x => x.id === programId);
  if (!p) return { error: fail('program.notFound') };
  if (!allowed(actor, 'schedule.own') || !staffOwns(actor, p.trainerId)) return { error: FORBIDDEN };
  return { program: p };
}

export function publishProgram(store: GymStore, actor: Actor, a: { programId: string }) {
  const { error } = ownProgram(store, actor, a.programId);
  return error ?? fromStore(store.publishProgram(a.programId));
}

export function unpublishProgram(store: GymStore, actor: Actor, a: { programId: string }) {
  const { error } = ownProgram(store, actor, a.programId);
  return error ?? fromStore(store.unpublishProgram(a.programId));
}

export function deleteProgram(store: GymStore, actor: Actor, a: { programId: string }) {
  const { error } = ownProgram(store, actor, a.programId);
  if (error) return error;
  store.deleteProgram(a.programId);
  return ok('common.saved');
}

// ── حرکات سفارشی ────────────────────────────────────────────────────────────

export function addCustomExercise(store: GymStore, actor: Actor, a: { data: Omit<ExerciseItem, 'id'> }) {
  if (!allowed(actor, 'schedule.own')) return FORBIDDEN;
  if (!String(a.data?.name ?? '').trim() && !String(a.data?.nameFa ?? '').trim()) return fail('common.invalidInput');
  return ok('common.saved', undefined, store.addCustomExercise({ ...a.data, isCustom: true }));
}

export function updateExercise(store: GymStore, actor: Actor, a: { id: string; updates: Partial<Omit<ExerciseItem, 'id'>> }) {
  if (!allowed(actor, 'schedule.own')) return FORBIDDEN;
  // شناسه و پرچم «سفارشی» از بدنهٔ درخواست تغییر نمی‌کنند
  const { id: _id, isCustom: _custom, ...updates } = (a.updates ?? {}) as Partial<ExerciseItem>;
  const updated = store.updateExercise(a.id, updates);
  return updated ? ok('common.saved', undefined, updated) : fail('common.notFound');
}

export function deleteCustomExercise(store: GymStore, actor: Actor, a: { id: string }) {
  if (!allowed(actor, 'schedule.own')) return FORBIDDEN;
  const ex = store.exercises.find(e => e.id === a.id);
  if (!ex?.isCustom) return fail('common.notFound');
  store.deleteCustomExercise(a.id);
  return ok('common.saved');
}
