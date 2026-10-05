// High-Fidelity Local State Store implementing Gym Management Operating Model
// PRD Refactor: Gym -> Owner -> Trainers -> Members -> Attendance -> Sessions -> Exercises -> Finance -> Reports

import {
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
  DailyCapacityConfig
} from '../domain/gymManagement';
import { EXERCISE_CATALOG, ExerciseItem } from '../exercises/catalog';
import { getTodayJalaliString, getTodayJalali } from '../date/jalali';
import { supabase, isLiveSupabase } from './client';

const curJ = getTodayJalali();
const CURRENT_JY = curJ.jy;
const CURRENT_JM = curJ.jm < 10 ? `0${curJ.jm}` : `${curJ.jm}`;
const PREV_JM = curJ.jm === 1 ? '12' : (curJ.jm - 1 < 10 ? `0${curJ.jm - 1}` : `${curJ.jm - 1}`);
const PREV_JY = curJ.jm === 1 ? CURRENT_JY - 1 : CURRENT_JY;

const INITIAL_GYM: Gym = {
  id: 'gym-1',
  name: 'Iron Haven Fitness Club',
  capacity: 30, // 30 members max daily capacity
  currency: 'تومان',
  noShowDeductsSession: false
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

const INITIAL_TODAY_SESSIONS: DailySession[] = [
  {
    id: 'sess-1',
    date: 'Today',
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
    date: 'Today',
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
    date: 'Today',
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
    date: 'Today',
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

const INITIAL_USERS: UserAccount[] = [
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

class GymStore {
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

  users: UserAccount[] = INITIAL_USERS;
  currentUser: UserAccount | null = INITIAL_USERS[0]; // Initially logged in as Admin for convenience

  dailyCapacityConfigs: Record<string, DailyCapacityConfig> = {};

  activeTrainerId = 't-ali';
  activeMemberId = 'm-reza';

  listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  // ==========================================
  // AUTHENTICATION & USER MANAGEMENT
  // ==========================================
  login(username: string, password: string): { success: boolean; message?: string } {
    const user = this.users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!user) {
      return { success: false, message: 'نام کاربری وارد شده یافت نشد.' };
    }
    if (user.password !== password.trim()) {
      return { success: false, message: 'کلمه عبور وارد شده نادرست است.' };
    }
    this.currentUser = user;
    this.notify();
    return { success: true };
  }

  logout() {
    this.currentUser = null;
    this.notify();
  }

  setCurrentUser(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.currentUser = user;
      this.notify();
    }
  }

  resetPassword(userId: string, newPassword: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;
    user.password = newPassword.trim();
    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      action: 'PASSWORD_RESET',
      entityType: 'UserAccount',
      entityId: userId,
      details: `کلمه عبور حساب کاربری ${user.displayName} (${user.username}) توسط مدیر باشگاه تغییر یافت.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
    this.notify();
    return true;
  }

  createUserAccount(data: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount {
    const newUser: UserAccount = {
      ...data,
      id: 'u-' + Date.now(),
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
    if (!this.dailyCapacityConfigs[date]) {
      this.dailyCapacityConfigs[date] = { date };
    }
    this.dailyCapacityConfigs[date].gymCapacity = capacity;
    this.notify();
  }

  getGymDailyCapacity(date: string): number {
    return this.dailyCapacityConfigs[date]?.gymCapacity ?? this.gym.capacity;
  }

  setTrainerDailyCapacity(date: string, trainerId: string, capacity: number) {
    if (!this.dailyCapacityConfigs[date]) {
      this.dailyCapacityConfigs[date] = { date, trainerCapacities: {} };
    }
    if (!this.dailyCapacityConfigs[date].trainerCapacities) {
      this.dailyCapacityConfigs[date].trainerCapacities = {};
    }
    this.dailyCapacityConfigs[date].trainerCapacities![trainerId] = capacity;
    this.notify();
  }

  getTrainerDailyCapacity(date: string, trainerId: string): number {
    const override = this.dailyCapacityConfigs[date]?.trainerCapacities?.[trainerId];
    if (override !== undefined) return override;
    const trainer = this.trainers.find(t => t.id === trainerId);
    return trainer?.dailyCapacity ?? 6;
  }

  getSessionsForDate(date: string, trainerId?: string, memberId?: string): DailySession[] {
    const today = getTodayJalaliString();
    return this.todaySessions.filter(s => {
      const matchesDate = s.date === date || (date === today && s.date === 'Today');
      const matchesTrainer = !trainerId || s.trainerId === trainerId;
      const matchesMember = !memberId || s.memberId === memberId;
      return matchesDate && matchesTrainer && matchesMember;
    });
  }

  scheduleSessionOnDate(
    date: string,
    time: string,
    memberId: string,
    trainerId: string,
    exercises: SessionExercise[] = []
  ): { success: boolean; message: string; session?: DailySession } {
    const member = this.members.find(m => m.id === memberId);
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!member || !trainer) return { success: false, message: 'ورزشکار یا مربی یافت نشد.' };

    const capacity = this.getTrainerDailyCapacity(date, trainerId);
    const currentSessions = this.getSessionsForDate(date, trainerId);
    if (currentSessions.length >= capacity) {
      return {
        success: false,
        message: `ظرفیت مربی ${trainer.name} برای تاریخ ${date} تکمیل است (حداکثر ${capacity} نفر).`
      };
    }

    const newSess: DailySession = {
      id: 'sess-' + Date.now(),
      date,
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
    return { success: true, message: 'جلسه با موفقیت در تقویم ثبت شد.', session: newSess };
  }

  // ==========================================
  // ATOMIC SESSION COMPLETION (Section 65 & 66)
  // ==========================================
  completeMemberSession(sessionId: string): {
    idempotent: boolean;
    remainingSessions: number;
    message: string;
  } {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) throw new Error('SESSION_NOT_FOUND');

    // 1. Idempotency Check: Calling twice must not deduct twice
    if (session.status === 'completed') {
      const mem = this.members.find(m => m.id === session.memberId);
      return {
        idempotent: true,
        remainingSessions: mem?.remainingSessions || 0,
        message: 'این جلسه قبلاً با موفقیت تکمیل شده و جلسه‌ای مجدداً کسر نگردید.'
      };
    }

    const member = this.members.find(m => m.id === session.memberId);
    if (!member) throw new Error('MEMBER_NOT_FOUND');

    const trainer = this.trainers.find(t => t.id === session.trainerId);

    // 2. Mark session completed
    session.status = 'completed';
    session.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
      id: 'aud-' + Date.now(),
      action: 'SESSION_COMPLETED',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `تکمیل قطعی جلسه ${session.memberName} با مربی ${session.trainerName}. مانده جدید عضو: ${member.remainingSessions} جلسه.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: session.trainerName
    });

    this.notify();

    return {
      idempotent: false,
      remainingSessions: member.remainingSessions,
      message: `جلسه با موفقیت تکمیل شد. ۱ جلسه از بسته کسر گردید. مانده فعلی: ${member.remainingSessions} جلسه.`
    };
  }

  // ==========================================
  // FLEXIBLE DAILY REASSIGNMENT (Section 17 & 39)
  // ==========================================
  reassignDailyTrainer(sessionId: string, newTrainerId: string) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    const newTrainer = this.trainers.find(t => t.id === newTrainerId);
    if (!newTrainer) return;

    const oldTrainerName = session.trainerName;
    session.trainerId = newTrainer.id;
    session.trainerName = newTrainer.name;
    session.isDailyOverride = true; // Daily override flag: Member's default trainer is NOT touched!

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      action: 'DAILY_TRAINER_REASSIGNMENT',
      entityType: 'DailySession',
      entityId: sessionId,
      details: `جابجایی روزانه نوبت ${session.memberName}: از ${oldTrainerName} به ${newTrainer.name} (فقط برای امروز). مربی دائم عضو تغییری نکرد.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'مدیر باشگاه'
    });

    this.notify();
  }

  // Attendance check in (Scheduled -> In Progress)
  checkInSession(sessionId: string) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (session && session.status === 'scheduled') {
      session.status = 'in_progress';
      this.notify();
    }
  }

  // Cancel session (Does NOT deduct session!)
  cancelSession(sessionId: string, reason: string = 'درخواست لغو توسط کاربر') {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (session && session.status !== 'completed') {
      session.status = 'cancelled';
      this.auditLogs.unshift({
        id: 'aud-' + Date.now(),
        action: 'SESSION_CANCELLED',
        entityType: 'DailySession',
        entityId: sessionId,
        details: `لغو نوبت ${session.memberName} (${reason}). هیچ جلسه‌ای از اعتبار عضو کسر نشد.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: 'مدیر باشگاه'
      });
      this.notify();
    }
  }

  // Add Member to today's schedule
  addSessionToToday(memberId: string, trainerId: string, time: string = '11:00') {
    const member = this.members.find(m => m.id === memberId);
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!member || !trainer) return;

    const newSession: DailySession = {
      id: 'sess-' + Date.now(),
      date: 'Today',
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
  }

  // Add exercise to session
  addExerciseToSession(sessionId: string, exerciseData: Omit<SessionExercise, 'id'>) {
    const session = this.todaySessions.find(s => s.id === sessionId);
    if (!session) return;

    const newEx: SessionExercise = {
      ...exerciseData,
      id: 'rec-' + Date.now()
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

  // Add New Member
  addMember(data: Omit<Member, 'id' | 'usedSessions' | 'remainingSessions' | 'outstandingBalance' | 'registrationDate'>) {
    const newMember: Member = {
      ...data,
      id: 'm-' + Date.now(),
      usedSessions: 0,
      remainingSessions: data.totalSessions,
      outstandingBalance: Math.max(0, data.packagePrice - data.paidAmount),
      registrationDate: new Date().toLocaleDateString('fa-IR')
    };
    this.members.unshift(newMember);

    // Record payment if initial paid amount > 0
    if (data.paidAmount > 0) {
      this.memberPayments.unshift({
        id: 'pay-' + Date.now(),
        memberId: newMember.id,
        memberName: newMember.name,
        amount: data.paidAmount,
        date: new Date().toLocaleDateString('fa-IR'),
        method: 'card',
        description: 'پیش‌پرداخت اولیه هنگام ثبت نام',
        recordedBy: 'مدیر باشگاه'
      });
    }

    this.notify();
  }

  // Record Member Payment
  recordMemberPayment(memberId: string, amount: number, method: 'card' | 'cash' | 'transfer', description: string) {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return;

    member.paidAmount += amount;
    member.outstandingBalance = Math.max(0, member.packagePrice - member.paidAmount);

    this.memberPayments.unshift({
      id: 'pay-' + Date.now(),
      memberId: member.id,
      memberName: member.name,
      amount,
      date: new Date().toLocaleDateString('fa-IR'),
      method,
      description,
      recordedBy: 'مدیر باشگاه'
    });

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      action: 'PAYMENT_RECORDED',
      entityType: 'Member',
      entityId: member.id,
      details: `ثبت دریافت ${amount.toLocaleString()} تومان از ${member.name}. مانده بدهی جدید: ${member.outstandingBalance.toLocaleString()} تومان.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'مدیر باشگاه'
    });

    this.notify();
  }

  // Adjust Member Session Balance (Section 67)
  adjustMemberSessions(memberId: string, delta: number, reason: string) {
    const member = this.members.find(m => m.id === memberId);
    if (!member) return;

    member.totalSessions += delta;
    member.remainingSessions = Math.max(0, member.totalSessions - member.usedSessions);

    this.sessionAdjustments.unshift({
      id: 'adj-' + Date.now(),
      memberId: member.id,
      memberName: member.name,
      delta,
      reason,
      date: new Date().toLocaleDateString('fa-IR'),
      performedBy: 'مدیر باشگاه'
    });

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      action: 'SESSION_BALANCE_ADJUSTED',
      entityType: 'Member',
      entityId: member.id,
      details: `اصلاح دستی اعتبار ${member.name}: ${delta > 0 ? `+${delta}` : delta} جلسه. دلیل: ${reason}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'مدیر باشگاه'
    });

    this.notify();
  }

  // Add Trainer
  addTrainer(data: Omit<Trainer, 'id' | 'completedSessions' | 'paidCompensation' | 'outstandingCompensation'>) {
    const newTrainer: Trainer = {
      ...data,
      id: 't-' + Date.now(),
      completedSessions: 0,
      paidCompensation: 0,
      outstandingCompensation: 0
    };
    this.trainers.push(newTrainer);
    this.notify();
  }

  // Record Trainer Payout (Section 13 & 32)
  recordTrainerPayout(trainerId: string, amount: number, method: 'card' | 'transfer' | 'cash', description: string) {
    const trainer = this.trainers.find(t => t.id === trainerId);
    if (!trainer) return;

    trainer.paidCompensation += amount;
    trainer.outstandingCompensation = (trainer.completedSessions * trainer.sessionRate) - trainer.paidCompensation;

    this.trainerPayouts.unshift({
      id: 'tp-' + Date.now(),
      trainerId: trainer.id,
      trainerName: trainer.name,
      amount,
      date: new Date().toLocaleDateString('fa-IR'),
      method,
      description
    });

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
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
      id: 'ex-custom-' + Date.now(),
      isCustom: true
    };
    this.exercises.unshift(newExercise);
    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      action: 'ADD_EXERCISE',
      entityType: 'Exercise',
      entityId: newExercise.id,
      details: `افزودن حرکت جدید "${newExercise.nameFa} (${newExercise.name})" به بانک حرکات باشگاه`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
    this.notify();
    // Live Supabase sync for new exercises
    if (isLiveSupabase && supabase) {
      supabase.from('exercises').insert({
        id: newExercise.id,
        name: newExercise.name,
        name_fa: newExercise.nameFa,
        body_part: newExercise.bodyPart,
        body_part_fa: newExercise.bodyPartFa,
        equipment: newExercise.equipment,
        equipment_fa: newExercise.equipmentFa,
        pattern: newExercise.pattern,
        pattern_fa: newExercise.patternFa,
        position: newExercise.position,
        position_fa: newExercise.positionFa,
        gif_url: newExercise.gifUrl,
        instructions_en: newExercise.instructionsEn,
        instructions_fa: newExercise.instructionsFa,
        default_sets: newExercise.defaultSets,
        default_reps: newExercise.defaultReps,
        is_custom: true
      }).then(({ error }) => {
        if (error) console.warn('Supabase addCustomExercise warning:', error.message);
      });
    }

    return newExercise;
  }

  deleteCustomExercise(id: string): boolean {
    const index = this.exercises.findIndex(e => e.id === id);
    if (index === -1) return false;
    const removed = this.exercises.splice(index, 1)[0];
    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      action: 'DELETE_EXERCISE',
      entityType: 'Exercise',
      entityId: id,
      details: `حذف حرکت "${removed.nameFa}" از بانک حرکات`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر باشگاه'
    });
    this.notify();

    // Live Supabase delete
    if (isLiveSupabase && supabase) {
      supabase.from('exercises').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase deleteExercise warning:', error.message);
      });
    }

    return true;
  }

  updateExercise(id: string, updates: Partial<Omit<ExerciseItem, 'id'>>): ExerciseItem | null {
    const exercise = this.exercises.find(e => e.id === id);
    if (!exercise) return null;

    Object.assign(exercise, updates);

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      action: 'UPDATE_EXERCISE',
      entityType: 'Exercise',
      entityId: id,
      details: `ویرایش اطلاعات حرکت "${exercise.nameFa} (${exercise.name})" در بانک حرکات`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: this.currentUser?.displayName || 'مدیر / مربی'
    });

    this.notify();

    // Live Supabase update
    if (isLiveSupabase && supabase) {
      supabase.from('exercises').upsert({
        id: exercise.id,
        name: exercise.name,
        name_fa: exercise.nameFa,
        body_part: exercise.bodyPart,
        body_part_fa: exercise.bodyPartFa,
        equipment: exercise.equipment,
        equipment_fa: exercise.equipmentFa,
        pattern: exercise.pattern,
        pattern_fa: exercise.patternFa,
        position: exercise.position,
        position_fa: exercise.positionFa,
        gif_url: exercise.gifUrl,
        instructions_en: exercise.instructionsEn,
        instructions_fa: exercise.instructionsFa,
        default_sets: exercise.defaultSets,
        default_reps: exercise.defaultReps,
        is_custom: exercise.isCustom ?? false
      }).then(({ error }) => {
        if (error) console.warn('Supabase updateExercise warning:', error.message);
      });
    }

    return exercise;
  }

  // ==========================================
  // SUPABASE TWO-WAY CLOUD DATA SYNC
  // ==========================================
  isSupabaseConnected = false;

  async syncWithSupabase() {
    if (!isLiveSupabase || !supabase) return;
    try {
      // 1. Fetch exercises from Supabase
      const { data: exData, error: exErr } = await supabase.from('exercises').select('*');
      if (!exErr && exData && exData.length > 0) {
        this.exercises = exData.map(row => ({
          id: row.id,
          name: row.name,
          nameFa: row.name_fa || row.name,
          bodyPart: row.body_part,
          bodyPartFa: row.body_part_fa || row.body_part,
          equipment: row.equipment,
          equipmentFa: row.equipment_fa || row.equipment,
          pattern: row.pattern,
          patternFa: row.pattern_fa || row.pattern,
          position: row.position,
          positionFa: row.position_fa || row.position,
          gifUrl: row.gif_url,
          instructionsEn: row.instructions_en || '',
          instructionsFa: row.instructions_fa || '',
          defaultSets: row.default_sets || 3,
          defaultReps: row.default_reps || 10,
          isCustom: row.is_custom || false
        }));
      }

      // 2. Fetch gym settings
      const { data: gymData, error: gymErr } = await supabase.from('gyms').select('*').limit(1).maybeSingle();
      if (!gymErr && gymData) {
        this.gym = {
          id: gymData.id,
          name: gymData.name,
          capacity: gymData.capacity,
          currency: gymData.currency || 'تومان',
          noShowDeductsSession: gymData.no_show_deducts_session || false
        };
      }

      // 3. Fetch trainers
      const { data: trData, error: trErr } = await supabase.from('trainers').select('*');
      if (!trErr && trData && trData.length > 0) {
        trData.forEach(row => {
          const existing = this.trainers.find(t => t.id === row.id);
          if (existing) {
            existing.name = row.name;
            existing.phone = row.phone || existing.phone;
            existing.specialty = row.specialty || existing.specialty;
            existing.dailyCapacity = row.daily_capacity || existing.dailyCapacity;
            existing.sessionRate = Number(row.session_rate) || existing.sessionRate;
          }
        });
      }

      // 4. Fetch members
      const { data: memData, error: memErr } = await supabase.from('members').select('*');
      if (!memErr && memData && memData.length > 0) {
        memData.forEach(row => {
          const existing = this.members.find(m => m.id === row.id);
          if (existing) {
            existing.name = row.name;
            existing.phone = row.phone || existing.phone;
            existing.packageName = row.package_name || existing.packageName;
            existing.totalSessions = row.total_sessions ?? existing.totalSessions;
            existing.usedSessions = row.used_sessions ?? existing.usedSessions;
            existing.remainingSessions = Math.max(0, existing.totalSessions - existing.usedSessions);
          }
        });
      }

      this.isSupabaseConnected = true;
      this.notify();
    } catch (e) {
      console.warn('Supabase sync warning:', e);
    }
  }
}

export const gymStore = new GymStore();

// Trigger initial cloud sync when Supabase is configured
if (isLiveSupabase) {
  gymStore.syncWithSupabase();
}

// Backwards compatibility alias for components
export const mockStore = gymStore;
