/**
 * src/lib/exerciseLabels.ts
 * نمایش نام حرکت و عضله متناسب با زبان فعال.
 *
 * کاتالوگ هر حرکت را هم به فارسی (`nameFa`) و هم به لاتین (`name`) نگه می‌دارد،
 * اما رکوردهای جلسه فقط نام فارسی را ذخیره می‌کنند. این ماژول نام درست را
 * از روی شناسهٔ حرکت بازیابی می‌کند.
 */

import { EXERCISE_CATALOG } from './exercises/catalog';
import type { ExerciseItem } from './exercises/catalog';

const byId = new Map<string, ExerciseItem>(
  EXERCISE_CATALOG.map(item => [item.id, item])
);

/** نام حرکت بر پایهٔ زبان فعال؛ در نبودِ حرکت، مقدار پشتیبان برگردانده می‌شود. */
export function exerciseName(
  exerciseId: string,
  fallback: string,
  isFa: boolean
): string {
  const item = byId.get(exerciseId);
  if (!item) return fallback;
  return (isFa ? item.nameFa : item.name) || fallback;
}

/** نام عضلهٔ هدف حرکت بر پایهٔ زبان فعال. */
export function exerciseMuscleName(
  exerciseId: string,
  fallback: string,
  isFa: boolean
): string {
  const item = byId.get(exerciseId);
  if (!item) return fallback;
  return (
    (isFa ? item.primaryMuscleFa : item.primaryMuscle) ||
    item.bodyPartFa ||
    fallback
  );
}

/** نام تجهیزات حرکت بر پایهٔ زبان فعال. */
export function exerciseEquipmentName(
  exerciseId: string,
  fallback: string,
  isFa: boolean
): string {
  const item = byId.get(exerciseId);
  if (!item) return fallback;
  return (isFa ? item.equipmentFa : item.equipmentName) || item.equipmentFa || fallback;
}

/**
 * نام لاتین یک عضله بر پایهٔ شناسهٔ آن.
 * شناسه‌های عضله در کاتالوگ لاتین‌اند (مثلاً 'Biceps')، پس نام فارسی متناظر
 * از روی همان شناسه بازیابی می‌شود.
 */
const muscleNames = new Map<string, { fa: string; en: string }>();
for (const item of EXERCISE_CATALOG) {
  if (item.primaryMuscle && !muscleNames.has(item.primaryMuscle)) {
    muscleNames.set(item.primaryMuscle, {
      fa: item.primaryMuscleFa || item.primaryMuscle,
      en: item.primaryMuscle,
    });
  }
  // حرکات FMS فیلد primaryMuscle ندارند و با bodyPart نمایه‌سازی می‌شوند
  if (!muscleNames.has(item.bodyPart)) {
    muscleNames.set(item.bodyPart, {
      fa: item.bodyPartFa || item.bodyPart,
      en: item.bodyPart,
    });
  }
}

export function muscleName(muscleId: string, fallback: string, isFa: boolean): string {
  const entry = muscleNames.get(muscleId);
  if (!entry) return fallback;
  return isFa ? entry.fa : entry.en;
}
