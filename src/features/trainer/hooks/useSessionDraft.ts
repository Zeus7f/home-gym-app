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
    name: 'اسکات پشت',
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

const STORAGE_KEY = 'hg_session_draft_v1';

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
      return action.exercises || INITIAL_WORKOUT_DRAFT;
    }

    default:
      return state;
  }
}

/**
 * هوک مدیریت پیش‌نویس جلسه مربی (useSessionDraft)
 * به همراه پشتیبانی ذخیره خودکار در localStorage جهت پایداری آفلاین (G9)
 */
export function useSessionDraft(initialData?: WorkoutExercise[]) {
  const [exercises, dispatch] = useReducer(sessionDraftReducer, null, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // استفاده از داده‌های پیش‌فرض در صورت خطای خواندن کش
    }
    return initialData || INITIAL_WORKOUT_DRAFT;
  });

  // ذخیره پیش‌نویس در لوکال استوریج برای قابلیت آفلاین
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
    } catch {
      // نادیده‌گرفتن خطای سهمیه ذخیره‌سازی
    }
  }, [exercises]);

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
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'RESET', exercises: INITIAL_WORKOUT_DRAFT });
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

