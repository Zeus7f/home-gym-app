/**
 * src/lib/exerciseLabels.ts
 * نمایش نام حرکت و عضله متناسب با زبان فعال.
 *
 * کاتالوگ هر حرکت را هم به فارسی (`nameFa`) و هم به لاتین (`name`) نگه می‌دارد،
 * اما رکوردهای جلسه فقط نام فارسی را ذخیره می‌کنند. این ماژول نام درست را
 * از روی شناسهٔ حرکت بازیابی می‌کند.
 *
 * نمایه‌ها هنگام نخستین استفاده ساخته می‌شوند، نه هنگام بارگذاری ماژول؛ وگرنه
 * کاتالوگ را به باندل اصلی می‌کشیدند و `import()` جدای آن بی‌اثر می‌شد.
 */

import { EXERCISE_CATALOG } from './exercises/catalog';
import type { ExerciseItem } from './exercises/catalog';

let byId: Map<string, ExerciseItem> | null = null;
let muscleNames: Map<string, { fa: string; en: string }> | null = null;

/** نمایه‌ها تا وقتی کاتالوگ خالی است ساخته نمی‌شوند تا با پر شدنش تازه شوند. */
function indexes() {
  if (!byId || byId.size !== EXERCISE_CATALOG.length) {
    byId = new Map(EXERCISE_CATALOG.map(item => [item.id, item]));

    // شناسه‌های عضله در کاتالوگ لاتین‌اند (مثلاً 'Biceps')، پس نام فارسی
    // متناظر از روی همان شناسه بازیابی می‌شود.
    muscleNames = new Map();
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
  }
  return { byId, muscleNames: muscleNames! };
}

/** نام حرکت بر پایهٔ زبان فعال؛ در نبودِ حرکت، مقدار پشتیبان برگردانده می‌شود. */
export function exerciseName(exerciseId: string, fallback: string, isFa: boolean): string {
  const item = indexes().byId.get(exerciseId);
  if (!item) return fallback;
  return (isFa ? item.nameFa : item.name) || fallback;
}

/** نام عضله بر پایهٔ شناسهٔ لاتین آن. */
export function muscleName(muscleId: string, fallback: string, isFa: boolean): string {
  const entry = indexes().muscleNames.get(muscleId);
  if (!entry) return fallback;
  return isFa ? entry.fa : entry.en;
}
