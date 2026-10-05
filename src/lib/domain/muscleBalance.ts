// Pure Domain Logic: Muscle Balance and Effective Sets Calculation
// PRD V4.1 Section 13

export interface MuscleWorkload {
  muscleId: string;
  muscleName: string;
  region: string;
  effectiveSets: number;
  totalVolumeKg: number;
}

export interface CompletedExerciseSet {
  exerciseId: string;
  muscles: Array<{ muscleId: string; muscleName: string; region: string; weight: number }>;
  reps: number;
  loadKg: number;
  isWarmup: boolean;
  isCompleted: boolean;
}

/**
 * Aggregates effective sets by muscle group from completed sets.
 * Non-completed sets and warm-ups are ignored.
 * Primary muscle contributes weight 1.0; secondary contributes 0.5.
 */
export function calculateMuscleWorkloads(
  allMuscles: Array<{ id: string; name: string; region: string }>,
  completedSets: CompletedExerciseSet[]
): {
  workloads: MuscleWorkload[];
  untrainedMuscles: Array<{ id: string; name: string; region: string }>;
  totalEffectiveSets: number;
} {
  const map = new Map<string, { muscleName: string; region: string; effectiveSets: number; volume: number }>();

  // Initialize all known muscles with 0 sets
  for (const m of allMuscles) {
    map.set(m.id, {
      muscleName: m.name,
      region: m.region,
      effectiveSets: 0,
      volume: 0
    });
  }

  let totalEffective = 0;

  for (const set of completedSets) {
    if (!set.isCompleted || set.isWarmup) continue;

    const volume = (set.reps || 0) * (set.loadKg || 0);

    for (const m of set.muscles) {
      const entry = map.get(m.muscleId);
      if (entry) {
        entry.effectiveSets += m.weight;
        entry.volume += volume * m.weight;
        totalEffective += m.weight;
      }
    }
  }

  const workloads: MuscleWorkload[] = [];
  const untrainedMuscles: Array<{ id: string; name: string; region: string }> = [];

  for (const [id, data] of map.entries()) {
    const item: MuscleWorkload = {
      muscleId: id,
      muscleName: data.muscleName,
      region: data.region,
      effectiveSets: Math.round(data.effectiveSets * 10) / 10,
      totalVolumeKg: Math.round(data.volume)
    };
    workloads.push(item);
    if (data.effectiveSets === 0) {
      untrainedMuscles.push({ id, name: data.muscleName, region: data.region });
    }
  }

  workloads.sort((a, b) => b.effectiveSets - a.effectiveSets);

  return {
    workloads,
    untrainedMuscles,
    totalEffectiveSets: Math.round(totalEffective * 10) / 10
  };
}
