/**
 * src/api/sessions.ts
 * Session-related API calls — components import ONLY from here.
 * G10 fix: no direct mockStore imports in components.
 */

import { gymStore } from './_client';
import { localizeResult } from './_messages';
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
  return gymStore.scheduleSessionOnDate(date, time, memberId, trainerId, exercises);
}

/**
 * Mark a session as complete (atomic — deducts exactly 1 session).
 * Returns idempotent flag so UI knows if it was already done.
 */
export async function completeSession(
  sessionId: string,
  exercises?: SessionExercise[],
): Promise<{
  idempotent: boolean;
  remainingSessions: number;
  message: string;
}> {
  return localizeResult(gymStore.completeMemberSession(sessionId, exercises));
}

/** Get a session by its ID. */
export async function getSessionById(sessionId: string): Promise<DailySession | undefined> {
  return gymStore.getSessionById(sessionId);
}

/** Check in a session (scheduled → in_progress). */
export async function checkInSession(sessionId: string): Promise<void> {
  gymStore.checkInSession(sessionId);
}

/** Cancel a session (does NOT deduct session credit). */
export async function cancelSession(sessionId: string, reason?: string): Promise<void> {
  gymStore.cancelSession(sessionId, reason);
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
  return localizeResult(gymStore.rescheduleSession(sessionId, newTime, reason));
}

/** لغو نوبت توسط خود ورزشکار (با رعایت مهلت ۴ ساعته). */
export async function cancelSessionByMember(
  sessionId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return localizeResult(gymStore.cancelSessionByMember(sessionId, reason));
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
  return localizeResult(gymStore.addSessionToToday(memberId, trainerId, time));
}

/** Reassign today's session to a different trainer (daily override). */
export async function reassignDailyTrainer(
  sessionId: string,
  newTrainerId: string,
): Promise<void> {
  gymStore.reassignDailyTrainer(sessionId, newTrainerId);
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
export async function setGymDailyCapacity(date: string, capacity: number): Promise<void> {
  gymStore.setGymDailyCapacity(date, capacity);
}

/** Override trainer daily capacity. */
export async function setTrainerDailyCapacity(
  date: string,
  trainerId: string,
  capacity: number,
): Promise<void> {
  gymStore.setTrainerDailyCapacity(date, trainerId, capacity);
}
