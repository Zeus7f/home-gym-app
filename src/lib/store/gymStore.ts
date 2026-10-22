// High-Fidelity Local State Store implementing Gym Management Operating Model
// PRD Refactor: Gym -> Owner -> Trainers -> Members -> Attendance -> Sessions -> Exercises -> Finance -> Reports

import type {
  Gym,
  Member,
  Trainer,
  DailySession,
  SessionExercise,
  PaymentRecord,
  TrainerPaymentRecord,
  SessionAdjustmentRecord,
  AuditLog,
  UserAccount,
  DailyCapacityConfig,
  WorkoutProgram,
  ProgramDay,
  ProgramExercise
} from '../domain/gymManagement';

export type {
  Gym,
  Member,
  Trainer,
  DailySession,
  SessionExercise,
  PaymentRecord,
  TrainerPaymentRecord,
  SessionAdjustmentRecord,
  AuditLog,
  UserAccount,
  DailyCapacityConfig,
  WorkoutProgram,
  ProgramDay,
  ProgramExercise
};
export type { ExerciseItem } from '../exercises/catalog';
import { EXERCISE_CATALOG, ExerciseItem } from '../exercises/catalog';
import { getTodayJalaliString, getTodayJalali } from '../date/jalali';
import { isWithinCutoff, RESCHEDULE_CUTOFF_HOURS } from '../domain/sessionPolicy';
import { type StoreResult, type StoreMessageKey, type StoreMessageParams } from '../domain/storeMessages';
import {
  LEGACY_TODAY,
  canonicalDate,
  compareJalaliDates,
  isSameDate,
  validateBooking,
  checkCompletable,
} from '../domain/bookingPolicy';
import { translations } from '../i18n';
import { can } from '../auth/permissions';
import { MIN_PASSWORD_LENGTH } from '../auth/accountRules';
import type { GymSnapshot } from '../data/snapshot';
import { isValidMobile, normalizeLoginId, normalizePhone } from '../phone';


/**
 * تولید شناسهٔ یکتا.
 *
 * `Date.now()` فقط دقت میلی‌ثانیه دارد، بنابراین دو رکورد ساخته‌شده در
 * یک میلی‌ثانیه شناسهٔ یکسان می‌گیرند (مثلاً دو برنامهٔ تمرینی یا دو ورودی
 * پیامِ ممیزی). ترکیب زمان با یک شمارندهٔ یکنوا این برخورد را حذف می‌کند.
 */
/**
 * ساخت نتیجهٔ استور از روی کلید پیام.
 * متن فارسی پیش‌فرض از همان فرهنگ لغت ساخته می‌شود تا دو نسخهٔ متفاوت از یک پیام وجود نداشته باشد.
 */
function storeResult(
  success: boolean,
  messageKey: StoreMessageKey,
  params?: StoreMessageParams
): StoreResult {
  const template = (translations.fa.storeMessages as Record<string, string>)[messageKey] ?? '';
  let message = template;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      message = message.replace(new RegExp(`\\{${name}\\}`, 'g'), () => String(value));
    }
  }
  return { success, messageKey, params, message };
}

let idCounter = 0;
/** B-03: در حالت ابری شناسهٔ رکوردها UUID است (کلید ردیف در app_records و app_entity_id پروفایل) */
let uuidIds = false;
export function useUuidIds(flag: boolean) {
  uuidIds = flag;
}
function nextId(prefix: string): string {
  if (uuidIds && typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

const curJ = getTodayJalali();
const CURRENT_JY = curJ.jy;
const CURRENT_JM = curJ.jm < 10 ? `0${curJ.jm}` : `${curJ.jm}`;
const PREV_JM = curJ.jm === 1 ? '12' : (curJ.jm - 1 < 10 ? `0${curJ.jm - 1}` : `${curJ.jm - 1}`);
const PREV_JY = curJ.jm === 1 ? CURRENT_JY - 1 : CURRENT_JY;

export const INITIAL_GYM: Gym = {
  id: 'gym-1',
  name: 'Iron Haven Fitness Club',
  capacity: 30, // 30 members max daily capacity
  currency: 'تومان',
  noShowDeductsSession: false,
  hourlyCapacity: 6
};

const INITIAL_TRAINERS: Trainer[] = [
  {
    id: 't-ali',
    name: 'علی رستمی (Ali)',
    phone: '09121112233',
    specialty: 'قدرتی و فرم‌دهی (Strength & Hypertrophy)',
    status: 'active',
    workingDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'],
    workingHours: '09:00 - 15:00',
    dailyCapacity: 6,
    sessionRate: 150000, // 150,000 Tomans per session
    completedSessions: 82,
    paidCompensation: 8000000,
    outstandingCompensation: (82 * 150000) - 8000000 // 12,300,000 - 8,000,000 = 4,300,000
  },
  {
    id: 't-sara',
    name: 'سارا جلالی (Sara)',
    phone: '09124445566',
    specialty: 'کاردیو، چربی‌سوزی و اصلاحی (Cardio & Rehab)',
    status: 'active',
    workingDays: ['Saturday', 'Monday', 'Wednesday', 'Thursday'],
    workingHours: '14:00 - 20:00',
    dailyCapacity: 8,
    sessionRate: 160000,
    completedSessions: 65,
    paidCompensation: 7000000,
    outstandingCompensation: (65 * 160000) - 7000000 // 10,400,000 - 7,000,000 = 3,400,000
  }
];

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm-reza',
    name: 'رضا کمالی (Reza)',
    phone: '09127778899',
    defaultTrainerId: 't-ali',
    defaultTrainerName: 'علی رستمی (Ali)',
    packageName: 'بسته خصوصی ۱۲ جلسه‌ای',
    totalSessions: 12,
    usedSessions: 5,
    remainingSessions: 7, // 12 - 5 = 7
    packagePrice: 12000000,
    paidAmount: 8000000,
    outstandingBalance: 4000000, // 12,000,000 - 8,000,000 = 4,000,000
    startDate: `${CURRENT_JY}/${CURRENT_JM}/01`,
    expirationDate: `${CURRENT_JY}/07/30`,
    status: 'active',
    registrationDate: `${CURRENT_JY}/${CURRENT_JM}/01`
  },
  {
    id: 'm-sara-m',
    name: 'سارا محمدی (Sara M.)',
    phone: '09123332211',
    defaultTrainerId: 't-sara',
    defaultTrainerName: 'سارا جلالی (Sara)',
    packageName: 'بسته VIP بیست جلسه‌ای',
    totalSessions: 20,
    usedSessions: 7,
    remainingSessions: 13,
    packagePrice: 20000000,
    paidAmount: 20000000,
    outstandingBalance: 0,
    startDate: `${PREV_JY}/${PREV_JM}/15`,
    expirationDate: `${CURRENT_JY}/08/15`,
    status: 'active',
    registrationDate: `${PREV_JY}/${PREV_JM}/15`
  },
  {
    id: 'm-mohammad',
    name: 'محمد صادقی (Mohammad)',
    phone: '09129990011',
    defaultTrainerId: 't-ali',
    defaultTrainerName: 'علی رستمی (Ali)',
    packageName: 'بسته پایه ۱۰ جلسه‌ای',
    totalSessions: 10,
    usedSessions: 8,
    remainingSessions: 2, // Low balance alert!
    packagePrice: 10000000,
    paidAmount: 8000000,
    outstandingBalance: 2000000,
    startDate: `${CURRENT_JY}/${CURRENT_JM}/10`,
    expirationDate: `${CURRENT_JY}/07/25`,
    status: 'active',
    registrationDate: `${CURRENT_JY}/${CURRENT_JM}/10`
  },
  {
    id: 'm-chloe',
    name: 'نیلوفر بهرامی (Niloofar)',
    phone: '09125556677',
    defaultTrainerId: 't-sara',
    defaultTrainerName: 'سارا جلالی (Sara)',
    packageName: 'بسته سلامتی ۸ جلسه‌ای',
    totalSessions: 8,
    usedSessions: 7,
    remainingSessions: 1, // Low balance alert!
    packagePrice: 8000000,
    paidAmount: 8000000,
    outstandingBalance: 0,
    startDate: `${CURRENT_JY}/${CURRENT_JM}/05`,
    expirationDate: `${CURRENT_JY}/07/20`,
    status: 'active',
    registrationDate: `${CURRENT_JY}/${CURRENT_JM}/05`
  }
];

/** تاریخ امروز هنگام بارگذاری داده‌های نمونه — جلسات نمونهٔ «امروز» با تاریخ واقعی ذخیره می‌شوند (B-05) */
const SEED_TODAY = getTodayJalaliString();

const INITIAL_TODAY_SESSIONS: DailySession[] = [
  {
    id: 'sess-1',
    date: SEED_TODAY,
    time: '09:00',
    memberId: 'm-reza',
    memberName: 'رضا کمالی (Reza)',
    memberPhone: '09127778899',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'in_progress',
    exercises: [
      {
        id: 'rec-1',
        exerciseId: 'ex-bench-press',
        name: 'پرس سینه با هالتر (Barbell Bench Press)',
        bodyPart: 'سینه',
        equipment: 'هالتر',
        gifUrl: EXERCISE_CATALOG[0].gifUrl,
        sets: 3,
        reps: 10,
        weightKg: 40,
        notes: 'تمرکز روی پایین آوردن با مکث ۱ ثانیه'
      },
      {
        id: 'rec-2',
        exerciseId: 'ex-lat-pulldown',
        name: 'زیربغل سیم‌کش از جلو (Lat Pulldown)',
        bodyPart: 'پشت و زیربغل',
        equipment: 'سیم‌کش',
        gifUrl: EXERCISE_CATALOG[2].gifUrl,
        sets: 3,
        reps: 12,
        weightKg: 35,
        notes: 'دامنه حرکتی کامل'
      }
    ]
  },
  {
    id: 'sess-2',
    date: SEED_TODAY,
    time: '10:30',
    memberId: 'm-mohammad',
    memberName: 'محمد صادقی (Mohammad)',
    memberPhone: '09129990011',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'scheduled',
    exercises: []
  },
  {
    id: 'sess-3',
    date: SEED_TODAY,
    time: '14:30',
    memberId: 'm-sara-m',
    memberName: 'سارا محمدی (Sara M.)',
    memberPhone: '09123332211',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'completed',
    completedAt: '15:45',
    exercises: [
      {
        id: 'rec-3',
        exerciseId: 'ex-barbell-squat',
        name: 'اسکوات پشت با هالتر (Barbell Back Squat)',
        bodyPart: 'پا و ران',
        equipment: 'هالتر',
        gifUrl: EXERCISE_CATALOG[4].gifUrl,
        sets: 4,
        reps: 8,
        weightKg: 45,
        notes: 'فرم عالی، موازی کامل با زمین'
      },
      {
        id: 'rec-4',
        exerciseId: 'ex-plank',
        name: 'پلانک ساعد (Forearm Core Plank)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[10].gifUrl,
        sets: 3,
        reps: 45, // seconds
        notes: 'ثابت و محکم'
      }
    ]
  },
  {
    id: 'sess-4',
    date: SEED_TODAY,
    time: '16:00',
    memberId: 'm-chloe',
    memberName: 'نیلوفر بهرامی (Niloofar)',
    memberPhone: '09125556677',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'scheduled',
    exercises: []
  }
];

const INITIAL_PAST_SESSIONS: DailySession[] = [
  // ----------------------------------------------------
  // REZA KAMALI (m-reza) - Trainer: Ali Rostami
  // ----------------------------------------------------
  {
    id: 'past-reza-1',
    date: `${CURRENT_JY}/${CURRENT_JM}/30`,
    time: '10:00',
    memberId: 'm-reza',
    memberName: 'رضا کمالی (Reza)',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'completed',
    completedAt: '11:10',
    exercises: [
      {
        id: 'rec-r1-1',
        exerciseId: 'fms-cat-camel',
        name: 'حرکت گربه-شتر (موبیلیتی ستون فقرات)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[0].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'تمرکز بر تنفس عمیق شکمی و تحرک مهره‌های بالاتنه'
      },
      {
        id: 'rec-r1-2',
        exerciseId: 'fms-goblet-squat',
        name: 'اسکوات گابلت با کتل‌بل/دمبل (اصلاح اسکوات عمیق)',
        bodyPart: 'پا و ران',
        equipment: 'کتل‌بل',
        gifUrl: EXERCISE_CATALOG[4].gifUrl,
        sets: 4,
        reps: 12,
        weightKg: 20,
        notes: 'پاشنه‌ها روی زمین، باز شدن زانوها در امتداد شست پا'
      },
      {
        id: 'rec-r1-3',
        exerciseId: 'ex-bench-press',
        name: 'پرس سینه با هالتر',
        bodyPart: 'سینه',
        equipment: 'هالتر',
        gifUrl: EXERCISE_CATALOG[12].gifUrl,
        sets: 4,
        reps: 10,
        weightKg: 45,
        notes: 'دامنه کامل، مکث ۱ ثانیه‌ای روی سینه'
      },
      {
        id: 'rec-r1-4',
        exerciseId: 'fms-deadbug',
        name: 'ددباگ (کنترل ضد اکستنشن عضلات مرکزی)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[2].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'گودی کمر کاملاً مماس با تشک'
      }
    ]
  },
  {
    id: 'past-reza-2',
    date: `${CURRENT_JY}/${CURRENT_JM}/28`,
    time: '10:00',
    memberId: 'm-reza',
    memberName: 'رضا کمالی (Reza)',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'completed',
    completedAt: '11:15',
    exercises: [
      {
        id: 'rec-r2-1',
        exerciseId: 'fms-bird-dog',
        name: 'پرنده-سگ چهار دست و پا (پایداری چرخشی)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[1].gifUrl,
        sets: 3,
        reps: 12,
        notes: 'بدون چرخش لگن، ۲ ثانیه توقف در اوج حرکت'
      },
      {
        id: 'rec-r2-2',
        exerciseId: 'ex-lat-pulldown',
        name: 'زیربغل سیم‌کش از جلو (لت)',
        bodyPart: 'پشت و زیربغل',
        equipment: 'سیم‌کش',
        gifUrl: EXERCISE_CATALOG[14].gifUrl,
        sets: 4,
        reps: 10,
        weightKg: 40,
        notes: 'انقباض عضلات زیربغل در انتهای دامنه'
      },
      {
        id: 'rec-r2-3',
        exerciseId: 'fms-chop-lift',
        name: 'چاپ نیمه‌زانو با کش/سیم‌کش (Chop & Lift)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'کش تمرینی',
        gifUrl: EXERCISE_CATALOG[3].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'بدنه کاملاً استوار و بدون حرکت اضافه'
      }
    ]
  },
  {
    id: 'past-reza-3',
    date: `${CURRENT_JY}/${CURRENT_JM}/24`,
    time: '10:00',
    memberId: 'm-reza',
    memberName: 'رضا کمالی (Reza)',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'completed',
    completedAt: '11:20',
    exercises: [
      {
        id: 'rec-r3-1',
        exerciseId: 'fms-brettzel',
        name: 'کشش برتزل (موبیلیتی ستون فقرات و چرخش ران)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[6].gifUrl,
        sets: 2,
        reps: 8,
        notes: 'تنفس عمیق در نقطه کشش'
      },
      {
        id: 'rec-r3-2',
        exerciseId: 'ex-barbell-squat',
        name: 'اسکوات پشت با هالتر',
        bodyPart: 'پا و ران',
        equipment: 'هالتر',
        gifUrl: EXERCISE_CATALOG[15].gifUrl,
        sets: 4,
        reps: 8,
        weightKg: 50,
        notes: 'فرم عالی، ران‌ها شکستن خط موازی'
      },
      {
        id: 'rec-r3-3',
        exerciseId: 'fms-farmer-carry',
        name: "حمل کشاورز / حمل چمدانی (Farmer Carry)",
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'کتل‌بل',
        gifUrl: EXERCISE_CATALOG[10].gifUrl,
        sets: 3,
        reps: 30,
        weightKg: 24,
        notes: 'گام‌های استوار، شانه به عقب'
      }
    ]
  },
  {
    id: 'past-reza-4',
    date: `${CURRENT_JY}/${CURRENT_JM}/18`,
    time: '10:00',
    memberId: 'm-reza',
    memberName: 'رضا کمالی (Reza)',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'completed',
    completedAt: '11:10',
    exercises: [
      {
        id: 'rec-r4-1',
        exerciseId: 'fms-single-leg-rdl',
        name: 'ددلیفت رومانیایی تک‌پا (ثبات پلویک و همسترینگ)',
        bodyPart: 'پا و ران',
        equipment: 'دمبل',
        gifUrl: EXERCISE_CATALOG[7].gifUrl,
        sets: 3,
        reps: 10,
        weightKg: 12,
        notes: 'تمرکز روی کشش همسترینگ و عدم چرخش باسن'
      },
      {
        id: 'rec-r4-2',
        exerciseId: 'fms-pushup-stability',
        name: 'شنای اصلاحی با پایداری تنه',
        bodyPart: 'سینه',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[5].gifUrl,
        sets: 3,
        reps: 12,
        notes: 'تنه در یک خط مستقیم بدون افتادگی کمر'
      },
      {
        id: 'rec-r4-3',
        exerciseId: 'ex-incline-dumbbell',
        name: 'پرس بالا سینه با دمبل',
        bodyPart: 'سینه',
        equipment: 'دمبل',
        gifUrl: EXERCISE_CATALOG[13].gifUrl,
        sets: 3,
        reps: 10,
        weightKg: 16,
        notes: 'شیب ۳۰ درجه نیمکت'
      }
    ]
  },
  {
    id: 'past-reza-5',
    date: `${PREV_JY}/${PREV_JM}/27`,
    time: '10:00',
    memberId: 'm-reza',
    memberName: 'رضا کمالی (Reza)',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'completed',
    completedAt: '11:05',
    exercises: [
      {
        id: 'rec-r5-1',
        exerciseId: 'fms-cat-camel',
        name: 'حرکت گربه-شتر (موبیلیتی ستون فقرات)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[0].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'موبیلیتی اولیه'
      },
      {
        id: 'rec-r5-2',
        exerciseId: 'ex-bench-press',
        name: 'پرس سینه با هالتر',
        bodyPart: 'سینه',
        equipment: 'هالتر',
        gifUrl: EXERCISE_CATALOG[12].gifUrl,
        sets: 4,
        reps: 8,
        weightKg: 40,
        notes: 'افزایش تدریجی وزنه'
      },
      {
        id: 'rec-r5-3',
        exerciseId: 'ex-plank',
        name: 'پلانک ساعد (استقامت ایزومتریک)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[16].gifUrl,
        sets: 3,
        reps: 45,
        notes: 'حفظ راستای ستون فقرات'
      }
    ]
  },

  // ----------------------------------------------------
  // SARA MOHAMMADI (m-sara-m) - Trainer: Sara Jalali
  // ----------------------------------------------------
  {
    id: 'past-sara-1',
    date: `${CURRENT_JY}/${CURRENT_JM}/29`,
    time: '15:00',
    memberId: 'm-sara-m',
    memberName: 'سارا محمدی (Sara M.)',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'completed',
    completedAt: '16:05',
    exercises: [
      {
        id: 'rec-s1-1',
        exerciseId: 'fms-cat-camel',
        name: 'حرکت گربه-شتر (موبیلیتی ستون فقرات)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[0].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'گرم کردن ستون فقرات'
      },
      {
        id: 'rec-s1-2',
        exerciseId: 'fms-glute-bridge',
        name: 'پل باسن با مکث ایزومتریک (Glute Bridge)',
        bodyPart: 'پا و ران',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[8].gifUrl,
        sets: 4,
        reps: 12,
        notes: '۳ ثانیه مکث ایزومتریک در بالا'
      },
      {
        id: 'rec-s1-3',
        exerciseId: 'fms-pallof-press',
        name: 'پرس پالوف ضد چرخش با کش (Pallof Press)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'کش تمرینی',
        gifUrl: EXERCISE_CATALOG[9].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'بدون چرخش بالاتنه'
      }
    ]
  },
  {
    id: 'past-sara-2',
    date: `${CURRENT_JY}/${CURRENT_JM}/26`,
    time: '15:00',
    memberId: 'm-sara-m',
    memberName: 'سارا محمدی (Sara M.)',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'completed',
    completedAt: '16:00',
    exercises: [
      {
        id: 'rec-s2-1',
        exerciseId: 'fms-wall-angel',
        name: 'فرشته دیواری (موبیلیتی کتف و باز شدن شانه)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[11].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'تماس مچ‌ها و آرنج با دیوار'
      },
      {
        id: 'rec-s2-2',
        exerciseId: 'fms-goblet-squat',
        name: 'اسکوات گابلت با کتل‌بل/دمبل',
        bodyPart: 'پا و ران',
        equipment: 'کتل‌بل',
        gifUrl: EXERCISE_CATALOG[4].gifUrl,
        sets: 3,
        reps: 12,
        weightKg: 12,
        notes: 'حرکت روان و با ریتم کنترل‌شده'
      },
      {
        id: 'rec-s2-3',
        exerciseId: 'ex-incline-dumbbell',
        name: 'پرس بالا سینه با دمبل',
        bodyPart: 'سینه',
        equipment: 'دمبل',
        gifUrl: EXERCISE_CATALOG[13].gifUrl,
        sets: 3,
        reps: 12,
        weightKg: 8,
        notes: 'فرم بسیار کنترل‌شده'
      }
    ]
  },
  {
    id: 'past-sara-3',
    date: `${CURRENT_JY}/${CURRENT_JM}/21`,
    time: '15:00',
    memberId: 'm-sara-m',
    memberName: 'سارا محمدی (Sara M.)',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'completed',
    completedAt: '16:10',
    exercises: [
      {
        id: 'rec-s3-1',
        exerciseId: 'fms-brettzel',
        name: 'کشش برتزل (موبیلیتی ستون فقرات و چرخش ران)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[6].gifUrl,
        sets: 2,
        reps: 8,
        notes: 'کشش عالی عضلات خم‌کننده ران'
      },
      {
        id: 'rec-s3-2',
        exerciseId: 'fms-deadbug',
        name: 'ددباگ (کنترل ضد اکستنشن عضلات مرکزی)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[2].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'تنفس عمیق حین اجرای هر تکرار'
      },
      {
        id: 'rec-s3-3',
        exerciseId: 'ex-lat-pulldown',
        name: 'زیربغل سیم‌کش از جلو (لت)',
        bodyPart: 'پشت و زیربغل',
        equipment: 'سیم‌کش',
        gifUrl: EXERCISE_CATALOG[14].gifUrl,
        sets: 3,
        reps: 12,
        weightKg: 25,
        notes: 'تمرکز روی تقارن حرکتی کتف‌ها'
      }
    ]
  },
  {
    id: 'past-sara-4',
    date: `${PREV_JY}/${PREV_JM}/28`,
    time: '15:00',
    memberId: 'm-sara-m',
    memberName: 'سارا محمدی (Sara M.)',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'completed',
    completedAt: '16:00',
    exercises: [
      {
        id: 'rec-s4-1',
        exerciseId: 'fms-bird-dog',
        name: 'پرنده-سگ چهار دست و پا (پایداری چرخشی)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[1].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'حفظ ثبات لگن'
      },
      {
        id: 'rec-s4-2',
        exerciseId: 'ex-plank',
        name: 'پلانک ساعد (استقامت ایزومتریک)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[16].gifUrl,
        sets: 3,
        reps: 35,
        notes: '۳۵ ثانیه بدون افت شانه'
      }
    ]
  },

  // ----------------------------------------------------
  // MOHAMMAD SADEGHI (m-mohammad) - Trainer: Ali Rostami
  // ----------------------------------------------------
  {
    id: 'past-mohammad-1',
    date: `${CURRENT_JY}/${CURRENT_JM}/29`,
    time: '11:30',
    memberId: 'm-mohammad',
    memberName: 'محمد صادقی (Mohammad)',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'completed',
    completedAt: '12:30',
    exercises: [
      {
        id: 'rec-m1-1',
        exerciseId: 'ex-bench-press',
        name: 'پرس سینه با هالتر',
        bodyPart: 'سینه',
        equipment: 'هالتر',
        gifUrl: EXERCISE_CATALOG[12].gifUrl,
        sets: 4,
        reps: 10,
        weightKg: 55,
        notes: 'وزنه سنگین با کنترل کامل'
      },
      {
        id: 'rec-m1-2',
        exerciseId: 'fms-single-leg-rdl',
        name: 'ددلیفت رومانیایی تک‌پا (ثبات پلویک و همسترینگ)',
        bodyPart: 'پا و ران',
        equipment: 'دمبل',
        gifUrl: EXERCISE_CATALOG[7].gifUrl,
        sets: 3,
        reps: 8,
        weightKg: 14,
        notes: 'حفظ تعادل روی پای تکیه‌گاه'
      },
      {
        id: 'rec-m1-3',
        exerciseId: 'fms-pushup-stability',
        name: 'شنای اصلاحی با پایداری تنه',
        bodyPart: 'سینه',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[5].gifUrl,
        sets: 3,
        reps: 15,
        notes: 'انقباض شکم و باسن'
      }
    ]
  },
  {
    id: 'past-mohammad-2',
    date: `${CURRENT_JY}/${CURRENT_JM}/25`,
    time: '11:30',
    memberId: 'm-mohammad',
    memberName: 'محمد صادقی (Mohammad)',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'completed',
    completedAt: '12:35',
    exercises: [
      {
        id: 'rec-m2-1',
        exerciseId: 'fms-deadbug',
        name: 'ددباگ (کنترل ضد اکستنشن عضلات مرکزی)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[2].gifUrl,
        sets: 3,
        reps: 12,
        notes: 'هماهنگی عصب و عضله'
      },
      {
        id: 'rec-m2-2',
        exerciseId: 'ex-lat-pulldown',
        name: 'زیربغل سیم‌کش از جلو (لت)',
        bodyPart: 'پشت و زیربغل',
        equipment: 'سیم‌کش',
        gifUrl: EXERCISE_CATALOG[14].gifUrl,
        sets: 4,
        reps: 10,
        weightKg: 45,
        notes: 'دامنه حرکتی کامل'
      },
      {
        id: 'rec-m2-3',
        exerciseId: 'fms-farmer-carry',
        name: "حمل کشاورز / حمل چمدانی (Farmer Carry)",
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'کتل‌بل',
        gifUrl: EXERCISE_CATALOG[10].gifUrl,
        sets: 3,
        reps: 30,
        weightKg: 28,
        notes: 'افزایش قدرت گریپ و هسته'
      }
    ]
  },
  {
    id: 'past-mohammad-3',
    date: `${CURRENT_JY}/${CURRENT_JM}/19`,
    time: '11:30',
    memberId: 'm-mohammad',
    memberName: 'محمد صادقی (Mohammad)',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'completed',
    completedAt: '12:25',
    exercises: [
      {
        id: 'rec-m3-1',
        exerciseId: 'ex-barbell-squat',
        name: 'اسکوات پشت با هالتر',
        bodyPart: 'پا و ران',
        equipment: 'هالتر',
        gifUrl: EXERCISE_CATALOG[15].gifUrl,
        sets: 4,
        reps: 8,
        weightKg: 60,
        notes: 'رعایت زاویه زانوها و سینه بالا'
      },
      {
        id: 'rec-m3-2',
        exerciseId: 'fms-chop-lift',
        name: 'چاپ نیمه‌زانو با کش/سیم‌کش (Chop & Lift)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'کش تمرینی',
        gifUrl: EXERCISE_CATALOG[3].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'قدرت انفجاری بالاتنه'
      }
    ]
  },
  {
    id: 'past-mohammad-4',
    date: `${PREV_JY}/${PREV_JM}/25`,
    time: '11:30',
    memberId: 'm-mohammad',
    memberName: 'محمد صادقی (Mohammad)',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    status: 'completed',
    completedAt: '12:30',
    exercises: [
      {
        id: 'rec-m4-1',
        exerciseId: 'ex-bench-press',
        name: 'پرس سینه با هالتر',
        bodyPart: 'سینه',
        equipment: 'هالتر',
        gifUrl: EXERCISE_CATALOG[12].gifUrl,
        sets: 4,
        reps: 10,
        weightKg: 50,
        notes: 'شروع خوب ماه گذشته'
      },
      {
        id: 'rec-m4-2',
        exerciseId: 'ex-plank',
        name: 'پلانک ساعد (استقامت ایزومتریک)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[16].gifUrl,
        sets: 3,
        reps: 45,
        notes: 'استقامت عالی'
      }
    ]
  },

  // ----------------------------------------------------
  // NILOOFAR BAHRAMI (m-chloe) - Trainer: Sara Jalali
  // ----------------------------------------------------
  {
    id: 'past-chloe-1',
    date: `${CURRENT_JY}/${CURRENT_JM}/27`,
    time: '16:30',
    memberId: 'm-chloe',
    memberName: 'نیلوفر بهرامی (Niloofar)',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'completed',
    completedAt: '17:30',
    exercises: [
      {
        id: 'rec-c1-1',
        exerciseId: 'fms-brettzel',
        name: 'کشش برتزل (موبیلیتی ستون فقرات و چرخش ران)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[6].gifUrl,
        sets: 2,
        reps: 8,
        notes: 'رفع گرفتگی عضلات ران و بالاتنه'
      },
      {
        id: 'rec-c1-2',
        exerciseId: 'fms-glute-bridge',
        name: 'پل باسن با مکث ایزومتریک (Glute Bridge)',
        bodyPart: 'پا و ران',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[8].gifUrl,
        sets: 3,
        reps: 12,
        notes: 'فعال‌سازی باسن'
      },
      {
        id: 'rec-c1-3',
        exerciseId: 'fms-pallof-press',
        name: 'پرس پالوف ضد چرخش با کش (Pallof Press)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'کش تمرینی',
        gifUrl: EXERCISE_CATALOG[9].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'استقامت تنه'
      }
    ]
  },
  {
    id: 'past-chloe-2',
    date: `${CURRENT_JY}/${CURRENT_JM}/23`,
    time: '16:30',
    memberId: 'm-chloe',
    memberName: 'نیلوفر بهرامی (Niloofar)',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'completed',
    completedAt: '17:35',
    exercises: [
      {
        id: 'rec-c2-1',
        exerciseId: 'fms-bird-dog',
        name: 'پرنده-سگ چهار دست و پا (پایداری چرخشی)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[1].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'پایداری بدون چرخش لگن'
      },
      {
        id: 'rec-c2-2',
        exerciseId: 'fms-goblet-squat',
        name: 'اسکوات گابلت با کتل‌بل/دمبل',
        bodyPart: 'پا و ران',
        equipment: 'کتل‌بل',
        gifUrl: EXERCISE_CATALOG[4].gifUrl,
        sets: 3,
        reps: 10,
        weightKg: 10,
        notes: 'فرم عالی، سینه کاملاً بالا'
      },
      {
        id: 'rec-c2-3',
        exerciseId: 'fms-wall-angel',
        name: 'فرشته دیواری (موبیلیتی کتف و باز شدن شانه)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[11].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'موبیلیتی کمربند شانه‌ای'
      }
    ]
  },
  {
    id: 'past-chloe-3',
    date: `${CURRENT_JY}/${CURRENT_JM}/16`,
    time: '16:30',
    memberId: 'm-chloe',
    memberName: 'نیلوفر بهرامی (Niloofar)',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'completed',
    completedAt: '17:25',
    exercises: [
      {
        id: 'rec-c3-1',
        exerciseId: 'fms-cat-camel',
        name: 'حرکت گربه-شتر (موبیلیتی ستون فقرات)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[0].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'روان‌سازی حرکات مهره‌ها'
      },
      {
        id: 'rec-c3-2',
        exerciseId: 'fms-single-leg-rdl',
        name: 'ددلیفت رومانیایی تک‌پا (ثبات پلویک و همسترینگ)',
        bodyPart: 'پا و ران',
        equipment: 'دمبل',
        gifUrl: EXERCISE_CATALOG[7].gifUrl,
        sets: 3,
        reps: 8,
        weightKg: 8,
        notes: 'تعادل و پایداری'
      },
      {
        id: 'rec-c3-3',
        exerciseId: 'ex-plank',
        name: 'پلانک ساعد (استقامت ایزومتریک)',
        bodyPart: 'شکم و مرکز بدن',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[16].gifUrl,
        sets: 3,
        reps: 30,
        notes: '۳۰ ثانیه مداوم'
      }
    ]
  },
  {
    id: 'past-chloe-4',
    date: `${PREV_JY}/${PREV_JM}/29`,
    time: '16:30',
    memberId: 'm-chloe',
    memberName: 'نیلوفر بهرامی (Niloofar)',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    status: 'completed',
    completedAt: '17:20',
    exercises: [
      {
        id: 'rec-c4-1',
        exerciseId: 'fms-brettzel',
        name: 'کشش برتزل (موبیلیتی ستون فقرات و چرخش ران)',
        bodyPart: 'موبیلیتی و اصلاحی',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[6].gifUrl,
        sets: 2,
        reps: 8,
        notes: 'کشش عالی'
      },
      {
        id: 'rec-c4-2',
        exerciseId: 'fms-glute-bridge',
        name: 'پل باسن با مکث ایزومتریک (Glute Bridge)',
        bodyPart: 'پا و ران',
        equipment: 'وزن بدن',
        gifUrl: EXERCISE_CATALOG[8].gifUrl,
        sets: 3,
        reps: 10,
        notes: 'انقباض خوب'
      }
    ]
  }
];

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    memberId: 'm-reza',
    memberName: 'رضا کمالی (Reza)',
    amount: 8000000,
    date: '1403/06/01',
    method: 'card',
    description: 'پیش‌پرداخت بسته ۱۲ جلسه‌ای خصوصی',
    recordedBy: 'مدیر باشگاه'
  },
  {
    id: 'pay-2',
    memberId: 'm-sara-m',
    memberName: 'سارا محمدی (Sara M.)',
    amount: 20000000,
    date: '1403/05/15',
    method: 'transfer',
    description: 'تسویه کامل بسته ۲۰ جلسه‌ای VIP',
    recordedBy: 'مدیر باشگاه'
  },
  {
    id: 'pay-3',
    memberId: 'm-mohammad',
    memberName: 'محمد صادقی (Mohammad)',
    amount: 8000000,
    date: '1403/06/10',
    method: 'card',
    description: 'پرداخت نقدی ۸ میلیون از بسته ۱۰ میلیونی',
    recordedBy: 'مدیر باشگاه'
  }
];

const INITIAL_TRAINER_PAYOUTS: TrainerPaymentRecord[] = [
  {
    id: 'tp-1',
    trainerId: 't-ali',
    trainerName: 'علی رستمی (Ali)',
    amount: 8000000,
    date: '1403/06/15',
    method: 'transfer',
    description: 'تسویه علی‌الحساب دستمزد شهریور'
  },
  {
    id: 'tp-2',
    trainerId: 't-sara',
    trainerName: 'سارا جلالی (Sara)',
    amount: 7000000,
    date: '1403/06/15',
    method: 'transfer',
    description: 'تسویه علی‌الحساب دستمزد شهریور'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    action: 'SESSION_COMPLETED',
    entityType: 'DailySession',
    entityId: 'sess-3',
    details: 'تکمیل جلسه سارا محمدی با مربی سارا جلالی. کسر دقیقاً ۱ جلسه از بسته عضو.',
    timestamp: '1403/06/21 15:45',
    user: 'سارا جلالی (مربی)'
  },
  {
    id: 'aud-2',
    action: 'PAYMENT_RECORDED',
    entityType: 'Member',
    entityId: 'm-reza',
    details: 'ثبت پرداخت ۸,۰۰۰,۰۰۰ تومان توسط رضا کمالی.',
    timestamp: '1403/06/01 10:30',
    user: 'مدیر باشگاه'
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u-owner',
    username: 'admin',
    password: '123',
    role: 'owner',
    entityId: 'gym-1',
    displayName: 'مدیر باشگاه (Admin)',
    phone: '09120000000',
    createdAt: '1403/01/01'
  },
  {
    id: 'u-ali',
    username: 'ali',
    password: '123',
    role: 'trainer',
    entityId: 't-ali',
    displayName: 'علی رستمی (Ali)',
    phone: '09121112233',
    createdAt: '1403/01/01'
  },
  {
    id: 'u-sara',
    username: 'sara',
    password: '123',
    role: 'trainer',
    entityId: 't-sara',
    displayName: 'سارا جلالی (Sara)',
    phone: '09124445566',
    createdAt: '1403/01/01'
  },
  {
    id: 'u-reza',
    username: 'reza',
    password: '123',
    role: 'member',
    entityId: 'm-reza',
    displayName: 'رضا کمالی (Reza)',
    phone: '09127778899',
    createdAt: '1403/06/01'
  },
  {
    id: 'u-saram',
    username: 'saram',
    password: '123',
    role: 'member',
    entityId: 'm-sara-m',
    displayName: 'سارا محمدی (Sara M.)',
    phone: '09123332211',
    createdAt: '1403/05/15'
  },
  {
    id: 'u-mohammad',
    username: 'mohammad',
    password: '123',
    role: 'member',
    entityId: 'm-mohammad',
    displayName: 'محمد صادقی (Mohammad)',
    phone: '09129990011',
    createdAt: '1403/06/10'
  },
  {
    id: 'u-niloofar',
    username: 'niloofar',
    password: '123',
    role: 'member',
    entityId: 'm-chloe',
    displayName: 'نیلوفر بهرامی (Niloofar)',
    phone: '09125556677',
    createdAt: '1403/06/05'
  }
];

/** حساب نمونهٔ مدیر کل در دموی محلی */
export const SUPER_ADMIN_DEMO: UserAccount = {
  id: 'u-super',
  username: 'superadmin',
  password: '123',
  role: 'super_admin',
  entityId: '',
  displayName: 'مدیر کل سامانه (Super Admin)',
  phone: '09120000099',
  createdAt: '1403/01/01'
};

/** حساب‌های قدیمی بدون gymId به باشگاه نمونه تعلق دارند؛ مدیر کل دمو همیشه وجود دارد. */
function withDemoAccounts(users: UserAccount[]): UserAccount[] {
  const list = users.map(u =>
    u.role === 'super_admin' || u.gymId ? u : { ...u, gymId: INITIAL_GYM.id }
  );
  return list.some(u => u.role === 'super_admin') ? list : [SUPER_ADMIN_DEMO, ...list];
}

/** دادهٔ نمونهٔ باشگاه دمو — کپی مستقل تا تغییرات استور دادهٔ اولیه را آلوده نکند */
export function initialGymData() {
  return structuredClone({
    gym: INITIAL_GYM,
    trainers: INITIAL_TRAINERS,
    members: INITIAL_MEMBERS,
    todaySessions: INITIAL_TODAY_SESSIONS,
    pastSessions: INITIAL_PAST_SESSIONS,
    memberPayments: INITIAL_PAYMENTS,
    trainerPayouts: INITIAL_TRAINER_PAYOUTS,
    sessionAdjustments: [] as SessionAdjustmentRecord[],
    auditLogs: INITIAL_AUDIT_LOGS,
    exercises: EXERCISE_CATALOG,
    dailyCapacityConfigs: {} as Record<string, DailyCapacityConfig>,
    programs: [] as WorkoutProgram[],
  });
}

/** باشگاه تازه‌ساخته: بدون مربی، عضو و جلسه؛ فقط کاتالوگ حرکات */
export function emptyGymData(gym: Gym) {
  return {
    gym: { ...gym },
    trainers: [] as Trainer[],
    members: [] as Member[],
    todaySessions: [] as DailySession[],
    pastSessions: [] as DailySession[],
    memberPayments: [] as PaymentRecord[],
    trainerPayouts: [] as TrainerPaymentRecord[],
    sessionAdjustments: [] as SessionAdjustmentRecord[],
    auditLogs: [] as AuditLog[],
    exercises: structuredClone(EXERCISE_CATALOG),
    dailyCapacityConfigs: {} as Record<string, DailyCapacityConfig>,
    programs: [] as WorkoutProgram[],
  };
}

export class GymStore {
  /** همهٔ باشگاه‌های سامانه (برای مدیر کل). دادهٔ تفصیلی فقط برای باشگاه فعال بار می‌شود. */
  gyms: Gym[] = [INITIAL_GYM];
  gym = INITIAL_GYM;
  trainers = INITIAL_TRAINERS;
  members = INITIAL_MEMBERS;
  todaySessions = INITIAL_TODAY_SESSIONS;
  pastSessions = INITIAL_PAST_SESSIONS;
  memberPayments = INITIAL_PAYMENTS;
  trainerPayouts = INITIAL_TRAINER_PAYOUTS;
  sessionAdjustments: SessionAdjustmentRecord[] = [];
  auditLogs = INITIAL_AUDIT_LOGS;
  exercises: ExerciseItem[] = [...EXERCISE_CATALOG];

  users: UserAccount[] = withDemoAccounts(INITIAL_USERS);
  currentUser: UserAccount | null = null; // Unauthenticated by default (F3)

  /** آیا وضعیت نشست مشخص شده است؟ (در مرورگر پس از پاسخ /api/auth/me) */
  authReady = false;

  /**
   * B-07: کاربر پیش‌نمایش نقش — فقط وقتی کاربر واقعی مدیر باشگاه است.
   * ذخیره نمی‌شود و هویت داده‌ای همهٔ صفحات (نه فقط پوستهٔ UI) را تعیین می‌کند.
   */
  previewUser: UserAccount | null = null;

  /** باشگاهی که مدیر کل وارد پنلش شده است (برای پیش‌نمایش نقش‌ها) */
  adminGymId: string | null = null;

  /** هویتی که صفحات با آن داده می‌خوانند: کاربر پیش‌نمایش یا کاربر واردشده */
  get actingUser(): UserAccount | null {
    return this.previewUser ?? this.currentUser;
  }

  /**
   * تنظیم بی‌صدا و idempotent کاربر پیش‌نمایش (بدون notify، چون در حین render فراخوانی می‌شود).
   * @returns آیا مقدار تغییر کرد؟
   */
  setPreviewUser(userId: string | null): boolean {
    const next =
      userId && can(this.currentUser?.role, 'role.preview')
        ? this.users.find(u => u.id === userId) ?? null
        : null;
    if ((next?.id ?? null) === (this.previewUser?.id ?? null)) return false;
    this.previewUser = next;
    return true;
  }

  dailyCapacityConfigs: Record<string, DailyCapacityConfig> = {};

  /** برنامه‌های تمرینی مربیان که به ورزشکاران منتشر می‌شوند */
  programs: WorkoutProgram[] = [];

  activeTrainerId = 't-ali';
  activeMemberId = 'm-reza';

  listeners = new Set<() => void>();

  /** حساب‌های باشگاه فعال (برای پیش‌نمایش نقش و فهرست کاربران) */
  get gymUsers(): UserAccount[] {
    return this.users.filter(u => (u.gymId ?? INITIAL_GYM.id) === this.gym.id);
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  // ==========================================
  // AUTHENTICATION & USER MANAGEMENT
  // ==========================================
  /**
   * بررسی محلی اعتبار ورود — برای تست‌های واحد. ورود واقعی در سرور است
   * (src/server/auth) و رمز را با hash ذخیره‌شده در PostgreSQL مقایسه می‌کند.
   */
  login(username: string, password: string): StoreResult {
    // ورود با شمارهٔ موبایل (با هر نوع رقم و پیشوند) یا نام کاربری
    const id = normalizeLoginId(username);
    const user = this.users.find(
      u => u.username.toLowerCase() === id || (!!u.phone && normalizePhone(u.phone) === id)
    );
    if (!user) return storeResult(false, 'login.userNotFound');
    if (user.password !== password.trim()) return storeResult(false, 'login.badPassword');
    if (user.isActive === false) return storeResult(false, 'login.inactive');
    if (user.gymId && this.gyms.find(g => g.id === user.gymId)?.isActive === false) {
      return storeResult(false, 'login.gymInactive');
    }
    this.currentUser = user;
    this.previewUser = null;
    this.notify();
    return storeResult(true, 'login.success');
  }

  logout() {
    this.currentUser = null;
    this.previewUser = null;
    this.adminGymId = null;
    this.mustChangePassword = false;
    this.notify();
  }

  /** کاربری که سرور تأیید کرده است (یا null پس از خروج) */
  setAuthenticatedUser(user: UserAccount | null) {
    this.currentUser = user;
    this.previewUser = null;
    this.authReady = true;
    this.notify();
  }

  // ==========================================
  // ACCOUNTS & GYMS (مدیر کل → باشگاه و مدیر؛ مدیر → مربی و ورزشکار؛ مربی → ورزشکار)
  // ==========================================

  /** اعتبارسنجی مشترک ساخت حساب؛ null یعنی معتبر */
  private checkNewAccount(name: string, phone: string, password: string | undefined): StoreResult | null {
    if (!name.trim()) return storeResult(false, 'account.invalidName');
    if (!isValidMobile(phone)) return storeResult(false, 'account.invalidPhone');
    if (this.users.some(u => u.phone && normalizePhone(u.phone) === phone)) {
      return storeResult(false, 'account.phoneTaken');
    }
    if (password !== undefined && password.trim().length < MIN_PASSWORD_LENGTH) {
      return storeResult(false, 'account.weakPassword');
    }
    return null;
  }

  private audit(action: string, entityType: string, entityId: string, details: string) {
    this.auditLogs.unshift({
      id: nextId('aud'),
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
  }

  resetPassword(userId: string, newPassword: string): StoreResult {
    const user = this.users.find(u => u.id === userId);
    if (!user) return storeResult(false, 'member.notFound');
    if (newPassword.trim().length < MIN_PASSWORD_LENGTH) return storeResult(false, 'account.weakPassword');
    // رمز خام فقط در حافظهٔ موتور سرور می‌ماند تا hash و ذخیره شود؛ به مرورگر فرستاده نمی‌شود
    user.password = newPassword.trim();
    this.audit(
      'PASSWORD_RESET',
      'UserAccount',
      userId,
      `کلمه عبور حساب کاربری ${user.displayName} (${user.username}) تغییر یافت.`
    );
    this.notify();
    return storeResult(true, 'account.passwordChanged');
  }

  /** فعال/غیرفعال کردن حساب. حساب غیرفعال اجازهٔ ورود ندارد. */
  setAccountActive(userId: string, active: boolean): StoreResult {
    const user = this.users.find(u => u.id === userId);
    if (!user) return storeResult(false, 'member.notFound');
    user.isActive = active;
    if (user.role === 'trainer') {
      const trainer = this.trainers.find(t => t.id === user.entityId);
      if (trainer) trainer.status = active ? 'active' : 'inactive';
    }
    if (user.role === 'member') {
      const member = this.members.find(m => m.id === user.entityId);
      if (member) member.status = active ? 'active' : 'inactive';
    }
    this.notify();
    return storeResult(true, active ? 'account.activated' : 'account.deactivated');
  }

  /** حساب ورود یک رکورد مربی/عضو در باشگاه فعال */
  accountFor(role: 'trainer' | 'member', entityId: string): UserAccount | undefined {
    return this.users.find(u => u.role === role && u.entityId === entityId);
  }

  createUserAccount(data: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount {
    const newUser: UserAccount = {
      gymId: data.role === 'super_admin' ? undefined : this.gym.id,
      ...data,
      id: nextId('u'),
      createdAt: getTodayJalaliString()
    };
    this.users.unshift(newUser);
    this.notify();
    return newUser;
  }

  // ==========================================
  // CALENDAR & DAILY CAPACITY OVERRIDES
  // ==========================================
  setGymDailyCapacity(date: string, capacity: number) {
    const validCap = Math.max(1, Number(capacity) || 1);
    if (!this.dailyCapacityConfigs[date]) {
      this.dailyCapacityConfigs[date] = { date };
    }
    this.dailyCapacityConfigs[date].gymCapacity = validCap;
    this.notify();
  }

  getGymDailyCapacity(date: string): number {
    const cap = this.dailyCapacityConfigs[date]?.gymCapacity ?? this.gym.capacity ?? 30;
    return Math.max(1, cap);
  }

  setTrainerDailyCapacity(date: string, trainerId: string, capacity: number) {
    const validCap = Math.max(1, Number(capacity) || 1);
    if (!this.dailyCapacityConfigs[date]) {
      this.dailyCapacityConfigs[date] = { date, trainerCapacities: {} };
    }
    if (!this.dailyCapacityConfigs[date].trainerCapacities) {
      this.dailyCapacityConfigs[date].trainerCapacities = {};
    }
    this.dailyCapacityConfigs[date].trainerCapacities![trainerId] = validCap;
    this.notify();
  }

  getTrainerDailyCapacity(date: string, trainerId: string): number {
    const override = this.dailyCapacityConfigs[date]?.trainerCapacities?.[trainerId];
    if (override !== undefined) return Math.max(1, override);
    const trainer = this.trainers.find(t => t.id === trainerId);
    return Math.max(1, trainer?.dailyCapacity ?? 6);
  }

  getSessionsForDate(date: string, trainerId?: string, memberId?: string): DailySession[] {
    const today = getTodayJalaliString();
    return this.todaySessions.filter(s => {
      const matchesDate = isSameDate(s.date, date, today);
      const matchesTrainer = !trainerId || s.trainerId === trainerId;
      const matchesMember = !memberId || s.memberId === memberId;
      return matchesDate && matchesTrainer && matchesMember;
    });
  }

  /** همهٔ جلسات (برنامه‌ریزی‌شده و تاریخچه) بدون تکرار — برای validator ظرفیت */
  private allSessions(): DailySession[] {
    const seen = new Set<string>();
    return [...this.todaySessions, ...this.pastSessions].filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }

  /**
   * B-04: validator واحد برای ایجاد، افزودن سریع، جابه‌جایی ساعت و انتقال مربی.
   */
  private checkBooking(
    req: { date: string; time: string; memberId: string; trainerId: string; excludeSessionId?: string },
    names: { trainerName: string; memberName: string },
    options: { allowPastDate?: boolean } = {}
  ) {
    const today = getTodayJalaliString();
    const date = canonicalDate(req.date, today);
    return validateBooking(this.allSessions(), { ...req, date }, {
      today,
      gymDailyCapacity: this.getGymDailyCapacity(date),
      trainerDailyCapacity: this.getTrainerDailyCapacity(date, req.trainerId),
      gymHourlyCapacity: this.gym.hourlyCapacity,
      trainerName: names.trainerName,
      memberName: names.memberName,
      allowPastDate: options.allowPastDate,
      memberPackagePending: this.members.find(m => m.id === req.memberId)?.packagePending === true,
    });
  }

  /** آیا تاریخ ذخیره‌شده امروز است؟ (مقدار قدیمی «Today» هم پشتیبانی می‌شود) */
  private isTodayDate(date: string): boolean {
    const today = getTodayJalaliString();
    return isSameDate(date, today, today);
  }

  getSessionById(sessionId: string): DailySession | undefined {
    return this.todaySessions.find(s => s.id === sessionId) || this.pastSessions.find(s => s.id === sessionId);
  }

  scheduleSessionOnDate(
    date: string,
    time: string,
    memberId: string,
    trainerId: string,
    exercises: SessionExercise[] = []
  ): StoreResult & { session?: DailySession } {
    const member = this.members.find(m => m.id === memberId);
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!member || !trainer) {
      return {
        success: false,
        messageKey: 'session.memberOrTrainerNotFound',
        message: 'ورزشکار یا مربی یافت نشد.',
      };
    }

    // B-04: ظرفیت مربی، ظرفیت باشگاه، تداخل زمانی و نوبت تکراری — لغوشده‌ها ظرفیت نمی‌گیرند
    const check = this.checkBooking(
      { date, time, memberId, trainerId },
      { trainerName: trainer.name, memberName: member.name }
    );
    if (!check.ok) return storeResult(false, check.messageKey!, check.params);

    const newSess: DailySession = {
      id: nextId('sess'),
      date: canonicalDate(date, getTodayJalaliString()),
      time,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      trainerId: trainer.id,
      trainerName: trainer.name,
      isDailyOverride: member.defaultTrainerId !== trainer.id,
      status: 'scheduled',
      exercises
    };

    this.todaySessions.push(newSess);
    this.notify();
    return {
      success: true,
      messageKey: 'session.scheduled',
      message: 'جلسه با موفقیت در تقویم ثبت شد.',
      session: newSess,
    };
  }

  // ==========================================
  // ATOMIC SESSION COMPLETION (Section 65 & 66)
  // ==========================================
  completeMemberSession(
    sessionId: string,
    exercises?: SessionExercise[],
    today: string = getTodayJalaliString()
  ): StoreResult & { idempotent: boolean; remainingSessions: number } {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');

    // 1. Idempotency Check: Calling twice must not deduct twice
    if (session.status === 'completed') {
      const mem = this.members.find(m => m.id === session.memberId);
      if (exercises && exercises.length > 0) {
        session.exercises = exercises;
        this.notify();
      }
      return {
        success: true,
        idempotent: true,
        remainingSessions: mem?.remainingSessions || 0,
        messageKey: 'session.alreadyCompleted',
        message: 'این جلسه قبلاً با موفقیت تکمیل شده و جلسه‌ای مجدداً کسر نگردید.',
      };
    }

    const member = this.members.find(m => m.id === session.memberId);
    if (!member) throw new Error('MEMBER_NOT_FOUND');

    // B-06: جلسهٔ لغوشده/غیبت، عضو بدون اعتبار یا بستهٔ منقضی نباید اعتبار و دستمزد را مصرف کند
    const completable = checkCompletable(session, member, today);
    if (!completable.ok) {
      return {
        ...storeResult(false, completable.messageKey!, completable.params),
        idempotent: false,
        remainingSessions: member.remainingSessions,
      };
    }

    const trainer = this.trainers.find(t => t.id === session.trainerId);

    // 2. Mark session completed and save recorded exercises
    session.status = 'completed';
    session.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (exercises && exercises.length > 0) {
      session.exercises = exercises;
    }

    // 3. Atomically consume exactly 1 session
    member.usedSessions += 1;
    member.remainingSessions = Math.max(0, member.totalSessions - member.usedSessions);

    // 4. Update trainer compensation
    if (trainer) {
      trainer.completedSessions += 1;
      const grossEarned = trainer.completedSessions * trainer.sessionRate;
      trainer.outstandingCompensation = grossEarned - trainer.paidCompensation;
    }

    // 5. Write audit record
    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_COMPLETED',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `تکمیل قطعی جلسه ${session.memberName} با مربی ${session.trainerName}. مانده جدید عضو: ${member.remainingSessions} جلسه.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: session.trainerName
    });

    this.notify();

    return {
      success: true,
      idempotent: false,
      remainingSessions: member.remainingSessions,
      messageKey: 'session.completed',
      params: { remaining: member.remainingSessions },
      message: `جلسه با موفقیت تکمیل شد. ۱ جلسه از بسته کسر گردید. مانده فعلی: ${member.remainingSessions} جلسه.`,
    };
  }

  // ==========================================
  // FLEXIBLE DAILY REASSIGNMENT (Section 17 & 39)
  // ==========================================
  reassignDailyTrainer(sessionId: string, newTrainerId: string): StoreResult {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return storeResult(false, 'session.notFound');

    const newTrainer = this.trainers.find(t => t.id === newTrainerId);
    if (!newTrainer) return storeResult(false, 'session.memberOrTrainerNotFound');

    // B-04: فقط نوبت پیش‌رو قابل انتقال است و مربی جدید باید ظرفیت و ساعت آزاد داشته باشد
    if (session.status !== 'scheduled' && session.status !== 'in_progress') {
      return storeResult(false, 'session.notReassignable');
    }
    if (session.trainerId === newTrainer.id) {
      return storeResult(true, 'session.reassigned', { trainer: newTrainer.name });
    }
    const check = this.checkBooking(
      {
        date: session.date,
        time: session.time,
        memberId: session.memberId,
        trainerId: newTrainer.id,
        excludeSessionId: session.id,
      },
      { trainerName: newTrainer.name, memberName: session.memberName },
      { allowPastDate: true }
    );
    if (!check.ok) return storeResult(false, check.messageKey!, check.params);

    const oldTrainerName = session.trainerName;
    session.trainerId = newTrainer.id;
    session.trainerName = newTrainer.name;
    session.isDailyOverride = true; // Daily override flag: Member's default trainer is NOT touched!

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'DAILY_TRAINER_REASSIGNMENT',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `جابجایی روزانه نوبت ${session.memberName}: از ${oldTrainerName} به ${newTrainer.name} (فقط برای امروز). مربی دائم عضو تغییری نکرد.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });

    this.notify();
    return storeResult(true, 'session.reassigned', { trainer: newTrainer.name });
  }

  // Attendance check in (Scheduled -> In Progress)
  checkInSession(sessionId: string) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (session && session.status === 'scheduled') {
      session.status = 'in_progress';
      this.notify();
    }
  }

  /**
   * لغو نوبت توسط مربی یا مدیر باشگاه (Does NOT deduct session!).
   * مهلت ۴ ساعته فقط برای درخواست خود ورزشکار است؛ کادر باشگاه می‌تواند در هر زمان لغو کند.
   */
  cancelSession(sessionId: string, reason: string = 'درخواست لغو توسط کاربر'): StoreResult {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return storeResult(false, 'session.notFound');
    if (session.status === 'completed') return storeResult(false, 'session.completedNotChangeable');
    if (session.status === 'cancelled') return storeResult(false, 'session.alreadyCancelled');

    session.status = 'cancelled';
    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_CANCELLED',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `لغو نوبت ${session.memberName} (${reason}). هیچ جلسه‌ای از اعتبار عضو کسر نشد.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
    this.notify();
    return storeResult(true, 'session.cancelledByStaff');
  }

  /**
   * جابه‌جایی ساعت یک نوبت توسط خود ورزشکار.
   *
   * قوانین:
   *  - نوبت تکمیل‌شده یا لغوشده قابل جابه‌جایی نیست.
   *  - نوبت باید امروز باشد (نوبت‌های آینده توسط مدیر باشگاه جابه‌جا می‌شوند).
   *  - حداقل ۴ ساعت فاصله با شروع سانس لازم است؛ در غیر این صورت لغو به مربی ارجاع می‌شود.
   *  - هیچ جلسه‌ای از اعتبار عضو کسر نمی‌شود.
   */
  rescheduleSession(
    sessionId: string,
    newTime: string,
    reason: string = 'درخواست تغییر ساعت توسط ورزشکار',
    now: Date = new Date()
  ): StoreResult {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) {
      return {
        success: false,
        messageKey: 'session.notFound',
        message: 'نوبت موردنظر یافت نشد.',
      };
    }
    if (session.status === 'completed') {
      return {
        success: false,
        messageKey: 'session.completedNotChangeable',
        message: 'این جلسه تکمیل شده و قابل تغییر نیست.',
      };
    }
    if (session.status === 'cancelled') {
      return {
        success: false,
        messageKey: 'session.alreadyCancelled',
        message: 'این نوبت لغو شده است.',
      };
    }
    // B-05: مقایسه با تاریخ واقعی امروز، نه مقدار ثابت «Today»
    if (!this.isTodayDate(session.date)) {
      const today = getTodayJalaliString();
      return compareJalaliDates(session.date, today, today) < 0
        ? storeResult(false, 'session.pastNotChangeable')
        : storeResult(false, 'session.futureReschedule');
    }

    // بررسی مهلت ۴ ساعته
    if (isWithinCutoff(session.time, now, RESCHEDULE_CUTOFF_HOURS)) {
      return {
        success: false,
        messageKey: 'session.tooSoon',
        message: 'کمتر از ۴ ساعت تا شروع سانس باقی مانده است. لطفاً مستقیماً با مربی تماس بگیرید.',
      };
    }

    // B-04: ساعت جدید — تداخل مربی/عضو و ظرفیت هم‌زمان باشگاه، فقط در همان تاریخ
    const check = this.checkBooking(
      {
        date: session.date,
        time: newTime,
        memberId: session.memberId,
        trainerId: session.trainerId,
        excludeSessionId: session.id,
      },
      { trainerName: session.trainerName, memberName: session.memberName }
    );
    if (!check.ok) return storeResult(false, check.messageKey!, check.params);

    const oldTime = session.time;
    session.time = newTime;

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_RESCHEDULED',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `جابه‌جایی ساعت نوبت ${session.memberName} از ${oldTime} به ${newTime} (${reason}). هیچ جلسه‌ای از اعتبار عضو کسر نشد.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: session.memberName,
    });

    this.notify();
    return {
      success: true,
      messageKey: 'session.rescheduled',
      params: { oldTime, newTime },
      message: `ساعت نوبت شما از ${oldTime} به ${newTime} تغییر کرد.`,
    };
  }

  /**
   * لغو نوبت توسط خود ورزشکار.
   * هیچ جلسه‌ای از اعتبار کسر نمی‌شود، اما مهلت ۴ ساعته رعایت می‌شود.
   */
  cancelSessionByMember(
    sessionId: string,
    reason: string = 'درخواست لغو توسط ورزشکار',
    now: Date = new Date()
  ): StoreResult {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) {
      return {
        success: false,
        messageKey: 'session.notFound',
        message: 'نوبت موردنظر یافت نشد.',
      };
    }
    if (session.status === 'completed') {
      return {
        success: false,
        messageKey: 'session.completedNotChangeable',
        message: 'این جلسه تکمیل شده و قابل لغو نیست.',
      };
    }
    if (session.status === 'cancelled') {
      return {
        success: false,
        messageKey: 'session.alreadyCancelled',
        message: 'این نوبت قبلاً لغو شده است.',
      };
    }
    if (!this.isTodayDate(session.date)) {
      const today = getTodayJalaliString();
      return compareJalaliDates(session.date, today, today) < 0
        ? storeResult(false, 'session.pastNotChangeable')
        : storeResult(false, 'session.futureCancel');
    }

    if (isWithinCutoff(session.time, now, RESCHEDULE_CUTOFF_HOURS)) {
      return {
        success: false,
        messageKey: 'session.tooSoon',
        message: 'کمتر از ۴ ساعت تا شروع سانس باقی مانده است. لطفاً مستقیماً با مربی تماس بگیرید.',
      };
    }

    session.status = 'cancelled';

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_CANCELLED',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `لغو نوبت ${session.memberName} توسط خود ورزشکار (${reason}). هیچ جلسه‌ای از اعتبار عضو کسر نشد.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: session.memberName,
    });

    this.notify();
    return {
      success: true,
      messageKey: 'session.cancelled',
      message: 'نوبت شما لغو شد. اعتبار جلسه کسر نشد.',
    };
  }

  /**
   * افزودن ورزشکار به برنامه امروز (سانس فوری).
   * ظرفیت روزانه مربی و تکراری نبودن نوبت بررسی می‌شود.
   */
  addSessionToToday(
    memberId: string,
    trainerId: string,
    time: string = '11:00'
  ): StoreResult & { session?: DailySession } {
    const member = this.members.find(m => m.id === memberId);
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!member || !trainer) {
      return {
        success: false,
        messageKey: 'session.memberOrTrainerNotFound',
        message: 'ورزشکار یا مربی یافت نشد.',
      };
    }

    // B-04: همان validator مسیر تقویم — ظرفیت مربی و باشگاه، تداخل زمانی، نوبت تکراری
    const today = getTodayJalaliString();
    const check = this.checkBooking(
      { date: today, time, memberId, trainerId },
      { trainerName: trainer.name, memberName: member.name }
    );
    if (!check.ok) return storeResult(false, check.messageKey!, check.params);

    const newSession: DailySession = {
      id: nextId('sess'),
      date: today,
      time,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      trainerId: trainer.id,
      trainerName: trainer.name,
      status: 'scheduled',
      exercises: []
    };

    this.todaySessions.push(newSession);
    this.notify();
    return {
      success: true,
      messageKey: 'session.slotAdded',
      params: { time, member: member.name },
      message: `سانس ساعت ${time} برای ${member.name} ثبت شد.`,
      session: newSession,
    };
  }

  // Add exercise to session
  addExerciseToSession(sessionId: string, exerciseData: Omit<SessionExercise, 'id'>) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    const newEx: SessionExercise = {
      ...exerciseData,
      id: nextId('rec')
    };
    session.exercises.push(newEx);
    this.notify();
  }

  // Update exercise in session
  updateExerciseInSession(sessionId: string, recordId: string, patch: Partial<SessionExercise>) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return;
    const ex = session.exercises.find(e => e.id === recordId);
    if (ex) {
      Object.assign(ex, patch);
      this.notify();
    }
  }

  // Remove exercise from session
  removeExerciseFromSession(sessionId: string, recordId: string) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return;
    session.exercises = session.exercises.filter(e => e.id !== recordId);
    this.notify();
  }

  /**
   * افزودن ورزشکار. با رمز، حساب ورود هم ساخته می‌شود (نام کاربری = موبایل).
   * `byTrainerId`: ورزشکار ساختهٔ مربی — به همان مربی وصل می‌شود، بسته و قیمت ندارد
   * و تا تعیین بسته توسط مدیر (`assignMemberPackage`) رزرو ندارد.
   */
  addMember(
    data: Omit<Member, 'id' | 'usedSessions' | 'remainingSessions' | 'outstandingBalance' | 'registrationDate'>,
    initialPassword?: string,
    options: { byTrainerId?: string } = {}
  ): StoreResult & { member?: Member } {
    const phone = normalizePhone(data.phone);
    const invalid = this.checkNewAccount(data.name, phone, initialPassword || undefined);
    if (invalid) return invalid;

    const byTrainer = options.byTrainerId
      ? this.trainers.find(t => t.id === options.byTrainerId)
      : undefined;
    const base = byTrainer
      ? {
          ...data,
          defaultTrainerId: byTrainer.id,
          defaultTrainerName: byTrainer.name,
          packageName: '',
          totalSessions: 0,
          packagePrice: 0,
          paidAmount: 0,
          expirationDate: '',
          packagePending: true,
          createdByTrainerId: byTrainer.id,
        }
      : data;

    const newMember: Member = {
      ...base,
      phone,
      name: base.name.trim(),
      id: nextId('m'),
      usedSessions: 0,
      remainingSessions: base.totalSessions,
      outstandingBalance: Math.max(0, base.packagePrice - base.paidAmount),
      registrationDate: getTodayJalaliString()
    };
    this.members.unshift(newMember);

    // Record payment if initial paid amount > 0
    if (base.paidAmount > 0) {
      this.memberPayments.unshift({
        id: nextId('pay'),
        memberId: newMember.id,
        memberName: newMember.name,
        amount: base.paidAmount,
        date: getTodayJalaliString(),
        method: 'card',
        description: 'پیش‌پرداخت اولیه هنگام ثبت نام',
        recordedBy: this.currentUser?.displayName || 'مدیر باشگاه'
      });
    }

    if (initialPassword && initialPassword.trim()) {
      this.createUserAccount({
        username: phone,
        password: initialPassword.trim(),
        role: 'member',
        entityId: newMember.id,
        displayName: newMember.name,
        phone
      });
    }

    this.audit(
      'MEMBER_CREATED',
      'Member',
      newMember.id,
      byTrainer
        ? `ورزشکار ${newMember.name} توسط مربی ${byTrainer.name} ثبت شد و منتظر تعیین بسته است.`
        : `ورزشکار ${newMember.name} ثبت شد.`
    );
    this.notify();
    return {
      ...storeResult(true, byTrainer ? 'member.createdPending' : 'member.created', { member: newMember.name }),
      member: newMember,
    };
  }

  /** مدیر: تعیین بسته برای ورزشکاری که مربی ساخته (یا تمدید با بستهٔ تازه) */
  assignMemberPackage(
    memberId: string,
    pkg: { packageName: string; totalSessions: number; packagePrice: number; paidAmount: number; startDate: string; expirationDate: string }
  ): StoreResult {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return storeResult(false, 'member.notFound');
    if (!pkg.packageName.trim() || !Number.isFinite(pkg.totalSessions) || pkg.totalSessions < 1) {
      return storeResult(false, 'member.invalidPackage');
    }
    if (pkg.packagePrice < 0 || pkg.paidAmount < 0) return storeResult(false, 'payment.invalidAmount');

    member.packageName = pkg.packageName.trim();
    member.totalSessions = Math.round(pkg.totalSessions);
    member.usedSessions = 0;
    member.remainingSessions = member.totalSessions;
    member.packagePrice = pkg.packagePrice;
    member.paidAmount = pkg.paidAmount;
    member.outstandingBalance = Math.max(0, pkg.packagePrice - pkg.paidAmount);
    member.startDate = pkg.startDate;
    member.expirationDate = pkg.expirationDate;
    member.status = 'active';
    member.packagePending = false;

    if (pkg.paidAmount > 0) {
      this.memberPayments.unshift({
        id: nextId('pay'),
        memberId: member.id,
        memberName: member.name,
        amount: pkg.paidAmount,
        date: getTodayJalaliString(),
        method: 'card',
        description: `پرداخت بستهٔ ${member.packageName}`,
        recordedBy: this.currentUser?.displayName || 'مدیر باشگاه'
      });
    }
    this.audit('PACKAGE_ASSIGNED', 'Member', member.id, `بستهٔ ${member.packageName} برای ${member.name} ثبت شد.`);
    this.notify();
    return storeResult(true, 'member.packageAssigned', { member: member.name });
  }

  /**
   * تغییر مربی دائم یک ورزشکار (B-13).
   * نوبت‌های قبلی دست نمی‌خورند؛ فقط مربی پیش‌فرض نوبت‌های بعدی عوض می‌شود.
   */
  changeMemberDefaultTrainer(memberId: string, trainerId: string): StoreResult {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return storeResult(false, 'member.notFound');
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!trainer) return storeResult(false, 'session.memberOrTrainerNotFound');
    if (member.defaultTrainerId === trainer.id) {
      return storeResult(true, 'member.trainerChanged', { trainer: trainer.name });
    }

    const oldTrainerName = member.defaultTrainerName;
    member.defaultTrainerId = trainer.id;
    member.defaultTrainerName = trainer.name;

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'DEFAULT_TRAINER_CHANGED',
      entityType: 'Member',
      entityId: member.id,
      details: `تغییر مربی دائم ${member.name}: از ${oldTrainerName} به ${trainer.name}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });

    this.notify();
    return storeResult(true, 'member.trainerChanged', { trainer: trainer.name });
  }

  /**
   * ذخیرهٔ تنظیمات عملیاتی باشگاه (B-13).
   * ظرفیت روزانه و هم‌زمان مستقیماً در validator رزرو مصرف می‌شوند.
   */
  updateGymSettings(
    patch: Partial<Pick<Gym, 'capacity' | 'hourlyCapacity' | 'noShowDeductsSession' | 'name'>>
  ): StoreResult {
    const isValidCap = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 1;
    if (patch.capacity !== undefined && !isValidCap(patch.capacity)) {
      return storeResult(false, 'gym.invalidCapacity');
    }
    if (patch.hourlyCapacity !== undefined && !isValidCap(patch.hourlyCapacity)) {
      return storeResult(false, 'gym.invalidCapacity');
    }

    const changes = Object.entries(patch)
      .filter(([key, value]) => value !== undefined && (this.gym as any)[key] !== value)
      .map(([key, value]) => `${key}: ${String((this.gym as any)[key])} → ${String(value)}`);

    this.gym = { ...this.gym, ...patch };
    if (changes.length > 0) {
      this.auditLogs.unshift({
        id: nextId('aud'),
        action: 'GYM_SETTINGS_UPDATED',
        entityType: 'Gym',
        entityId: this.gym.id,
        details: `به‌روزرسانی تنظیمات باشگاه — ${changes.join('، ')}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: this.currentUser?.displayName || 'مدیر باشگاه'
      });
    }
    this.notify();
    return storeResult(true, 'gym.settingsSaved');
  }

  // Record Member Payment (with validation)
  recordMemberPayment(memberId: string, amount: number, method: 'card' | 'cash' | 'transfer', description: string) {
    if (amount <= 0) {
      throw new Error('مبلغ پرداختی باید بیشتر از صفر باشد.');
    }

    const member = this.members.find(m => m.id === memberId);
    if (!member) return;

    member.paidAmount += amount;
    member.outstandingBalance = Math.max(0, member.packagePrice - member.paidAmount);

    this.memberPayments.unshift({
      id: nextId('pay'),
      memberId: member.id,
      memberName: member.name,
      amount,
      date: getTodayJalaliString(),
      method,
      description,
      recordedBy: 'مدیر باشگاه'
    });

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'PAYMENT_RECORDED',
      entityType: 'Member',
      entityId: member.id,
      details: `ثبت دریافت ${amount.toLocaleString()} تومان از ${member.name}. مانده بدهی جدید: ${member.outstandingBalance.toLocaleString()} تومان.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'مدیر باشگاه'
    });

    this.notify();
  }

  // Adjust Member Session Balance (Section 67 with clamping)
  adjustMemberSessions(memberId: string, delta: number, reason: string) {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return;

    if (member.totalSessions + delta < member.usedSessions) {
      throw new Error('مجموع جلسات نمی‌تواند کمتر از تعداد جلسات استفاده‌شده باشد.');
    }

    member.totalSessions += delta;
    member.remainingSessions = Math.max(0, member.totalSessions - member.usedSessions);

    this.sessionAdjustments.unshift({
      id: nextId('adj'),
      memberId: member.id,
      memberName: member.name,
      delta,
      reason,
      date: getTodayJalaliString(),
      performedBy: 'مدیر باشگاه'
    });

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'SESSION_BALANCE_ADJUSTED',
      entityType: 'Member',
      entityId: member.id,
      details: `اصلاح دستی اعتبار ${member.name}: ${delta > 0 ? `+${delta}` : delta} جلسه. دلیل: ${reason}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'مدیر باشگاه'
    });

    this.notify();
  }

  /** مدیر: افزودن مربی. با رمز، حساب ورود هم ساخته می‌شود (نام کاربری = موبایل). */
  addTrainer(
    data: Omit<Trainer, 'id' | 'completedSessions' | 'paidCompensation' | 'outstandingCompensation'>,
    initialPassword?: string
  ): StoreResult & { trainer?: Trainer } {
    const phone = normalizePhone(data.phone);
    const invalid = this.checkNewAccount(data.name, phone, initialPassword || undefined);
    if (invalid) return invalid;

    const newTrainer: Trainer = {
      ...data,
      phone,
      name: data.name.trim(),
      id: nextId('t'),
      completedSessions: 0,
      paidCompensation: 0,
      outstandingCompensation: 0
    };
    this.trainers.push(newTrainer);

    if (initialPassword && initialPassword.trim()) {
      this.createUserAccount({
        username: phone,
        password: initialPassword.trim(),
        role: 'trainer',
        entityId: newTrainer.id,
        displayName: newTrainer.name,
        phone
      });
    }

    this.audit('TRAINER_CREATED', 'Trainer', newTrainer.id, `مربی ${newTrainer.name} ثبت شد.`);
    this.notify();
    return { ...storeResult(true, 'trainer.created', { trainer: newTrainer.name }), trainer: newTrainer };
  }

  // Record Trainer Payout (Section 13 & 32)
  recordTrainerPayout(trainerId: string, amount: number, method: 'card' | 'transfer' | 'cash', description: string) {
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!trainer) return;

    trainer.paidCompensation += amount;
    trainer.outstandingCompensation = (trainer.completedSessions * trainer.sessionRate) - trainer.paidCompensation;

    this.trainerPayouts.unshift({
      id: nextId('tp'),
      trainerId: trainer.id,
      trainerName: trainer.name,
      amount,
      date: new Date().toLocaleDateString('fa-IR'),
      method,
      description
    });

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'TRAINER_PAYOUT',
      entityType: 'Trainer',
      entityId: trainer.id,
      details: `واریز ${amount.toLocaleString()} تومان دستمزد به حساب ${trainer.name}. مانده طلب: ${trainer.outstandingCompensation.toLocaleString()} تومان.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'مدیر باشگاه'
    });

    this.notify();
  }

  // ==========================================
  // EXERCISE CATALOG MANAGEMENT (Owner & Trainers)
  // ==========================================
  addCustomExercise(data: Omit<ExerciseItem, 'id'>): ExerciseItem {
    const newExercise: ExerciseItem = {
      ...data,
      id: nextId('ex-custom'),
      isCustom: true
    };
    this.exercises.unshift(newExercise);
    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'ADD_EXERCISE',
      entityType: 'Exercise',
      entityId: newExercise.id,
      details: `افزودن حرکت جدید "${newExercise.nameFa} (${newExercise.name})" به بانک حرکات باشگاه`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
    this.notify();

    return newExercise;
  }

  deleteCustomExercise(id: string): boolean {
    const index = this.exercises.findIndex(e => e.id === id);
    if (index === -1) return false;
    const removed = this.exercises.splice(index, 1)[0];
    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'DELETE_EXERCISE',
      entityType: 'Exercise',
      entityId: id,
      details: `حذف حرکت "${removed.nameFa}" از بانک حرکات`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
    this.notify();


    return true;
  }

  updateExercise(id: string, updates: Partial<Omit<ExerciseItem, 'id'>>): ExerciseItem | null {
    const exercise = this.exercises.find(e => e.id === id);
    if (!exercise) return null;

    Object.assign(exercise, updates);

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'UPDATE_EXERCISE',
      entityType: 'Exercise',
      entityId: id,
      details: `ویرایش اطلاعات حرکت "${exercise.nameFa} (${exercise.name})" در بانک حرکات`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر / مربی'
    });

    this.notify();


    return exercise;
  }

  // ==========================================
  // WORKOUT PROGRAM PUBLISHER (Trainer → Member)
  // ==========================================

  /** آخرین برنامه منتشرشده یک ورزشکار (اگر وجود داشته باشد) */
  getPublishedProgramForMember(memberId: string): WorkoutProgram | undefined {
    return this.programs
      .filter(p => p.memberId === memberId && p.status === 'published')
      .sort((a, b) => (a.publishedAt || '').localeCompare(b.publishedAt || ''))
      .pop();
  }

  /** همه برنامه‌های یک مربی */
  getProgramsByTrainer(trainerId: string): WorkoutProgram[] {
    return this.programs.filter(p => p.trainerId === trainerId);
  }

  /** برنامه‌های مربی برای یک ورزشکار مشخص */
  getProgramsForMemberByTrainer(memberId: string, trainerId: string): WorkoutProgram[] {
    return this.programs.filter(p => p.memberId === memberId && p.trainerId === trainerId);
  }

  /** ایجاد یا ویرایش برنامه (پیش‌نویس) */
  saveProgram(
    data: Omit<WorkoutProgram, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'publishedAt'> & {
      id?: string;
      status?: 'draft' | 'published';
    }
  ): WorkoutProgram {
    const now = getTodayJalaliString();
    const existing = data.id ? this.programs.find(p => p.id === data.id) : undefined;

    if (existing) {
      Object.assign(existing, {
        memberId: data.memberId,
        memberName: data.memberName,
        trainerId: data.trainerId,
        trainerName: data.trainerName,
        title: data.title,
        description: data.description,
        days: data.days,
        updatedAt: now,
      });
      this.notify();
      return existing;
    }

    const newProgram: WorkoutProgram = {
      id: nextId('prog'),
      memberId: data.memberId,
      memberName: data.memberName,
      trainerId: data.trainerId,
      trainerName: data.trainerName,
      title: data.title,
      description: data.description,
      days: data.days,
      status: data.status || 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === 'published' ? now : undefined,
    };

    this.programs.unshift(newProgram);
    this.notify();
    return newProgram;
  }

  /**
   * انتشار برنامه برای ورزشکار.
   * هر برنامه منتشرشده قبلی برای همان ورزشکار به حالت پیش‌نویس بازمی‌گردد،
   * تا ورزشکار همیشه فقط یک برنامه فعال داشته باشد.
   */
  publishProgram(programId: string): StoreResult {
    const program = this.programs.find(p => p.id === programId);
    if (!program) {
      return {
        success: false,
        messageKey: 'program.notFound',
        message: 'برنامه یافت نشد.',
      };
    }

    if (program.days.length === 0) {
      return {
        success: false,
        messageKey: 'program.noDays',
        message: 'برنامه بدون روز و حرکت قابل انتشار نیست.',
      };
    }

    const hasEmptyDay = program.days.some(d => d.items.length === 0);
    if (hasEmptyDay) {
      return {
        success: false,
        messageKey: 'program.emptyDay',
        message: 'همه روزهای برنامه باید حداقل یک حرکت داشته باشند.',
      };
    }

    for (const other of this.programs) {
      if (other.id !== program.id && other.memberId === program.memberId && other.status === 'published') {
        other.status = 'draft';
      }
    }

    const now = getTodayJalaliString();
    program.status = 'published';
    program.publishedAt = now;
    program.updatedAt = now;

    this.auditLogs.unshift({
      id: nextId('aud'),
      action: 'PROGRAM_PUBLISHED',
      entityType: 'WorkoutProgram',
      entityId: program.id,
      details: `انتشار برنامه تمرینی «${program.title}» برای ${program.memberName} توسط ${program.trainerName} (${program.days.length} روز).`,
      timestamp: now,
      user: program.trainerName,
    });

    this.notify();
    return {
      success: true,
      messageKey: 'program.published',
      params: { title: program.title, member: program.memberName },
      message: `برنامه «${program.title}» برای ${program.memberName} منتشر شد.`,
    };
  }

  /** بازگرداندن یک برنامه منتشرشده به وضعیت پیش‌نویس */
  unpublishProgram(programId: string): StoreResult {
    const program = this.programs.find(p => p.id === programId);
    if (!program) {
      return {
        success: false,
        messageKey: 'program.notFound',
        message: 'برنامه یافت نشد.',
      };
    }
    program.status = 'draft';
    program.publishedAt = undefined;
    program.updatedAt = getTodayJalaliString();
    this.notify();
    return {
      success: true,
      messageKey: 'program.unpublished',
      message: 'برنامه به وضعیت پیش‌نویس بازگشت.',
    };
  }

  /** حذف برنامه */
  deleteProgram(programId: string): boolean {
    const index = this.programs.findIndex(p => p.id === programId);
    if (index === -1) return false;
    this.programs.splice(index, 1);
    this.notify();
    return true;
  }

  // ==========================================
  // SERVER DATA — دادهٔ باشگاه از سرور (src/server)؛ مرورگر فقط آن را نمایش می‌دهد
  // ==========================================

  /** کاربر واردشده باید پیش از ادامه رمز را عوض کند (اولین ورود یا رمز تعیین‌شده توسط مدیر) */
  mustChangePassword = false;

  /** جایگزینی دادهٔ باشگاه با دادهٔ سرور (فیلترشده برای نقش کاربر) */
  applySnapshot(s: GymSnapshot) {
    const overrides = new Map(s.exerciseOverrides.map(e => [e.id, e]));
    Object.assign(this, emptyGymData(s.gym), {
      gym: s.gym,
      gyms: [s.gym],
      trainers: s.trainers,
      members: s.members,
      todaySessions: s.todaySessions,
      pastSessions: s.pastSessions,
      memberPayments: s.memberPayments,
      trainerPayouts: s.trainerPayouts,
      sessionAdjustments: s.sessionAdjustments,
      auditLogs: s.auditLogs,
      dailyCapacityConfigs: s.dailyCapacityConfigs,
      programs: s.programs,
      exercises: [
        ...EXERCISE_CATALOG.map(e => overrides.get(e.id) ?? e),
        ...s.exerciseOverrides.filter(e => !EXERCISE_CATALOG.some(c => c.id === e.id)),
      ],
    });
    // حساب‌های باشگاه (فقط مدیر می‌بیند)؛ حساب واردشده همیشه در فهرست می‌ماند
    const me = this.currentUser;
    this.users = [...(me ? [me] : []), ...s.users.filter(u => u.id !== me?.id)];
    this.notify();
  }
}

/** نمونهٔ مرورگر: کش خواندنی داده‌ای که از سرور (src/server) می‌آید؛ در تست‌ها موتور محلی */
export const gymStore = new GymStore();


// Backwards compatibility alias for components
export const mockStore = gymStore;
