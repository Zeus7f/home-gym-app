/**
 * کلیدهای پیام‌های کاربری که از لایهٔ استور برمی‌گردند.
 *
 * استور یک ماژول دامنهٔ خالص است و نباید متن فارسی/انگلیسی را بسازد؛
 * بنابراین فقط کلید و پارامترها برمی‌گرداند و لایهٔ API آن را ترجمه می‌کند.
 */
export type StoreMessageKey =
  // ورود
  | 'login.success'
  | 'login.userNotFound'
  | 'login.badPassword'
  // جلسات
  | 'session.notFound'
  | 'session.memberOrTrainerNotFound'
  | 'session.capacityFull'
  | 'session.scheduled'
  | 'session.alreadyCompleted'
  | 'session.completed'
  | 'session.alreadyCancelled'
  | 'session.completedNotChangeable'
  | 'session.futureReschedule'
  | 'session.futureCancel'
  | 'session.tooSoon'
  | 'session.timeTaken'
  | 'session.rescheduled'
  | 'session.cancelled'
  | 'session.duplicateSlot'
  | 'session.slotAdded'
  // برنامه‌ها
  | 'program.notFound'
  | 'program.noDays'
  | 'program.emptyDay'
  | 'program.published'
  | 'program.unpublished'
  // مالی
  | 'payment.invalidAmount'
  | 'session.adjustTooLow';

/** پارامترهای اختیاری هر پیام */
export type StoreMessageParams = Record<string, string | number>;

export interface StoreResult {
  success: boolean;
  /** کلید پیام برای ترجمه در لایهٔ API */
  messageKey: StoreMessageKey;
  /** پارامترهای درون‌متنی پیام */
  params?: StoreMessageParams;
  /** پیام فارسی پیش‌فرض — برای لایه‌هایی که هنوز از آن استفاده می‌کنند */
  message: string;
}
