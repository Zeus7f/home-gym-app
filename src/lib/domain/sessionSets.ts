// Pure Domain Logic: Session set normalization
// Converts the loosely-typed SessionExercise shape into a canonical set list
// that the analytics engines (1RM / PR / progression / muscle balance) can consume.

import type { SessionExercise } from './gymManagement';

export interface NormalizedSet {
  /** تعداد تکرار */
  r: number;
  /** وزن به کیلوگرم */
  w: number;
  /** آیا ست تکمیل شده است */
  d: boolean;
}

/**
 * Produces the canonical set list for a recorded exercise.
 *
 * Two data shapes exist in the store:
 *  1. `completedSets` — present on sessions recorded through SessionFlow (per-set detail).
 *  2. `sets` / `reps` / `weightKg` — summary shape used by seeded historical sessions.
 *
 * The summary shape is expanded into `sets` identical sets so downstream
 * analytics always sees one consistent structure.
 */
export function normalizeExerciseSets(ex: SessionExercise): NormalizedSet[] {
  if (ex.completedSets && ex.completedSets.length > 0) {
    return ex.completedSets.map(s => ({
      r: Math.max(0, Math.round(s.r || 0)),
      w: Math.max(0, s.w || 0),
      d: Boolean(s.d),
    }));
  }

  const setCount = Math.max(0, Math.round(ex.sets || 0));
  if (setCount === 0) return [];

  const reps = Math.max(0, Math.round(ex.reps || 0));
  const weight = Math.max(0, ex.weightKg || 0);

  return Array.from({ length: setCount }, () => ({
    r: reps,
    w: weight,
    d: true,
  }));
}

/**
 * The heaviest working set of an exercise (completed, loaded, with reps).
 * Returns null when the exercise has no usable work set.
 */
export function topSet(ex: SessionExercise): NormalizedSet | null {
  const usable = normalizeExerciseSets(ex).filter(s => s.d && s.w > 0 && s.r > 0);
  if (usable.length === 0) return null;
  return usable.reduce((best, s) => (s.w > best.w ? s : best), usable[0]);
}

/**
 * Heaviest load recorded for an exercise across its sets (ignores reps).
 */
export function maxLoad(ex: SessionExercise): number {
  return normalizeExerciseSets(ex).reduce((max, s) => Math.max(max, s.w), 0);
}
