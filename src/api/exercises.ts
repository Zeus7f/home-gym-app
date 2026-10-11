/**
 * src/api/exercises.ts
 * API Service for Exercise Catalog & Movement Database.
 * Backed by exercises_data.csv (413+ exercises) and FMS functional patterns.
 */

import { EXERCISE_CATALOG, ExerciseItem, BODY_PARTS, EQUIPMENT_TYPES } from '../lib/exercises/catalog';
import { gymStore } from './_client';

export interface ExerciseQueryFilter {
  /** دسته بندی اصلی (مثلا: سینه، پشت، پا، هوازی یا شناسه انگلیسی مانند chest) */
  category?: string;
  /** عضله هدف اصلی یا ثانویه (فارسی یا انگلیسی) */
  muscle?: string;
  /** نوع تجهیزات مورد نیاز (مثلا: هالتر، دمبل، دستگاه، وزن بدن) */
  equipment?: string;
  /** عبارت جستجو در نام فارسی یا انگلیسی */
  search?: string;
  /** شماره صفحه (۱ بر مبنای ۱) */
  page?: number;
  /** تعداد آیتم در هر صفحه */
  limit?: number;
}

export interface ExerciseSearchResult {
  items: ExerciseItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

/**
 * دریافت لیست فیلترشده و صفحه‌بندی‌شده از بانک حرکات ورزشی
 */
export async function getExerciseCatalog(
  filter: ExerciseQueryFilter = {}
): Promise<ExerciseSearchResult> {
  const {
    category,
    muscle,
    equipment,
    search,
    page = 1,
    limit = 24,
  } = filter;

  // Use exercises from active store (allows custom exercises added during session)
  const sourceList: ExerciseItem[] =
    gymStore?.exercises && gymStore.exercises.length > 0
      ? gymStore.exercises
      : EXERCISE_CATALOG;

  const normalizedSearch = search?.trim().toLowerCase();

  const filtered = sourceList.filter((item) => {
    // فیلتر دسته‌بندی
    if (category && category !== 'همه' && category !== 'all') {
      const matchBp =
        item.bodyPart === category ||
        item.bodyPartFa.includes(category) ||
        (item.primaryMuscleFa && item.primaryMuscleFa.includes(category)) ||
        (item.primaryMuscle && item.primaryMuscle.toLowerCase() === category.toLowerCase());
      if (!matchBp) return false;
    }

    // فیلتر عضله
    if (muscle && muscle !== 'همه' && muscle !== 'all') {
      const matchMuscle =
        (item.primaryMuscle && item.primaryMuscle.toLowerCase() === muscle.toLowerCase()) ||
        (item.primaryMuscleFa && item.primaryMuscleFa.includes(muscle)) ||
        item.secondaryMuscles?.some((m) => m.toLowerCase() === muscle.toLowerCase()) ||
        item.secondaryMusclesFa?.some((m) => m.includes(muscle));
      if (!matchMuscle) return false;
    }

    // فیلتر تجهیزات
    if (equipment && equipment !== 'همه' && equipment !== 'all') {
      const matchEq =
        item.equipment === equipment ||
        item.equipmentFa.includes(equipment) ||
        (item.equipmentName && item.equipmentName.toLowerCase() === equipment.toLowerCase());
      if (!matchEq) return false;
    }

    // فیلتر متنی جستجو
    if (normalizedSearch) {
      const inFa = item.nameFa?.toLowerCase().includes(normalizedSearch);
      const inEn = item.name?.toLowerCase().includes(normalizedSearch);
      const inMuscleFa = item.primaryMuscleFa?.toLowerCase().includes(normalizedSearch);
      const inEqFa = item.equipmentFa?.toLowerCase().includes(normalizedSearch);
      if (!inFa && !inEn && !inMuscleFa && !inEqFa) return false;
    }

    return true;
  });

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + items.length < total;

  return {
    items,
    total,
    page,
    hasMore,
  };
}

/**
 * دریافت یک حرکت مشخص با شناسه
 */
export async function getExerciseById(id: string): Promise<ExerciseItem | undefined> {
  const sourceList = gymStore?.exercises?.length ? gymStore.exercises : EXERCISE_CATALOG;
  return sourceList.find((ex) => ex.id === id);
}

/**
 * جستجوی فوری در حرکات (مناسب برای Autocomplete یا Pickers)
 */
export async function searchExercises(query: string, limit: number = 10): Promise<ExerciseItem[]> {
  const res = await getExerciseCatalog({ search: query, limit, page: 1 });
  return res.items;
}

/**
 * فهرست دسته‌بندی‌های استاندارد عضلات
 */
export function getExerciseCategories() {
  return [
    { id: 'همه', labelEn: 'All', labelFa: 'همه حرکات' },
    { id: 'سینه', labelEn: 'Chest', labelFa: 'سینه' },
    { id: 'پشت', labelEn: 'Back', labelFa: 'پشت و زیربغل' },
    { id: 'پا', labelEn: 'Legs', labelFa: 'پا و باسن' },
    { id: 'سرشانه', labelEn: 'Shoulders', labelFa: 'سرشانه' },
    { id: 'بازو', labelEn: 'Arms', labelFa: 'جلو/پشت بازو' },
    { id: 'شکم', labelEn: 'Core', labelFa: 'شکم و میان‌تنه' },
    { id: 'هوازی', labelEn: 'Cardio', labelFa: 'هوازی و استقامت' },
    { id: 'فیله کمر', labelEn: 'Lower Back', labelFa: 'فیله کمر' },
    { id: 'ساق پا', labelEn: 'Calves', labelFa: 'ساق پا' },
  ];
}

/**
 * فهرست تجهیزات ورزشی
 */
export function getEquipmentsList() {
  return [
    { id: 'همه', labelEn: 'All', labelFa: 'همه تجهیزات' },
    { id: 'هالتر', labelEn: 'Barbell', labelFa: 'هالتر' },
    { id: 'دمبل', labelEn: 'Dumbbell', labelFa: 'دمبل' },
    { id: 'دستگاه', labelEn: 'Machine', labelFa: 'دستگاه' },
    { id: 'وزن بدن', labelEn: 'Bodyweight', labelFa: 'وزن بدن' },
    { id: 'کش تمرینی', labelEn: 'Band', labelFa: 'کش تمرینی' },
    { id: 'کتل‌بل', labelEn: 'Kettlebell', labelFa: 'کتل‌بل' },
    { id: 'تی‌آر‌ایکس', labelEn: 'Suspension', labelFa: 'تی‌آر‌ایکس' },
  ];
}

export { EXERCISE_CATALOG, BODY_PARTS, EQUIPMENT_TYPES };
export type { ExerciseItem };
