/**
 * src/lib/phone.ts
 * نرمال‌سازی شمارهٔ موبایل ایران — شناسهٔ ورود همهٔ کاربران.
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** ارقام فارسی و عربی → لاتین */
export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, d => {
    const fa = FA_DIGITS.indexOf(d);
    return String(fa >= 0 ? fa : AR_DIGITS.indexOf(d));
  });
}

/**
 * «۰۹۱۲ ۱۱۱ ۲۲۳۳»، «+98 912-111-2233» و «00989121112233» → «09121112233».
 * ورودی‌ای که شبیه موبایل نیست بدون تغییر (فقط با ارقام لاتین و بدون فاصله) برمی‌گردد.
 */
export function normalizePhone(raw: string): string {
  const compact = toLatinDigits(raw).replace(/[\s\-().]/g, '');
  if (/^\+98\d{10}$/.test(compact)) return `0${compact.slice(3)}`;
  if (/^0098\d{10}$/.test(compact)) return `0${compact.slice(4)}`;
  if (/^98\d{10}$/.test(compact)) return `0${compact.slice(2)}`;
  if (/^9\d{9}$/.test(compact)) return `0${compact}`;
  return compact;
}

export function isValidMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

/** شناسهٔ ورود: موبایل نرمال‌شده، یا نام کاربری با حروف کوچک */
export function normalizeLoginId(raw: string): string {
  const phone = normalizePhone(raw);
  return isValidMobile(phone) ? phone : toLatinDigits(raw).trim().toLowerCase();
}
