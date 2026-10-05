// Pure Domain Logic: 1RM and PR Calculations
// PRD V4.1 Section 12 & 13

export interface OneRmEstimate {
  brzycki: number;
  epley: number;
  average: number;
}

/**
 * Calculates estimated One-Rep Max (1RM) in kg using Brzycki & Epley formulas.
 * Only valid for completed work sets with reps >= 1 and loadKg > 0.
 */
export function calculateEstimated1RM(loadKg: number, reps: number): OneRmEstimate {
  if (loadKg <= 0 || reps <= 0) {
    return { brzycki: 0, epley: 0, average: 0 };
  }

  if (reps === 1) {
    return { brzycki: loadKg, epley: loadKg, average: loadKg };
  }

  // Epley formula: load * (1 + reps / 30)
  const epley = Math.round(loadKg * (1 + reps / 30) * 100) / 100;

  // Brzycki formula: load * (36 / (37 - reps))
  // Guards against reps >= 37
  let brzycki = epley;
  if (reps < 37) {
    brzycki = Math.round((loadKg * (36 / (37 - reps))) * 100) / 100;
  }

  const average = Math.round(((epley + brzycki) / 2) * 100) / 100;

  return { brzycki, epley, average };
}

export interface DetectedPR {
  prType: 'max_weight' | 'max_reps' | 'est_1rm';
  previousValue: number;
  newValue: number;
  difference: number;
}

/**
 * Compares a completed set log against historical PRs for an exercise.
 */
export function detectPRs(
  exerciseId: string,
  loadKg: number,
  reps: number,
  currentPrs: Array<{ exerciseId: string; prType: string; value: number }>
): DetectedPR[] {
  if (loadKg <= 0 || reps <= 0) return [];

  const existingWeightPr = currentPrs.find(
    p => p.exerciseId === exerciseId && p.prType === 'max_weight'
  )?.value || 0;

  const existingRepsPr = currentPrs.find(
    p => p.exerciseId === exerciseId && p.prType === 'max_reps'
  )?.value || 0;

  const existing1RmPr = currentPrs.find(
    p => p.exerciseId === exerciseId && p.prType === 'est_1rm'
  )?.value || 0;

  const new1Rm = calculateEstimated1RM(loadKg, reps).average;
  const detected: DetectedPR[] = [];

  if (loadKg > existingWeightPr) {
    detected.push({
      prType: 'max_weight',
      previousValue: existingWeightPr,
      newValue: loadKg,
      difference: Math.round((loadKg - existingWeightPr) * 100) / 100
    });
  }

  if (reps > existingRepsPr && loadKg >= existingWeightPr * 0.7) {
    // Only count rep PRs if at a meaningful resistance (> 70% of max)
    detected.push({
      prType: 'max_reps',
      previousValue: existingRepsPr,
      newValue: reps,
      difference: reps - existingRepsPr
    });
  }

  if (new1Rm > existing1RmPr && reps > 1) {
    detected.push({
      prType: 'est_1rm',
      previousValue: existing1RmPr,
      newValue: new1Rm,
      difference: Math.round((new1Rm - existing1RmPr) * 100) / 100
    });
  }

  return detected;
}
