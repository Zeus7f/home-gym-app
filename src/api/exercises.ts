/**
 * src/api/exercises.ts
 * مرز API کاتالوگ حرکات — کامپوننت‌ها فقط از همین‌جا کاتالوگ را می‌گیرند.
 *
 * کاتالوگ پایه از exercises_data.csv ساخته شده و حرکات سفارشی هر باشگاه در
 * snapshot سرور روی آن سوار می‌شوند.
 */

export { EXERCISE_CATALOG, BODY_PARTS, EQUIPMENT_TYPES } from '../lib/exercises/catalog';
export type { ExerciseItem } from '../lib/exercises/catalog';
