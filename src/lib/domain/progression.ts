// Pure Domain Logic: Progression Policies & Stall Detection
// PRD V4.1 Section 12.2

export type ProgressionPolicyType = 'linear' | 'double' | 'deload';

export interface LinearPolicyParams {
  type: 'linear';
  targetReps: number;
  incrementKg: number;
}

export interface DoublePolicyParams {
  type: 'double';
  minReps: number;
  maxReps: number;
  incrementKg: number;
}

export interface ProgressionDecision {
  nextLoadKg: number;
  nextTargetReps: { min: number; max: number };
  isDeloadTriggered: boolean;
  isStalled: boolean;
  rationale: string;
}

export interface SessionHistoryEntry {
  completedSets: Array<{ reps: number; loadKg: number; isWarmup: boolean }>;
  date: string;
}

/**
 * Calculates next load and rep recommendations using linear progression rules.
 */
export function calculateLinearProgression(
  currentLoadKg: number,
  targetSets: number,
  targetReps: number,
  incrementKg: number,
  recentHistory: SessionHistoryEntry[]
): ProgressionDecision {
  if (recentHistory.length === 0) {
    return {
      nextLoadKg: currentLoadKg,
      nextTargetReps: { min: targetReps, max: targetReps },
      isDeloadTriggered: false,
      isStalled: false,
      rationale: 'Baseline target established.'
    };
  }

  // Count consecutive stalls
  let consecutiveFailures = 0;
  for (const entry of recentHistory.slice(0, 3)) {
    const workSets = entry.completedSets.filter(s => !s.isWarmup);
    const hitTarget = workSets.length >= targetSets && workSets.every(s => s.reps >= targetReps && s.loadKg >= currentLoadKg);
    if (!hitTarget) {
      consecutiveFailures++;
    } else {
      break;
    }
  }

  // If 3 consecutive failures: trigger deload
  if (consecutiveFailures >= 3) {
    const deloadLoad = Math.max(10, Math.round((currentLoadKg * 0.9) / 2.5) * 2.5);
    return {
      nextLoadKg: deloadLoad,
      nextTargetReps: { min: targetReps, max: targetReps },
      isDeloadTriggered: true,
      isStalled: true,
      rationale: `Stall detected (${consecutiveFailures} missed targets). Prescribed 10% deload to ${deloadLoad}kg for recovery.`
    };
  }

  const latestSession = recentHistory[0];
  const latestWorkSets = latestSession.completedSets.filter(s => !s.isWarmup);
  const success = latestWorkSets.length >= targetSets && latestWorkSets.every(s => s.reps >= targetReps);

  if (success) {
    const nextLoad = Math.round((currentLoadKg + incrementKg) * 100) / 100;
    return {
      nextLoadKg: nextLoad,
      nextTargetReps: { min: targetReps, max: targetReps },
      isDeloadTriggered: false,
      isStalled: false,
      rationale: `Target achieved across all ${targetSets} sets. Progressing load by +${incrementKg}kg to ${nextLoad}kg.`
    };
  }

  return {
    nextLoadKg: currentLoadKg,
    nextTargetReps: { min: targetReps, max: targetReps },
    isDeloadTriggered: false,
    isStalled: false,
    rationale: `Hold load at ${currentLoadKg}kg. Strive for target reps on all ${targetSets} sets before increasing load.`
  };
}

/**
 * Calculates next load and rep recommendations using double progression rules.
 */
export function calculateDoubleProgression(
  currentLoadKg: number,
  targetSets: number,
  minReps: number,
  maxReps: number,
  incrementKg: number,
  recentHistory: SessionHistoryEntry[]
): ProgressionDecision {
  if (recentHistory.length === 0) {
    return {
      nextLoadKg: currentLoadKg,
      nextTargetReps: { min: minReps, max: maxReps },
      isDeloadTriggered: false,
      isStalled: false,
      rationale: 'Baseline double progression set.'
    };
  }

  const latestSession = recentHistory[0];
  const latestWorkSets = latestSession.completedSets.filter(s => !s.isWarmup);
  const hitMaxRepsAllSets = latestWorkSets.length >= targetSets && latestWorkSets.every(s => s.reps >= maxReps);

  if (hitMaxRepsAllSets) {
    const nextLoad = Math.round((currentLoadKg + incrementKg) * 100) / 100;
    return {
      nextLoadKg: nextLoad,
      nextTargetReps: { min: minReps, max: maxReps },
      isDeloadTriggered: false,
      isStalled: false,
      rationale: `Reached upper rep threshold (${maxReps} reps) across all sets. Incrementing load to ${nextLoad}kg and resetting reps to ${minReps}.`
    };
  }

  return {
    nextLoadKg: currentLoadKg,
    nextTargetReps: { min: minReps, max: maxReps },
    isDeloadTriggered: false,
    isStalled: false,
    rationale: `Continue with ${currentLoadKg}kg until hitting ${maxReps} reps on every set.`
  };
}
