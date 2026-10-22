/**
 * src/api/sessions.ts
 * Session-related API calls — components import ONLY from here.
 * G10 fix: no direct mockStore imports in components.
 */

import { gymStore, runOp } from './_client';
import { localizeOp } from './_messages';
import * as ops from '../lib/domain/operations';
import type { DailySession, SessionExercise } from '../lib/domain/gymManagement';
import { getTodayJalaliString } from '../lib/date/jalali';

/** Get all sessions for a given Jalali date "YYYY/MM/DD". */
export async function getSessions(
  date?: string,
  trainerId?: string,
  memberId?: string,
): Promise<DailySession[]> {
  const d = date ?? getTodayJalaliString();
  return gymStore.getSessionsForDate(d, trainerId, memberId);
}

/** Get today's sessions, optionally filtered by trainer. */
export async function getTodaySessions(trainerId?: string): Promise<DailySession[]> {
  return gymStore.getSessionsForDate(getTodayJalaliString(), trainerId);
}

/**
 * جلسات گذشته یک مربی — برای صفحه سوابق.
 * شامل جلسات تکمیل‌شده و لغوشده.
 */
export async function getTrainerPastSessions(trainerId?: string): Promise<DailySession[]> {
  return gymStore.pastSessions.filter(
    s => !trainerId || s.trainerId === trainerId
  );
}

/** Schedule a session on a specific date. */
export async function scheduleSession(
  date: string,
  time: string,
  memberId: string,
  trainerId: string,
  exercises?: SessionExercise[],
): Promise<{ success: boolean; message: string; session?: DailySession }> {
  const body = { date, time, memberId, trainerId, exercises };
  const r = localizeOp(await runOp({ method: 'POST', path: '/api/sessions', body }, (s, a) => ops.scheduleSession(s, a, body)));
  return { ...r, session: r.data as DailySession | undefined };
}

/**
 * Mark a session as complete (atomic — deducts exactly 1 session).
 * Returns idempotent flag so UI knows if it was already done.
 */
export async function completeSession(
  sessionId: string,
  exercises?: SessionExercise[],
): Promise<{
  success: boolean;
  idempotent: boolean;
  remainingSessions: number;
  message: string;
}> {
  const r = localizeOp(
    await runOp({ method: 'POST', path: `/api/sessions/${encodeURIComponent(sessionId)}/complete`, body: { exercises } }, (s, a) =>
      ops.completeSession(s, a, { sessionId, exercises })
    )
  );
  const d = (r.data ?? {}) as { idempotent?: boolean; remainingSessions?: number };
  return { success: r.success, message: r.message, idempotent: !!d.idempotent, remainingSessions: d.remainingSessions ?? 0 };
}

/** Get a session by its ID. */
export async function getSessionById(sessionId: string): Promise<DailySession | undefined> {
  return gymStore.getSessionById(sessionId);
}

/** Check in a session (scheduled → in_progress). */
export async function checkInSession(sessionId: string): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'POST', path: `/api/sessions/${encodeURIComponent(sessionId)}/check-in` }, (s, a) =>
      ops.checkInSession(s, a, { sessionId })
    )
  );
}

/**
 * لغو نوبت توسط مربی یا مدیر (does NOT deduct session credit).
 * محدودیت ۴ ساعته فقط برای درخواست خود ورزشکار است.
 */
export async function cancelSession(
  sessionId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'POST', path: `/api/sessions/${encodeURIComponent(sessionId)}/cancel`, body: { reason } }, (s, a) =>
      ops.cancelSession(s, a, { sessionId, reason })
    )
  );
}

/**
 * جابه‌جایی ساعت نوبت توسط خود ورزشکار.
 * مهلت ۴ ساعته رعایت می‌شود و اعتبار جلسه کسر نمی‌شود.
 */
export async function rescheduleSession(
  sessionId: string,
  newTime: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'POST', path: `/api/sessions/${encodeURIComponent(sessionId)}/reschedule`, body: { time: newTime, reason } }, (s, a) =>
      ops.rescheduleSession(s, a, { sessionId, newTime, reason })
    )
  );
}

/** لغو نوبت توسط خود ورزشکار (با رعایت مهلت ۴ ساعته). */
export async function cancelSessionByMember(
  sessionId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'POST', path: `/api/sessions/${encodeURIComponent(sessionId)}/member-cancel`, body: { reason } }, (s, a) =>
      ops.cancelSessionByMember(s, a, { sessionId, reason })
    )
  );
}

/**
 * Add a quick ad-hoc session for today.
 * ظرفیت روزانه مربی و تکراری نبودن نوبت در استور بررسی می‌شود.
 */
export async function addSessionToToday(
  memberId: string,
  trainerId: string,
  time?: string,
): Promise<{ success: boolean; message: string; session?: DailySession }> {
  const body = { memberId, trainerId, time };
  const r = localizeOp(await runOp({ method: 'POST', path: '/api/sessions/quick', body }, (s, a) => ops.addSessionToToday(s, a, body)));
  return { ...r, session: r.data as DailySession | undefined };
}

/**
 * Reassign a session to a different trainer (daily override).
 * ظرفیت و تداخل زمانی مربی جدید بررسی می‌شود.
 */
export async function reassignDailyTrainer(
  sessionId: string,
  newTrainerId: string,
): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'PATCH', path: `/api/sessions/${encodeURIComponent(sessionId)}/trainer`, body: { trainerId: newTrainerId } }, (s, a) =>
      ops.reassignDailyTrainer(s, a, { sessionId, newTrainerId })
    )
  );
}

/** Get configured gym capacity for a date. */
export function getGymDailyCapacity(date: string): number {
  return gymStore.getGymDailyCapacity(date);
}

/** Get configured trainer capacity for a date. */
export function getTrainerDailyCapacity(date: string, trainerId: string): number {
  return gymStore.getTrainerDailyCapacity(date, trainerId);
}

/** Override gym daily capacity. */
export async function setGymDailyCapacity(date: string, capacity: number): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'PUT', path: '/api/gym/capacity', body: { date, capacity } }, (s, a) => ops.setGymDailyCapacity(s, a, { date, capacity }))
  );
}

/** Override trainer daily capacity. */
export async function setTrainerDailyCapacity(
  date: string,
  trainerId: string,
  capacity: number,
): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'PUT', path: '/api/gym/capacity', body: { date, trainerId, capacity } }, (s, a) =>
      ops.setTrainerDailyCapacity(s, a, { date, trainerId, capacity })
    )
  );
}
