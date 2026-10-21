import { toLatinDigits } from '../../lib/phone';

export { getTodayJalaliString, gregorianToJalali, formatJalali } from '../../lib/date/jalali';

/** «۱۴۰۵/۰۹/۳۰» → «1405/09/30» (ورودی تاریخ با هر نوع رقم) */
export function toLatinDigitsDate(raw: string): string {
  return toLatinDigits(raw).trim().replace(/[-.]/g, '/');
}
