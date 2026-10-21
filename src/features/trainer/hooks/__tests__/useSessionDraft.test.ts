// Domain Unit Tests: Session draft reducer (pure logic, no React required)
// PRD V4.1 Section 21 — reducer action coverage

import {
  sessionDraftReducer,
  INITIAL_WORKOUT_DRAFT,
  type WorkoutExercise,
  type SessionDraftAction,
} from '../useSessionDraft';

const BASE: WorkoutExercise[] = [
  {
    exerciseId: 'ex-bench-press',
    name: 'پرس سینه با هالتر',
    part: 'سینه',
    last: 'هفته قبل: ۳×۱۰ با ۴۰ کیلو',
    sets: [
      { r: 10, w: 40, d: true },
      { r: 10, w: 42.5, d: false },
    ],
  },
  {
    exerciseId: 'ex-barbell-squat',
    name: 'اسکوات با هالتر',
    part: 'پا',
    last: 'هفته قبل: ۳×۸ با ۵۰ کیلو',
    sets: [{ r: 8, w: 50, d: false }],
  },
];

function reduce(state: WorkoutExercise[], action: SessionDraftAction) {
  return sessionDraftReducer(state, action);
}

export function runSessionDraftTests(): {
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

  // ── UPDATE_SET ──────────────────────────────────────────────────
  const updated = reduce(BASE, {
    type: 'UPDATE_SET',
    exerciseIndex: 0,
    setIndex: 1,
    patch: { w: 50 },
  });
  assert(updated[0].sets[1].w === 50, 'UPDATE_SET should change the weight of the target set');
  assert(updated[0].sets[0].w === 40, 'UPDATE_SET should not touch sibling sets');
  assert(updated[1].sets[0].w === 50, 'UPDATE_SET should not touch other exercises');
  assert(BASE[0].sets[1].w === 42.5, 'the reducer must not mutate the input state');

  // مقادیر منفی نباید پذیرفته شوند
  const clamped = reduce(BASE, {
    type: 'UPDATE_SET',
    exerciseIndex: 0,
    setIndex: 0,
    patch: { w: -10, r: -5 },
  });
  assert(clamped[0].sets[0].w === 0, 'negative weight should be clamped to 0');
  assert(clamped[0].sets[0].r === 0, 'negative reps should be clamped to 0');

  // تکرار باید گرد شود
  const rounded = reduce(BASE, {
    type: 'UPDATE_SET',
    exerciseIndex: 0,
    setIndex: 0,
    patch: { r: 7.6 },
  });
  assert(rounded[0].sets[0].r === 8, 'reps should be rounded to the nearest integer');

  // اندیس نامعتبر نباید خطا بدهد
  const outOfRange = reduce(BASE, {
    type: 'UPDATE_SET',
    exerciseIndex: 99,
    setIndex: 99,
    patch: { w: 10 },
  });
  assert(outOfRange.length === 2, 'an out-of-range index should leave the state unchanged');

  // ── TOGGLE_SET_DONE ─────────────────────────────────────────────
  const toggled = reduce(BASE, {
    type: 'TOGGLE_SET_DONE',
    exerciseIndex: 1,
    setIndex: 0,
  });
  assert(toggled[1].sets[0].d === true, 'TOGGLE_SET_DONE should mark a set as done');
  const toggledBack = reduce(toggled, {
    type: 'TOGGLE_SET_DONE',
    exerciseIndex: 1,
    setIndex: 0,
  });
  assert(toggledBack[1].sets[0].d === false, 'TOGGLE_SET_DONE should be reversible');

  // ── ADD_SET ─────────────────────────────────────────────────────
  const added = reduce(BASE, { type: 'ADD_SET', exerciseIndex: 0 });
  assert(added[0].sets.length === 3, 'ADD_SET should append one set');
  assert(
    added[0].sets[2].r === BASE[0].sets[1].r && added[0].sets[2].w === BASE[0].sets[1].w,
    'the new set should copy the previous set’s reps and weight'
  );
  assert(added[0].sets[2].d === false, 'a newly added set should start as not-done');

  // ── REMOVE_SET ──────────────────────────────────────────────────
  const removed = reduce(BASE, { type: 'REMOVE_SET', exerciseIndex: 0, setIndex: 0 });
  assert(removed[0].sets.length === 1, 'REMOVE_SET should drop the target set');
  assert(removed[0].sets[0].w === 42.5, 'the remaining set should be the second one');

  // حداقل یک ست باید باقی بماند
  const single = reduce(BASE, { type: 'REMOVE_SET', exerciseIndex: 1, setIndex: 0 });
  assert(single[1].sets.length === 1, 'the last remaining set must not be removable');

  // ── ADD_EXERCISE ────────────────────────────────────────────────
  const withNew = reduce(BASE, {
    type: 'ADD_EXERCISE',
    exercise: {
      exerciseId: 'ex-plank',
      name: 'پلانک',
      part: 'شکم',
      sets: [{ r: 45, w: 0, d: false }],
    },
  });
  assert(withNew.length === 3, 'ADD_EXERCISE should append the exercise');
  assert(withNew[2].exerciseId === 'ex-plank', 'the appended exercise should keep its exerciseId');

  // ── RESET ───────────────────────────────────────────────────────
  const resetToEmpty = reduce(BASE, { type: 'RESET', exercises: [] });
  assert(resetToEmpty.length === 0, 'RESET with an empty array should produce an empty list');
  assert(
    resetToEmpty.length === 0 && INITIAL_WORKOUT_DRAFT.length > 0,
    'an explicit empty reset must not fall back to the demo seed'
  );

  const resetToSeed = reduce([], { type: 'RESET' });
  assert(
    resetToSeed.length === INITIAL_WORKOUT_DRAFT.length,
    'RESET without a payload should restore the demo seed'
  );

  // ── Unknown action ──────────────────────────────────────────────
  const unchanged = reduce(BASE, { type: 'NOPE' } as unknown as SessionDraftAction);
  assert(unchanged === BASE, 'an unknown action should return the same state reference');

  return { passed, failed, errors };
}
