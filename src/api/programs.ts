/**
 * src/api/programs.ts
 * Workout Program API calls — components import ONLY from here.
 * Backs the trainer program publisher and the member program view.
 */

import { gymStore } from './_client';
import { localizeResult } from './_messages';
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
  return gymStore.saveProgram(data);
}

/** انتشار برنامه برای ورزشکار. */
export async function publishProgram(
  programId: string
): Promise<{ success: boolean; message: string }> {
  return localizeResult(gymStore.publishProgram(programId));
}

/** بازگرداندن برنامه به وضعیت پیش‌نویس. */
export async function unpublishProgram(
  programId: string
): Promise<{ success: boolean; message: string }> {
  return localizeResult(gymStore.unpublishProgram(programId));
}

/** حذف برنامه. */
export async function deleteProgram(programId: string): Promise<boolean> {
  return gymStore.deleteProgram(programId);
}
