/**
 * src/lib/store/demoData.ts
 * دادهٔ نمونهٔ باشگاه دمو — مربیان، اعضا، جلسات، پرداخت‌ها و حساب‌های آزمایشی.
 *
 * این داده فقط در دو جا لازم است: seed دیتابیس و تست‌های دامنه. مرورگر آن را
 * نمی‌خواهد؛ داده‌اش از snapshot سرور می‌آید. برای همین از `gymStore` جدا شده
 * تا نه در باندل بنشیند و نه فایل استور را شلوغ کند.
 *
 * بارگذاری در استور با `gymStore.loadDemoData()` انجام می‌شود، نه خودکار.
 */

import type {
  AuditLog,
  DailyCapacityConfig,
  DailySession,
  Gym,
  Member,
  PaymentRecord,
  SessionAdjustmentRecord,
  Trainer,
  TrainerPaymentRecord,
  UserAccount,
  WorkoutProgram,
} from '../domain/gymManagement';
import { EXERCISE_CATALOG } from '../exercises/catalog';
import { getTodayJalali, getTodayJalaliString } from '../date/jalali';

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
const SUPER_ADMIN_DEMO: UserAccount = {
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
export function withDemoAccounts(users: UserAccount[]): UserAccount[] {
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
