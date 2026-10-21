// Pure Domain Logic: Member Analytics Adapter
// Bridges the loosely-typed session records onto the pure engines in
// oneRm.ts / progression.ts / muscleBalance.ts.
//
// PRD V4.1 Section 12 & 13

import type { DailySession, SessionExercise } from './gymManagement';
import { normalizeExerciseSets } from './sessionSets';
import { calculateEstimated1RM, detectPRs, type DetectedPR } from './oneRm';
import {
  calculateLinearProgression,
  type ProgressionDecision,
  type SessionHistoryEntry,
} from './progression';
import { calculateMuscleWorkloads, type CompletedExerciseSet } from './muscleBalance';
import { parseJalali, jalaliToGregorian, gregorianToJalali } from '../date/jalali';
import type { ExerciseItem } from '../exercises/catalog';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type PushPullCategory = 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'other';

export interface MuscleDefinition {
  id: string;
  name: string;
  region: string;
}

export interface PersonalRecordSummary {
  exerciseId: string;
  exerciseName: string;
  prType: DetectedPR['prType'];
  value: number;
  achievedAt: string;
  /** مقدار قبلی رکورد (۰ یعنی اولین رکورد) */
  previousValue: number;
}

export interface TrendPoint {
  date: string;
  /** بیشترین وزنه ثبت‌شده در آن جلسه */
  weight: number;
  /** بالاترین 1RM تخمینی آن جلسه */
  estimated1Rm: number;
}

export interface MemberAnalytics {
  /** تعداد کل جلسات تکمیل‌شده */
  totalCompletedSessions: number;
  /** میانگین جلسات در هفته */
  weeklyAverage: number;
  /** رکوردهای شخصی کشف‌شده */
  personalRecords: PersonalRecordSummary[];
  /** روند وزنه حرکت اصلی */
  trend: TrendPoint[];
  /** نام حرکت اصلی (بیشترین حجم تمرینی) */
  mainExerciseName: string;
  /** شناسهٔ حرکت اصلی — برای بازیابی نام محلی‌شده از کاتالوگ */
  mainExerciseId: string;
  /** توصیه بار بعدی بر پایه موتور پیشرفت */
  progression: ProgressionDecision | null;
  /** توزیع ست‌های مؤثر به تفکیک عضله */
  muscleWorkloads: ReturnType<typeof calculateMuscleWorkloads>['workloads'];
  /** نسبت فشار فشاری/کششی و سهم هر گروه */
  balance: {
    push: number;
    pull: number;
    legs: number;
    core: number;
    cardio: number;
    /** نسبت push به pull (۰ یعنی هیچ فشار کششی) */
    pushPullRatio: number;
    /** نسبت بالاتنه به پایین‌تنه */
    upperLowerRatio: number;
  };
  /** عضلاتی که در بازه تحلیل‌شده تمرین نشده‌اند */
  untrainedMuscles: Array<{ id: string; name: string; region: string }>;
}

// ─────────────────────────────────────────────────────────────
// Muscle registry
// ─────────────────────────────────────────────────────────────

/** نگاشت ناحیه بدن کاتالوگ به ناحیه استاندارد دامنه */
const REGION_ALIASES: Record<string, string> = {
  mobility: 'core',
};

/**
 * دسته‌بندی عضلات برای محاسبه نسبت push/pull.
 * بر پایه نام انگلیسی عضله اصلی در کاتالوگ.
 */
const MUSCLE_CATEGORY: Record<string, PushPullCategory> = {
  Chest: 'push',
  Shoulders: 'push',
  Triceps: 'push',
  Lats: 'pull',
  'Upper Back': 'pull',
  Traps: 'pull',
  'Grip & Traps': 'pull',
  Biceps: 'pull',
  Forearms: 'pull',
  Quadriceps: 'legs',
  Hamstrings: 'legs',
  Glutes: 'legs',
  Calves: 'legs',
  Adductors: 'legs',
  Abductors: 'legs',
  Abdominals: 'core',
  Obliques: 'core',
  Core: 'core',
  'Lower Back': 'core',
  'Spinal Erectors': 'core',
  'Hip Flexors': 'legs',
  Cardio: 'cardio',
};

/**
 * ناحیه بدنی هر عضله.
 * برای حرکات اصلاحی (mobility) که bodyPart آن‌ها «موبیلیتی» است،
 * ناحیه از خودِ عضله تعیین می‌شود نه از bodyPart حرکت.
 */
export const MUSCLE_REGION: Record<string, string> = {
  Chest: 'chest',
  Shoulders: 'shoulders',
  Triceps: 'arms',
  Lats: 'back',
  'Upper Back': 'back',
  Traps: 'back',
  'Grip & Traps': 'back',
  Biceps: 'arms',
  Forearms: 'arms',
  Quadriceps: 'legs',
  Hamstrings: 'legs',
  Glutes: 'legs',
  Calves: 'legs',
  Adductors: 'legs',
  Abductors: 'legs',
  Abdominals: 'core',
  Obliques: 'core',
  Core: 'core',
  'Lower Back': 'core',
  'Spinal Erectors': 'core',
  'Hip Flexors': 'legs',
  Cardio: 'cardio',
  'Full Body': 'core',
  Neck: 'core',
  Other: 'core',
};

/**
 * استخراج فهرست عضلات یک حرکت از کاتالوگ.
 * حرکت اصلی وزن ۱.۰ و حرکات کمکی وزن ۰.۵ دارند.
 */
export function extractMuscles(item: ExerciseItem): Array<{
  muscleId: string;
  muscleName: string;
  region: string;
  weight: number;
}> {
  const bodyRegion = REGION_ALIASES[item.bodyPart] ?? item.bodyPart;
  const muscles: Array<{
    muscleId: string;
    muscleName: string;
    region: string;
    weight: number;
  }> = [];

  const primaryId = item.primaryMuscle || item.bodyPart;
  const primaryName = item.primaryMuscleFa || item.bodyPartFa;
  muscles.push({
    muscleId: primaryId,
    muscleName: primaryName,
    region: MUSCLE_REGION[primaryId] ?? bodyRegion,
    weight: 1.0,
  });

  const secondaryIds = item.secondaryMuscles ?? [];
  const secondaryNames = item.secondaryMusclesFa ?? [];
  secondaryIds.forEach((id, i) => {
    muscles.push({
      muscleId: id,
      muscleName: secondaryNames[i] || id,
      region: MUSCLE_REGION[id] ?? bodyRegion,
      weight: 0.5,
    });
  });

  return muscles;
}

/** ساخت جهان عضلات از روی کاتالوگ (برای تشخیص عضلات تمرین‌نشده) */
export function buildMuscleRegistry(catalog: ExerciseItem[]): MuscleDefinition[] {
  const registry = new Map<string, MuscleDefinition>();

  for (const item of catalog) {
    for (const m of extractMuscles(item)) {
      if (!registry.has(m.muscleId)) {
        registry.set(m.muscleId, {
          id: m.muscleId,
          name: m.muscleName,
          region: m.region,
        });
      }
    }
  }

  return Array.from(registry.values());
}

function categoryOf(muscleId: string): PushPullCategory {
  return MUSCLE_CATEGORY[muscleId] ?? 'other';
}

// ─────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────

/** کلید عددی مرتب‌سازی برای تاریخ جلالی (YYYY/MM/DD یا 'Today') */
function jalaliSortKey(date: string, todayKey: number): number {
  if (date === 'Today') return todayKey;
  const parsed = parseJalali(date);
  if (!parsed) return 0;
  return parsed.jy * 10000 + parsed.jm * 100 + parsed.jd;
}

/**
 * محاسبه کلید تاریخ «N روز قبل» به‌صورت دقیق.
 * تفریق مستقیم از کلید YYYYMMDD جلالی معتبر نیست، چون طول ماه‌ها متفاوت است.
 */
export function jalaliKeyDaysAgo(todayKey: number, days: number): number {
  const jy = Math.floor(todayKey / 10000);
  const jm = Math.floor((todayKey % 10000) / 100);
  const jd = todayKey % 100;

  const g = jalaliToGregorian(jy, jm, jd);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  d.setDate(d.getDate() - days);
  const back = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());

  return back.jy * 10000 + back.jm * 100 + back.jd;
}

/** مرتب‌سازی جلسات بر اساس تاریخ (قدیمی به جدید) */
export function sortSessionsChronologically(
  sessions: DailySession[],
  todayKey: number
): DailySession[] {
  return [...sessions].sort(
    (a, b) => jalaliSortKey(a.date, todayKey) - jalaliSortKey(b.date, todayKey)
  );
}

// ─────────────────────────────────────────────────────────────
// PR detection
// ─────────────────────────────────────────────────────────────

interface PrTableEntry {
  exerciseId: string;
  prType: string;
  value: number;
}

/**
 * پیمایش جلسات به ترتیب زمانی و کشف رکوردهای شخصی واقعی.
 * جدول رکوردها در طول زمان به‌روزرسانی می‌شود تا هر رکورد فقط یک‌بار و
 * درست در لحظه‌ی شکسته شدن گزارش شود.
 */
export function detectPersonalRecords(sessions: DailySession[]): PersonalRecordSummary[] {
  const table: PrTableEntry[] = [];
  const records: PersonalRecordSummary[] = [];

  for (const session of sessions) {
    for (const ex of session.exercises ?? []) {
      const sets = normalizeExerciseSets(ex).filter(s => s.d && s.w > 0 && s.r > 0);
      for (const set of sets) {
        const detected = detectPRs(ex.exerciseId, set.w, set.r, table);
        for (const pr of detected) {
          records.push({
            exerciseId: ex.exerciseId,
            exerciseName: ex.name,
            prType: pr.prType,
            value: pr.newValue,
            achievedAt: session.date,
            previousValue: pr.previousValue,
          });

          // به‌روزرسانی جدول رکوردها
          const idx = table.findIndex(
            t => t.exerciseId === ex.exerciseId && t.prType === pr.prType
          );
          if (idx >= 0) {
            table[idx].value = pr.newValue;
          } else {
            table.push({
              exerciseId: ex.exerciseId,
              prType: pr.prType,
              value: pr.newValue,
            });
          }
        }
      }
    }
  }

  return records;
}

// ─────────────────────────────────────────────────────────────
// Progression
// ─────────────────────────────────────────────────────────────

interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  entries: SessionHistoryEntry[];
  /** حجم کل (مجموع ست × تکرار × وزنه) */
  totalVolume: number;
}

/**
 * گروه‌بندی تاریخچه تمرین به تفکیک حرکت.
 *
 * ورودی باید به ترتیب زمانی (قدیمی به جدید) باشد.
 * خروجی `entries` به ترتیب **جدید به قدیم** است، چون موتور پیشرفت
 * (calculateLinearProgression) جلسه اخیر را در اندیس ۰ انتظار دارد.
 */
export function buildExerciseHistories(sessions: DailySession[]): ExerciseHistory[] {
  const map = new Map<string, ExerciseHistory>();

  for (const session of sessions) {
    for (const ex of session.exercises ?? []) {
      const sets = normalizeExerciseSets(ex);
      const workSets = sets.filter(s => s.d && s.r > 0 && s.w > 0);
      if (workSets.length === 0) continue;

      let history = map.get(ex.exerciseId);
      if (!history) {
        history = {
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          entries: [],
          totalVolume: 0,
        };
        map.set(ex.exerciseId, history);
      }

      history.entries.push({
        date: session.date,
        completedSets: sets.map(s => ({
          reps: s.r,
          loadKg: s.w,
          isWarmup: false,
        })),
      });

      history.totalVolume += workSets.reduce(
        (sum, s) => sum + s.r * s.w,
        0
      );
    }
  }

  const histories = Array.from(map.values()).sort(
    (a, b) => b.totalVolume - a.totalVolume
  );

  // ورودی قدیمی→جدید بود، پس معکوس می‌کنیم تا جلسه اخیر در ابتدا قرار گیرد
  for (const history of histories) {
    history.entries.reverse();
  }

  return histories;
}

/**
 * توصیه بار بعدی برای حرکت اصلی عضو.
 * فقط برای حرکات وزنه‌دار محاسبه می‌شود (حرکات وزن بدن بار خارجی ندارند).
 */
export function recommendProgression(
  history: ExerciseHistory | undefined
): ProgressionDecision | null {
  if (!history || history.entries.length === 0) return null;

  const latest = history.entries[0];
  const workSets = latest.completedSets.filter(s => !s.isWarmup && s.loadKg > 0);
  if (workSets.length === 0) return null;

  const currentLoadKg = workSets[0].loadKg;
  const targetSets = workSets.length;
  // سخت‌ترین ست جلسه اخیر، معیار موفقیت جلسه بعد است
  const targetReps = Math.min(...workSets.map(s => s.reps));

  return calculateLinearProgression(
    currentLoadKg,
    targetSets,
    targetReps,
    2.5,
    history.entries
  );
}

// ─────────────────────────────────────────────────────────────
// Trend
// ─────────────────────────────────────────────────────────────

/** روند وزنه و 1RM برای یک حرکت مشخص */
export function buildTrend(
  sessions: DailySession[],
  exerciseId: string
): TrendPoint[] {
  const points: TrendPoint[] = [];

  for (const session of sessions) {
    const ex = (session.exercises ?? []).find(e => e.exerciseId === exerciseId);
    if (!ex) continue;

    const sets = normalizeExerciseSets(ex).filter(s => s.d && s.w > 0 && s.r > 0);
    if (sets.length === 0) continue;

    const weight = Math.max(...sets.map(s => s.w));
    const estimated1Rm = Math.max(
      ...sets.map(s => calculateEstimated1RM(s.w, s.r).average)
    );

    points.push({ date: session.date, weight, estimated1Rm });
  }

  return points;
}

// ─────────────────────────────────────────────────────────────
// Muscle balance
// ─────────────────────────────────────────────────────────────

/** تبدیل ست‌های جلسات به ساختار موتور تعادل عضلانی */
export function buildCompletedSets(
  sessions: DailySession[],
  catalog: ExerciseItem[]
): CompletedExerciseSet[] {
  const byId = new Map(catalog.map(item => [item.id, item]));
  const result: CompletedExerciseSet[] = [];

  for (const session of sessions) {
    for (const ex of session.exercises ?? []) {
      const item = byId.get(ex.exerciseId);
      // اگر حرکت در کاتالوگ نبود، از bodyPart ثبت‌شده در جلسه استفاده می‌شود
      const muscles = item
        ? extractMuscles(item)
        : [
            {
              muscleId: ex.bodyPart,
              muscleName: ex.bodyPart,
              region: REGION_ALIASES[ex.bodyPart] ?? ex.bodyPart,
              weight: 1.0,
            },
          ];

      for (const set of normalizeExerciseSets(ex)) {
        result.push({
          exerciseId: ex.exerciseId,
          muscles,
          reps: set.r,
          loadKg: set.w,
          isWarmup: false,
          isCompleted: set.d,
        });
      }
    }
  }

  return result;
}

/** محاسبه توزیع فشار به تفکیک گروه عضلانی */
export function calculateBalance(
  workloads: Array<{ muscleId: string; effectiveSets: number }>
): MemberAnalytics['balance'] {
  const totals: Record<PushPullCategory, number> = {
    push: 0,
    pull: 0,
    legs: 0,
    core: 0,
    cardio: 0,
    other: 0,
  };

  for (const w of workloads) {
    totals[categoryOf(w.muscleId)] += w.effectiveSets;
  }

  const upper = totals.push + totals.pull + totals.core;
  const lower = totals.legs;

  return {
    push: Math.round(totals.push * 10) / 10,
    pull: Math.round(totals.pull * 10) / 10,
    legs: Math.round(totals.legs * 10) / 10,
    core: Math.round(totals.core * 10) / 10,
    cardio: Math.round(totals.cardio * 10) / 10,
    pushPullRatio: totals.pull > 0 ? Math.round((totals.push / totals.pull) * 100) / 100 : 0,
    upperLowerRatio: lower > 0 ? Math.round((upper / lower) * 100) / 100 : 0,
  };
}

// ─────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────

export interface MemberAnalyticsInput {
  /** همه جلسات عضو (تکمیل‌شده و سایر) */
  sessions: DailySession[];
  /** کاتالوگ حرکات برای نگاشت عضله */
  catalog: ExerciseItem[];
  /** کلید عددی تاریخ امروز (YYYYMMDD) برای مرتب‌سازی */
  todayKey: number;
  /** تعداد هفته‌های تحلیل برای میانگین هفتگی */
  weeksWindow?: number;
}

/**
 * محاسبه یکپارچه تحلیل‌های ورزشکار از روی جلسات واقعی.
 */
export function computeMemberAnalytics({
  sessions,
  catalog,
  todayKey,
  weeksWindow = 8,
}: MemberAnalyticsInput): MemberAnalytics {
  const completed = sessions.filter(s => s.status === 'completed');
  const chronological = sortSessionsChronologically(completed, todayKey);

  // میانگین هفتگی روی پنجره زمانی مشخص
  const windowStart = jalaliKeyDaysAgo(todayKey, weeksWindow * 7);
  const inWindow = chronological.filter(s => jalaliSortKey(s.date, todayKey) >= windowStart);
  const weeklyAverage =
    inWindow.length > 0 ? Math.round((inWindow.length / weeksWindow) * 100) / 100 : 0;

  // رکوردهای شخصی
  const personalRecords = detectPersonalRecords(chronological);

  // تاریخچه حرکات و حرکت اصلی
  const histories = buildExerciseHistories(chronological);
  const mainHistory = histories[0];
  const trend = mainHistory ? buildTrend(chronological, mainHistory.exerciseId) : [];
  const progression = recommendProgression(mainHistory);

  // تعادل عضلانی
  const registry = buildMuscleRegistry(catalog);
  const completedSets = buildCompletedSets(chronological, catalog);
  const { workloads, untrainedMuscles } = calculateMuscleWorkloads(registry, completedSets);
  const balance = calculateBalance(workloads);

  return {
    totalCompletedSessions: completed.length,
    weeklyAverage,
    personalRecords,
    trend,
    mainExerciseName: mainHistory?.exerciseName ?? '',
    mainExerciseId: mainHistory?.exerciseId ?? '',
    progression,
    muscleWorkloads: workloads,
    balance,
    untrainedMuscles,
  };
}
