// Domain Unit Tests: 1RM, Progression, and Muscle Balance
// PRD V4.1 Section 21 & Section 58

import { calculateEstimated1RM, detectPRs } from '../oneRm';
import { calculateLinearProgression, calculateDoubleProgression } from '../progression';
import { calculateMuscleWorkloads } from '../muscleBalance';

export function runAllDomainTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`Assertion failed: ${testName}`);
    }
  }

  // 1. One-Rep Max (1RM) Tests
  const singleRep = calculateEstimated1RM(100, 1);
  assert(singleRep.average === 100, '1RM for 1 rep of 100kg should be 100kg');

  const fiveReps = calculateEstimated1RM(100, 5);
  assert(fiveReps.epley > 110 && fiveReps.epley < 120, 'Epley 1RM for 100kg x 5 reps should be ~116.67kg');
  assert(fiveReps.brzycki > 110 && fiveReps.brzycki < 120, 'Brzycki 1RM for 100kg x 5 reps should be ~112.5kg');

  const zeroReps = calculateEstimated1RM(0, 0);
  assert(zeroReps.average === 0, '1RM for 0 load / 0 reps should be 0');

  // PR Detection Tests
  const prs = detectPRs('squat', 120, 5, [
    { exerciseId: 'squat', prType: 'max_weight', value: 110 },
    { exerciseId: 'squat', prType: 'max_reps', value: 8 },
    { exerciseId: 'squat', prType: 'est_1rm', value: 130 }
  ]);
  const hasWeightPr = prs.some(p => p.prType === 'max_weight' && p.newValue === 120);
  assert(hasWeightPr, 'Should detect max_weight PR when load exceeds existing record');

  // 2. Linear Progression Tests
  const baseline = calculateLinearProgression(100, 3, 5, 2.5, []);
  assert(baseline.nextLoadKg === 100, 'Empty history keeps baseline load');

  const successHistory = [{
    date: '2026-09-20',
    completedSets: [
      { reps: 5, loadKg: 100, isWarmup: false },
      { reps: 5, loadKg: 100, isWarmup: false },
      { reps: 5, loadKg: 100, isWarmup: false }
    ]
  }];
  const progressed = calculateLinearProgression(100, 3, 5, 2.5, successHistory);
  assert(progressed.nextLoadKg === 102.5, 'Success should increment load by 2.5kg');

  // Deload Test (3 consecutive stalls)
  const failedSession = {
    date: '2026-09-20',
    completedSets: [
      { reps: 3, loadKg: 100, isWarmup: false },
      { reps: 3, loadKg: 100, isWarmup: false },
      { reps: 2, loadKg: 100, isWarmup: false }
    ]
  };
  const stalledProgression = calculateLinearProgression(100, 3, 5, 2.5, [failedSession, failedSession, failedSession]);
  assert(stalledProgression.isDeloadTriggered === true, '3 failures should trigger deload');
  assert(stalledProgression.nextLoadKg === 90, 'Deload should reduce load by ~10%');

  // 3. Double Progression Tests
  const doubleHistory = [{
    date: '2026-09-20',
    completedSets: [
      { reps: 10, loadKg: 20, isWarmup: false },
      { reps: 10, loadKg: 20, isWarmup: false },
      { reps: 10, loadKg: 20, isWarmup: false }
    ]
  }];
  const doubleProgressed = calculateDoubleProgression(20, 3, 8, 10, 2, doubleHistory);
  assert(doubleProgressed.nextLoadKg === 22, 'Hitting upper bound reps should increase load in double progression');

  // 4. Muscle Balance & Effective Sets Tests
  const muscles = [
    { id: 'chest', name: 'Chest', region: 'chest' },
    { id: 'triceps', name: 'Triceps', region: 'arms' },
    { id: 'legs', name: 'Legs', region: 'legs' }
  ];
  const workoutSets = [
    {
      exerciseId: 'bench',
      muscles: [
        { muscleId: 'chest', muscleName: 'Chest', region: 'chest', weight: 1.0 },
        { muscleId: 'triceps', muscleName: 'Triceps', region: 'arms', weight: 0.5 }
      ],
      reps: 10,
      loadKg: 80,
      isWarmup: false,
      isCompleted: true
    },
    {
      exerciseId: 'bench',
      muscles: [
        { muscleId: 'chest', muscleName: 'Chest', region: 'chest', weight: 1.0 },
        { muscleId: 'triceps', muscleName: 'Triceps', region: 'arms', weight: 0.5 }
      ],
      reps: 10,
      loadKg: 80,
      isWarmup: false,
      isCompleted: true
    }
  ];

  const balance = calculateMuscleWorkloads(muscles, workoutSets);
  const chestWorkload = balance.workloads.find(w => w.muscleId === 'chest')?.effectiveSets;
  const tricepsWorkload = balance.workloads.find(w => w.muscleId === 'triceps')?.effectiveSets;
  assert(chestWorkload === 2, 'Chest should have 2.0 effective sets (2 sets * 1.0 weight)');
  assert(tricepsWorkload === 1, 'Triceps should have 1.0 effective sets (2 sets * 0.5 weight)');
  assert(balance.untrainedMuscles.some(m => m.id === 'legs'), 'Legs should be flagged as untrained');

  return { passed, failed, errors };
}
