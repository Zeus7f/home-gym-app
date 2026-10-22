/**
 * کلیدهای پیام‌های کاربری که از لایهٔ استور برمی‌گردند.
 *
 * استور یک ماژول دامنهٔ خالص است و نباید متن فارسی/انگلیسی را بسازد؛
 * بنابراین فقط کلید و پارامترها برمی‌گرداند و لایهٔ API آن را ترجمه می‌کند.
 */
export type StoreMessageKey =
  // ورود
  | 'login.success'
  | 'auth.forbidden'
  | 'auth.unauthenticated'
  | 'auth.passwordChangeRequired'
  | 'auth.wrongCurrentPassword'
  | 'auth.samePassword'
  | 'login.tooManyAttempts'
  | 'server.unavailable'
  | 'common.saved'
  | 'common.invalidInput'
  | 'common.notFound'
  | 'login.userNotFound'
  | 'login.badPassword'
  | 'login.badCredentials'
  | 'login.noProfile'
  | 'login.inactive'
  | 'login.authUnavailable'
  // حساب‌های ورود (B-01)
  | 'account.created'
  | 'account.usernameTaken'
  | 'account.invalidUsername'
  | 'account.weakPassword'
  | 'account.failed'
  | 'session.packagePending'
  | 'login.gymInactive'
  | 'gym.created'
  | 'gym.invalidName'
  | 'gym.activated'
  | 'gym.deactivated'
  | 'account.invalidPhone'
  | 'account.phoneTaken'
  | 'account.activated'
  | 'account.deactivated'
  | 'account.passwordChanged'
  | 'account.invalidName'
  | 'member.created'
  | 'member.createdPending'
  | 'member.packageAssigned'
  | 'member.invalidPackage'
  | 'trainer.created'
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
  | 'session.pastDate'
  | 'session.pastNotChangeable'
  | 'session.gymCapacityFull'
  | 'session.gymHourlyFull'
  | 'session.notCompletable'
  | 'session.noCredit'
  | 'session.packageExpired'
  | 'session.notReassignable'
  | 'session.reassigned'
  | 'session.cancelledByStaff'
  // اعضا
  | 'member.notFound'
  | 'member.trainerChanged'
  | 'member.paymentRecorded'
  | 'member.sessionsAdjusted'
  | 'member.invalidDelta'
  // تنظیمات باشگاه
  | 'gym.settingsSaved'
  | 'gym.invalidCapacity'
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
