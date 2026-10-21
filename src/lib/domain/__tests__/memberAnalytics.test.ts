// Domain Unit Tests: Session set normalization + Member analytics adapter
// Covers the P0/P1.1 work: joining real session records onto the pure engines.

import { normalizeExerciseSets, topSet, maxLoad } from '../sessionSets';
import {
  computeMemberAnalytics,
  detectPersonalRecords,
  buildExerciseHistories,
  buildTrend,
  buildCompletedSets,
  buildMuscleRegistry,
  calculateBalance,
  sortSessionsChronologically,
  extractMuscles,
  MUSCLE_REGION,
} from '../memberAnalytics';
import type { DailySession, SessionExercise } from '../gymManagement';
import { EXERCISE_CATALOG, type ExerciseItem } from '../../exercises/catalog';

const TODAY_KEY = 14050704;

function makeExercise(over: Partial<SessionExercise> = {}): SessionExercise {
  return {
    id: 'rec-1',
    exerciseId: 'ex-bench-press',
    name: 'پرس سینه با هالتر',
    bodyPart: 'سینه',
    equipment: 'هالتر',
    sets: 3,
    reps: 10,
    weightKg: 40,
    ...over,
  };
}

function makeSession(over: Partial<DailySession> = {}): DailySession {
  return {
    id: 's-1',
    date: '1405/07/01',
    time: '10:00',
    memberId: 'm-reza',
    memberName: 'رضا',
    trainerId: 't-ali',
    trainerName: 'علی',
    status: 'completed',
    exercises: [],
    ...over,
  };
}

const CATALOG: ExerciseItem[] = [
  {
    id: 'ex-bench-press',
    name: 'Barbell Bench Press',
    nameFa: 'پرس سینه با هالتر',
    bodyPart: 'chest',
    bodyPartFa: 'سینه و بالاتنه',
    equipment: 'barbell',
    equipmentFa: 'هالتر',
    pattern: 'general_strength',
    patternFa: 'قدرت عمومی',
    position: 'supine',
    positionFa: 'طاق‌باز',
    gifUrl: '',
    instructionsEn: '',
    instructionsFa: '',
    primaryMuscle: 'Chest',
    primaryMuscleFa: 'سینه',
    secondaryMuscles: ['Triceps'],
    secondaryMusclesFa: ['پشت بازو'],
  },
  {
    id: 'ex-lat-pulldown',
    name: 'Lat Pulldown',
    nameFa: 'زیربغل سیم‌کش',
    bodyPart: 'back',
    bodyPartFa: 'پشت و زیربغل',
    equipment: 'cable',
    equipmentFa: 'سیم‌کش',
    pattern: 'general_strength',
    patternFa: 'قدرت عمومی',
    position: 'tall_kneeling',
    positionFa: 'نشسته',
    gifUrl: '',
    instructionsEn: '',
    instructionsFa: '',
    primaryMuscle: 'Lats',
    primaryMuscleFa: 'زیربغل',
    secondaryMuscles: ['Biceps'],
    secondaryMusclesFa: ['جلو بازو'],
  },
  {
    id: 'ex-barbell-squat',
    name: 'Barbell Squat',
    nameFa: 'اسکوات با هالتر',
    bodyPart: 'legs',
    bodyPartFa: 'پا و چهارسر ران',
    equipment: 'barbell',
    equipmentFa: 'هالتر',
    pattern: 'deep_squat',
    patternFa: 'اسکوات عمیق',
    position: 'standing',
    positionFa: 'ایستاده',
    gifUrl: '',
    instructionsEn: '',
    instructionsFa: '',
    primaryMuscle: 'Quadriceps',
    primaryMuscleFa: 'چهارسر ران',
    secondaryMuscles: [],
    secondaryMusclesFa: [],
  },
];

export function runMemberAnalyticsTests(): {
  passed: number;
  failed: number;
  errors: string[];
} {
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

  // ── 1. normalizeExerciseSets ─────────────────────────────────────
  const withDetail = normalizeExerciseSets(
    makeExercise({
      completedSets: [
        { r: 10, w: 42.5, d: true },
        { r: 8, w: 45, d: false },
      ],
    })
  );
  assert(withDetail.length === 2, 'completedSets should be used verbatim when present');
  assert(withDetail[0].w === 42.5, 'detail set weight should be preserved');

  // Summary shape expands into N identical sets
  const summary = normalizeExerciseSets(makeExercise({ sets: 4, reps: 8, weightKg: 30 }));
  assert(summary.length === 4, 'summary shape should expand to `sets` count');
  assert(summary.every(s => s.r === 8 && s.w === 30 && s.d), 'expanded sets carry reps/weight/done');

  const empty = normalizeExerciseSets(makeExercise({ sets: 0 }));
  assert(empty.length === 0, 'zero sets should yield an empty list');

  // topSet picks the heaviest completed set
  const top = topSet(
    makeExercise({
      completedSets: [
        { r: 10, w: 40, d: true },
        { r: 5, w: 55, d: true },
        { r: 3, w: 70, d: false },
      ],
    })
  );
  assert(top?.w === 55, 'topSet should pick the heaviest completed set (55kg, not the undone 70kg)');

  // maxLoad ignores completion
  const max = maxLoad(
    makeExercise({
      completedSets: [
        { r: 10, w: 40, d: true },
        { r: 3, w: 70, d: false },
      ],
    })
  );
  assert(max === 70, 'maxLoad should consider all sets regardless of completion');

  // ── 2. Chronological sorting ─────────────────────────────────────
  // امروز = 1405/07/04، پس تاریخ‌های گذشته باید قبل از آن بیایند
  const unordered = [
    makeSession({ id: 'b', date: '1405/07/03' }),
    makeSession({ id: 'a', date: '1405/06/30' }),
    makeSession({ id: 'c', date: 'Today' }),
  ];
  const sorted = sortSessionsChronologically(unordered, TODAY_KEY);
  assert(
    sorted.map(s => s.id).join(',') === 'a,b,c',
    'sessions should sort oldest → newest, with Today last'
  );

  // جلسه‌ای در آینده از امروز، بعد از امروز قرار می‌گیرد
  const withFuture = sortSessionsChronologically(
    [...unordered, makeSession({ id: 'd', date: '1405/07/20' })],
    TODAY_KEY
  );
  assert(
    withFuture.map(s => s.id).join(',') === 'a,b,c,d',
    'a session dated in the future should sort after Today'
  );

  // ── 3. PR detection across a timeline ────────────────────────────
  const timeline = [
    makeSession({
      id: 's1',
      date: '1405/06/20',
      exercises: [
        makeExercise({
          exerciseId: 'ex-bench-press',
          name: 'پرس سینه',
          completedSets: [{ r: 10, w: 40, d: true }],
        }),
      ],
    }),
    makeSession({
      id: 's2',
      date: '1405/06/27',
      exercises: [
        makeExercise({
          exerciseId: 'ex-bench-press',
          name: 'پرس سینه',
          completedSets: [{ r: 10, w: 45, d: true }],
        }),
      ],
    }),
  ];

  const prs = detectPersonalRecords(timeline);
  const weightPrs = prs.filter(p => p.prType === 'max_weight');
  assert(weightPrs.length === 2, 'both the 40kg and the 45kg should register as weight PRs');
  assert(weightPrs[0].value === 40, 'first PR should be the first ever weight (40kg)');
  assert(weightPrs[1].previousValue === 40, 'second PR should reference the prior record (40kg)');
  assert(weightPrs[1].value === 45, 'second PR value should be the new max (45kg)');

  // A session that does not beat the record must not create a new PR
  const noImprovement = detectPersonalRecords([
    ...timeline,
    makeSession({
      id: 's3',
      date: '1405/07/04',
      exercises: [
        makeExercise({
          exerciseId: 'ex-bench-press',
          name: 'پرس سینه',
          completedSets: [{ r: 10, w: 42, d: true }],
        }),
      ],
    }),
  ]);
  assert(
    noImprovement.filter(p => p.prType === 'max_weight').length === 2,
    'a lighter session must not register a new weight PR'
  );

  // ── 4. Exercise histories ────────────────────────────────────────
  const histories = buildExerciseHistories(timeline);
  assert(histories.length === 1, 'two sessions of one exercise should produce one history');
  assert(histories[0].entries.length === 2, 'history should contain one entry per session');
  assert(
    histories[0].entries[0].date === '1405/06/27',
    'history entries should be newest-first (linear progression reads index 0 as latest)'
  );
  assert(
    histories[0].totalVolume === 400 + 450,
    'total volume should sum reps × load across sets (400 + 450)'
  );

  // ── 5. Trend ─────────────────────────────────────────────────────
  const trend = buildTrend(timeline, 'ex-bench-press');
  assert(trend.length === 2, 'trend should have one point per session with the exercise');
  assert(trend[0].weight === 40 && trend[1].weight === 45, 'trend weights should follow the timeline');
  assert(trend[1].estimated1Rm > 45, 'estimated 1RM should exceed the raw load');

  // ── 6. Muscle registry and balance ───────────────────────────────
  const registry = buildMuscleRegistry(CATALOG);
  assert(registry.length === 5, 'registry should contain 3 primary + 2 secondary muscles');
  assert(
    registry.some(m => m.id === 'Triceps' && m.name === 'پشت بازو'),
    'secondary muscles (Triceps, Biceps) should be in the registry with their Persian names'
  );
  assert(
    registry.every(m => m.region && m.name),
    'every registry entry should carry a name and a region'
  );

  const completedSets = buildCompletedSets(timeline, CATALOG);
  assert(completedSets.length === 2, 'one completed set per session exercise should be produced');
  assert(
    completedSets[0].muscles.length === 2,
    'bench press should map to 1 primary (Chest) + 1 secondary (Triceps) muscle'
  );
  assert(completedSets[0].muscles[0].weight === 1.0, 'primary muscle weight should be 1.0');
  assert(completedSets[0].muscles[1].weight === 0.5, 'secondary muscle weight should be 0.5');
  assert(completedSets[0].isCompleted === true, 'completed sets should be flagged completed');

  const balance = calculateBalance([
    { muscleId: 'Chest', effectiveSets: 2 },
    { muscleId: 'Triceps', effectiveSets: 1 },
    { muscleId: 'Lats', effectiveSets: 3 },
    { muscleId: 'Biceps', effectiveSets: 1.5 },
    { muscleId: 'Quadriceps', effectiveSets: 4 },
  ]);
  assert(balance.push === 3, 'push should total Chest (2) + Triceps (1) = 3');
  assert(balance.pull === 4.5, 'pull should total Lats (3) + Biceps (1.5) = 4.5');
  assert(balance.legs === 4, 'legs should total Quadriceps (4)');
  assert(balance.pushPullRatio === 0.67, 'push/pull ratio should be 3 / 4.5 ≈ 0.67');
  assert(
    balance.upperLowerRatio === 1.88,
    'upper/lower ratio should be (3 + 4.5 + 0) / 4 ≈ 1.88'
  );

  // ── 7. Full analytics pipeline ───────────────────────────────────
  const analytics = computeMemberAnalytics({
    sessions: timeline,
    catalog: CATALOG,
    todayKey: TODAY_KEY,
    weeksWindow: 8,
  });
  assert(analytics.totalCompletedSessions === 2, 'analytics should count 2 completed sessions');
  assert(
    analytics.personalRecords.length > 0,
    'analytics should surface personal records from the timeline'
  );
  assert(analytics.trend.length === 2, 'analytics trend should cover both sessions');
  assert(analytics.mainExerciseName === 'پرس سینه', 'main exercise should be the bench press');
  assert(analytics.progression !== null, 'progression advice should be produced');
  assert(
    analytics.progression?.nextLoadKg === 47.5,
    'linear progression should add 2.5kg to the current 45kg load'
  );
  assert(
    analytics.untrainedMuscles.some(m => m.id === 'Quadriceps'),
    'Quadriceps should be flagged as untrained'
  );
  assert(analytics.weeklyAverage > 0, 'weekly average should be computed');

  // Non-completed sessions must not count toward analytics
  const withCancelled = computeMemberAnalytics({
    sessions: [
      ...timeline,
      makeSession({ id: 's4', date: '1405/07/01', status: 'cancelled' }),
    ],
    catalog: CATALOG,
    todayKey: TODAY_KEY,
  });
  assert(
    withCancelled.totalCompletedSessions === 2,
    'cancelled sessions must not count as completed'
  );

  // ── 8. Regression: FMS catalog entries must map to real muscles ──
  // The FMS/legacy exercises (fms-*, ex-bench-press, …) ship without
  // primaryMuscle. Without it the muscle id falls back to a lowercase
  // bodyPart ("chest"), which never matches the registry's "Chest" —
  // silently zeroing the push/pull balance and falsely reporting trained
  // muscles as untrained.
  const STORE_EXERCISE_IDS = [
    'ex-barbell-squat', 'ex-bench-press', 'ex-incline-dumbbell', 'ex-lat-pulldown',
    'ex-plank', 'fms-bird-dog', 'fms-brettzel', 'fms-cat-camel', 'fms-chop-lift',
    'fms-deadbug', 'fms-farmer-carry', 'fms-glute-bridge', 'fms-goblet-squat',
    'fms-pallof-press', 'fms-pushup-stability', 'fms-single-leg-rdl', 'fms-wall-angel',
  ];
  const catalogIds = new Set(EXERCISE_CATALOG.map(i => i.id));

  const missing = STORE_EXERCISE_IDS.filter(id => !catalogIds.has(id));
  assert(
    missing.length === 0,
    `every exercise referenced by the store must exist in the catalog; missing: ${missing.join(', ')}`
  );

  const withoutMuscle = STORE_EXERCISE_IDS.filter(id => {
    const item = EXERCISE_CATALOG.find(i => i.id === id);
    return !item?.primaryMuscle || !item?.primaryMuscleFa || !MUSCLE_REGION[item.primaryMuscle];
  });
  assert(
    withoutMuscle.length === 0,
    `every store-referenced exercise must declare a primaryMuscle with a known region; missing: ${withoutMuscle.join(', ')}`
  );

  // A bench press must register as push, not fall through to "other"
  const bench = EXERCISE_CATALOG.find(item => item.id === 'ex-bench-press');
  assert(bench !== undefined, 'ex-bench-press must exist in the catalog');
  const benchMuscles = extractMuscles(bench!);
  assert(
    benchMuscles[0].muscleId === 'Chest' && benchMuscles[0].region === 'chest',
    'bench press should map to the Chest muscle in the chest region'
  );

  const benchBalance = calculateBalance([
    { muscleId: 'Chest', effectiveSets: 4 },
    { muscleId: 'Lats', effectiveSets: 2 },
  ]);
  assert(benchBalance.push === 4, 'Chest should count toward push');
  assert(benchBalance.pull === 2, 'Lats should count toward pull');
  assert(benchBalance.pushPullRatio === 2, 'push/pull ratio should be 4/2 = 2');

  return { passed, failed, errors };
}
