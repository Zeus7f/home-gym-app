// Pure Domain Logic: Booking validation & session state transitions
//
// B-04: ظرفیت، تداخل زمانی و لغو در مسیرهای مختلف (تقویم، افزودن سریع، جابه‌جایی مربی،
//       تغییر ساعت) جداگانه و ناقص بررسی می‌شد. این ماژول تنها validator مشترک است.
// B-05: تاریخ جلسه همیشه به شکل canonical «YYYY/MM/DD» مقایسه می‌شود؛ «Today» فقط
//       مقدار قدیمی (legacy) است که هنگام مقایسه به تاریخ امروز تبدیل می‌شود.
// B-06: انتقال وضعیت جلسه و اعتبار عضو پیش از هر mutation بررسی می‌شود.

import type { DailySession, Member } from './gymManagement';
import type { StoreMessageKey, StoreMessageParams } from './storeMessages';

/** مقدار قدیمی تاریخ امروز در داده‌های ذخیره‌شده */
export const LEGACY_TODAY = 'Today';

/** تبدیل تاریخ ذخیره‌شده به شکل canonical. */
export function canonicalDate(date: string, today: string): string {
  return date === LEGACY_TODAY ? today : date;
}

export function isSameDate(a: string, b: string, today: string): boolean {
  return canonicalDate(a, today) === canonicalDate(b, today);
}

/** مقایسهٔ دو تاریخ جلالی «YYYY/MM/DD» — منفی یعنی a قبل از b است. */
export function compareJalaliDates(a: string, b: string, today: string): number {
  const key = (d: string) => Number(canonicalDate(d, today).replace(/\//g, '')) || 0;
  return key(a) - key(b);
}

/**
 * آیا جلسه با این وضعیت، ظرفیت و بازهٔ زمانی را اشغال می‌کند؟
 * جلسهٔ لغوشده جا را آزاد می‌کند؛ تکمیل‌شده و غیبت جای خود را مصرف کرده‌اند.
 */
export function occupiesSlot(status: DailySession['status']): boolean {
  return status !== 'cancelled';
}

export interface BookingRequest {
  date: string;
  time: string;
  memberId: string;
  trainerId: string;
  /** هنگام جابه‌جایی، خود جلسه نباید با خودش تداخل داشته باشد */
  excludeSessionId?: string;
}

export interface BookingLimits {
  /** تاریخ امروز به شکل canonical */
  today: string;
  /** ظرفیت روزانهٔ کل باشگاه برای آن تاریخ */
  gymDailyCapacity: number;
  /** ظرفیت روزانهٔ مربی برای آن تاریخ */
  trainerDailyCapacity: number;
  /** حداکثر جلسهٔ هم‌زمان در کل باشگاه (اختیاری) */
  gymHourlyCapacity?: number;
  /** نام‌ها برای پیام خطا */
  trainerName: string;
  memberName: string;
  /** اجازهٔ ثبت برای تاریخ گذشته (پیش‌فرض: خیر) */
  allowPastDate?: boolean;
}

/**
 * نتیجهٔ بررسی. (یک interface ساده به‌جای union، چون tsconfig پروژه strict نیست
 * و narrowing روی `ok` بدون strictNullChecks کار نمی‌کند.)
 */
export interface BookingCheck {
  ok: boolean;
  /** فقط وقتی ok=false است */
  messageKey?: StoreMessageKey;
  params?: StoreMessageParams;
}

/**
 * validator واحد برای همهٔ مسیرهای ایجاد/جابه‌جایی نوبت.
 * ترتیب بررسی: تاریخ گذشته → نوبت تکراری عضو → تداخل زمانی مربی →
 * ظرفیت روزانهٔ مربی → ظرفیت هم‌زمان باشگاه → ظرفیت روزانهٔ باشگاه.
 */
export function validateBooking(
  sessions: readonly DailySession[],
  req: BookingRequest,
  limits: BookingLimits
): BookingCheck {
  const { today } = limits;
  const date = canonicalDate(req.date, today);

  if (!limits.allowPastDate && compareJalaliDates(date, today, today) < 0) {
    return { ok: false, messageKey: 'session.pastDate', params: { date } };
  }

  const active = sessions.filter(
    s => s.id !== req.excludeSessionId && occupiesSlot(s.status) && isSameDate(s.date, date, today)
  );

  const memberClash = active.find(s => s.memberId === req.memberId && s.time === req.time);
  if (memberClash) {
    return {
      ok: false,
      messageKey: 'session.duplicateSlot',
      params: { member: limits.memberName, time: req.time },
    };
  }

  const trainerClash = active.find(s => s.trainerId === req.trainerId && s.time === req.time);
  if (trainerClash) {
    return {
      ok: false,
      messageKey: 'session.timeTaken',
      params: { time: req.time, trainer: limits.trainerName, member: trainerClash.memberName },
    };
  }

  const trainerCount = active.filter(s => s.trainerId === req.trainerId).length;
  if (trainerCount >= limits.trainerDailyCapacity) {
    return {
      ok: false,
      messageKey: 'session.capacityFull',
      params: { trainer: limits.trainerName, date, capacity: limits.trainerDailyCapacity },
    };
  }

  if (limits.gymHourlyCapacity && limits.gymHourlyCapacity > 0) {
    const sameHour = active.filter(s => s.time === req.time).length;
    if (sameHour >= limits.gymHourlyCapacity) {
      return {
        ok: false,
        messageKey: 'session.gymHourlyFull',
        params: { time: req.time, capacity: limits.gymHourlyCapacity },
      };
    }
  }

  if (active.length >= limits.gymDailyCapacity) {
    return {
      ok: false,
      messageKey: 'session.gymCapacityFull',
      params: { date, capacity: limits.gymDailyCapacity },
    };
  }

  return { ok: true };
}

/**
 * آیا این جلسه قابل تکمیل و کسر اعتبار است؟ (B-06)
 * - فقط جلسهٔ scheduled یا in_progress قابل تکمیل است.
 * - عضو باید اعتبار باقیمانده داشته باشد.
 * - بستهٔ منقضی‌شده قابل مصرف نیست.
 */
export function checkCompletable(
  session: Pick<DailySession, 'status'>,
  member: Pick<Member, 'remainingSessions' | 'expirationDate'>,
  today: string
): BookingCheck {
  if (session.status !== 'scheduled' && session.status !== 'in_progress') {
    return { ok: false, messageKey: 'session.notCompletable', params: { status: session.status } };
  }
  if (member.remainingSessions <= 0) {
    return { ok: false, messageKey: 'session.noCredit' };
  }
  if (member.expirationDate && compareJalaliDates(member.expirationDate, today, today) < 0) {
    return { ok: false, messageKey: 'session.packageExpired', params: { date: member.expirationDate } };
  }
  return { ok: true };
}
