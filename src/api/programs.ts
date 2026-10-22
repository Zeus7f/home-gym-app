/**
 * src/api/programs.ts
 * Workout Program API calls — components import ONLY from here.
 * Backs the trainer program publisher and the member program view.
 */

import { gymStore, runOp } from './_client';
import { localizeOp, translateStoreMessage } from './_messages';
import * as ops from '../lib/domain/operations';
import type { WorkoutProgram, ProgramDay, ProgramExercise } from '../lib/domain/gymManagement';

export type { WorkoutProgram, ProgramDay, ProgramExercise };

/** آخرین برنامه منتشرشده یک ورزشکار — آنچه ورزشکار در صفحه تمرینات می‌بیند. */
export async function getPublishedProgram(
  memberId: string
): Promise<WorkoutProgram | undefined> {
  return gymStore.getPublishedProgramForMember(memberId);
}

/** همه برنامه‌های ثبت‌شده یک مربی. */
export async function getTrainerPrograms(trainerId: string): Promise<WorkoutProgram[]> {
  return gymStore.getProgramsByTrainer(trainerId);
}

/** برنامه‌های یک مربی برای یک ورزشکار مشخص. */
export async function getProgramsForMember(
  memberId: string,
  trainerId: string
): Promise<WorkoutProgram[]> {
  return gymStore.getProgramsForMemberByTrainer(memberId, trainerId);
}

/** ایجاد یا به‌روزرسانی برنامه (پیش‌نویس). */
export async function saveProgram(
  data: Omit<WorkoutProgram, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'publishedAt'> & {
    id?: string;
  }
): Promise<WorkoutProgram> {
  const r = await runOp({ method: 'POST', path: '/api/programs', body: data }, (s, a) => ops.saveProgram(s, a, data));
  if (!r.success || !r.data) throw new Error(translateStoreMessage(r.messageKey, r.params));
  return r.data;
}

/** انتشار برنامه برای ورزشکار. */
export async function publishProgram(
  programId: string
): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'POST', path: `/api/programs/${encodeURIComponent(programId)}/publish` }, (s, a) => ops.publishProgram(s, a, { programId }))
  );
}

/** بازگرداندن برنامه به وضعیت پیش‌نویس. */
export async function unpublishProgram(
  programId: string
): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'POST', path: `/api/programs/${encodeURIComponent(programId)}/unpublish` }, (s, a) => ops.unpublishProgram(s, a, { programId }))
  );
}

/** حذف برنامه. */
export async function deleteProgram(programId: string): Promise<boolean> {
  const r = await runOp({ method: 'DELETE', path: `/api/programs/${encodeURIComponent(programId)}` }, (s, a) => ops.deleteProgram(s, a, { programId }));
  return r.success;
}
