import { useReducer, useEffect } from 'react';

export interface WorkoutSet {
  /** تعداد تکرار (reps) */
  r: number;
  /** وزن به کیلوگرم (weight) */
  w: number;
  /** وضعیت انجام شدن ست (done) */
  d: boolean;
}

export interface WorkoutExercise {
  /** شناسه حرکت در کاتالوگ — برای اتصال به موتورهای تحلیلی (1RM / PR / تعادل عضلانی) */
  exerciseId?: string;
  name: string;
  part?: string;
  last?: string;
  sets: WorkoutSet[];
}

export type SessionDraftAction =
  | {
      type: 'UPDATE_SET';
      exerciseIndex: number;
      setIndex: number;
      patch: Partial<WorkoutSet>;
    }
  | {
      type: 'TOGGLE_SET_DONE';
      exerciseIndex: number;
      setIndex: number;
    }
  | {
      type: 'ADD_SET';
      exerciseIndex: number;
    }
  | {
      type: 'REMOVE_SET';
      exerciseIndex: number;
      setIndex: number;
    }
  | {
      type: 'ADD_EXERCISE';
      exercise: WorkoutExercise;
    }
  | {
      type: 'RESET';
      exercises?: WorkoutExercise[];
    };

const DEFAULT_STORAGE_KEY = 'hg_session_draft_v1';

/**
 * پیش‌نویس نمایشی برای حالت «بدون جلسه» (ساخت برنامه آزاد).
 * در حالت جلسه واقعی، پیش‌نویس از داده‌های همان جلسه مقداردهی می‌شود.
 */
export const INITIAL_WORKOUT_DRAFT: WorkoutExercise[] = [
  {
    name: 'پرس سینه هالتر',
    part: 'سینه',
    last: 'هفته قبل: ۳×۱۰ با ۴۰ کیلو',
    sets: [
      { r: 10, w: 42.5, d: true },
      { r: 10, w: 45, d: true },
      { r: 8, w: 47.5, d: false },
    ],
  },
  {
    name: 'اسکوات پشت',
    part: 'پا',
    last: 'هفته قبل: ۳×۸ با ۵۵ کیلو',
    sets: [
      { r: 8, w: 60, d: false },
      { r: 8, w: 60, d: false },
      { r: 6, w: 65, d: false },
    ],
  },
  {
    name: 'زیربغل سیم‌کش',
    part: 'پشت',
    last: 'اولین بار در برنامه',
    sets: [
      { r: 12, w: 35, d: false },
      { r: 12, w: 35, d: false },
    ],
  },
];

/**
 * تعیین پیش‌نویس اولیه:
 *  - با sessionId: داده‌های واقعی همان جلسه (اگر جلسه خالی باشد، لیست خالی — نه داده نمایشی)
 *  - بدون sessionId: پیش‌نویس نمایشی برای ساخت برنامه آزاد
 */
function resolveInitialExercises(
  sessionId: string | undefined,
  initialData?: WorkoutExercise[]
): WorkoutExercise[] {
  if (sessionId) {
    return initialData ?? [];
  }
  return initialData ?? INITIAL_WORKOUT_DRAFT;
}

export function sessionDraftReducer(
  state: WorkoutExercise[],
  action: SessionDraftAction
): WorkoutExercise[] {
  switch (action.type) {
    case 'UPDATE_SET': {
      const { exerciseIndex, setIndex, patch } = action;
      return state.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set, si) => {
            if (si !== setIndex) return set;
            return {
              ...set,
              ...patch,
              // تضمین عدم منفی شدن وزن و تکرار
              w: patch.w !== undefined ? Math.max(0, patch.w) : set.w,
              r: patch.r !== undefined ? Math.max(0, Math.round(patch.r)) : set.r,
            };
          }),
        };
      });
    }

    case 'TOGGLE_SET_DONE': {
      const { exerciseIndex, setIndex } = action;
      return state.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set, si) => {
            if (si !== setIndex) return set;
            return { ...set, d: !set.d };
          }),
        };
      });
    }

    case 'ADD_SET': {
      const { exerciseIndex } = action;
      return state.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          r: lastSet ? lastSet.r : 10,
          w: lastSet ? lastSet.w : 20,
          d: false,
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
        };
      });
    }

    case 'REMOVE_SET': {
      const { exerciseIndex, setIndex } = action;
      return state.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        if (ex.sets.length <= 1) return ex; // حداقل یک ست باید باقی بماند
        return {
          ...ex,
          sets: ex.sets.filter((_, si) => si !== setIndex),
        };
      });
    }

    case 'ADD_EXERCISE': {
      return [...state, action.exercise];
    }

    case 'RESET': {
      // آرایه خالی عمداً حفظ می‌شود (جلسه واقعی بدون حرکت ≠ داده نمایشی)
      return action.exercises ?? INITIAL_WORKOUT_DRAFT;
    }

    default:
      return state;
  }
}

/**
 * هوک مدیریت پیش‌نویس جلسه مربی (useSessionDraft)
 * به همراه پشتیبانی ذخیره خودکار در localStorage به تفکیک جلسه (P0 Bug Fix)
 */
export function useSessionDraft(sessionId?: string, initialData?: WorkoutExercise[]) {
  const storageKey = sessionId ? `hg_session_draft_${sessionId}` : DEFAULT_STORAGE_KEY;

  const [exercises, dispatch] = useReducer(sessionDraftReducer, null, () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // استفاده از داده‌های پیش‌فرض در صورت خطای خواندن کش
    }
    return resolveInitialExercises(sessionId, initialData);
  });

  // ذخیره پیش‌نویس در لوکال استوریج به تفکیک شناسه جلسه
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(exercises));
    } catch {
      // نادیده‌گرفتن خطای سهمیه ذخیره‌سازی
    }
  }, [exercises, storageKey]);

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const doneSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.d).length,
    0
  );
  const progressPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const updateWeight = (exerciseIndex: number, setIndex: number, w: number) => {
    dispatch({ type: 'UPDATE_SET', exerciseIndex, setIndex, patch: { w } });
  };

  const updateReps = (exerciseIndex: number, setIndex: number, r: number) => {
    dispatch({ type: 'UPDATE_SET', exerciseIndex, setIndex, patch: { r } });
  };

  const toggleSet = (exerciseIndex: number, setIndex: number) => {
    dispatch({ type: 'TOGGLE_SET_DONE', exerciseIndex, setIndex });
  };

  const addSet = (exerciseIndex: number) => {
    dispatch({ type: 'ADD_SET', exerciseIndex });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    dispatch({ type: 'REMOVE_SET', exerciseIndex, setIndex });
  };

  const addExercise = (exercise: WorkoutExercise) => {
    dispatch({ type: 'ADD_EXERCISE', exercise });
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    dispatch({ type: 'RESET', exercises: resolveInitialExercises(sessionId, initialData) });
  };

  return {
    exercises,
    totalSets,
    doneSets,
    progressPct,
    updateWeight,
    updateReps,
    toggleSet,
    addSet,
    removeSet,
    addExercise,
    clearDraft,
    dispatch,
  };
}

