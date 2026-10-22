/**
 * src/lib/data/snapshot.ts
 * شکل دادهٔ باشگاه که سرور به مرورگر می‌فرستد (فیلترشده بر اساس نقش).
 */

import type {
  AuditLog,
  DailyCapacityConfig,
  DailySession,
  ExerciseItem,
  Gym,
  Member,
  PaymentRecord,
  SessionAdjustmentRecord,
  Trainer,
  TrainerPaymentRecord,
  UserAccount,
  WorkoutProgram,
} from '../store/gymStore';

export interface GymSnapshot {
  gym: Gym;
  trainers: Trainer[];
  members: Member[];
  todaySessions: DailySession[];
  pastSessions: DailySession[];
  memberPayments: PaymentRecord[];
  trainerPayouts: TrainerPaymentRecord[];
  sessionAdjustments: SessionAdjustmentRecord[];
  auditLogs: AuditLog[];
  /** فقط حرکات سفارشی/ویرایش‌شدهٔ باشگاه؛ کاتالوگ پایه در خود برنامه هست */
  exerciseOverrides: ExerciseItem[];
  dailyCapacityConfigs: Record<string, DailyCapacityConfig>;
  programs: WorkoutProgram[];
  /** حساب‌های باشگاه (فقط برای مدیر؛ بدون رمز) */
  users: UserAccount[];
}

/** پاسخ استاندارد عملیات تغییر داده */
export interface OpResponse<T = unknown> {
  success: boolean;
  messageKey: string;
  params?: Record<string, string | number>;
  data?: T;
  snapshot?: GymSnapshot;
}
