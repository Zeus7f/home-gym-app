/**
 * src/lib/format.ts
 * Number and currency formatting utilities.
 * G3/G7 fix: all number display goes through these helpers — no raw .toLocaleString in components.
 *
 * The active locale is set once by the LanguageProvider, so every call site
 * automatically renders Persian or Latin digits depending on the UI language.
 */

export type FormatLocale = 'fa' | 'en';

let activeLocale: FormatLocale = 'fa';

/** تنظیم محل نمایش اعداد — توسط LanguageProvider صدا زده می‌شود. */
export function setFormatLocale(locale: FormatLocale) {
  activeLocale = locale;
}

function localeTag(locale: FormatLocale = activeLocale): string {
  return locale === 'fa' ? 'fa-IR' : 'en-US';
}

// ---------------------------------------------------------------
// Digit scripts and money input parsing
// ---------------------------------------------------------------

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** ارقام فارسی، عربی و لاتین را به لاتین یکدست می‌کند. */
export function toLatinDigits(raw: string): string {
  return String(raw ?? '')
    .replace(/[۰-۹]/g, d => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)));
}

/**
 * متن ورودی کاربر را به عدد تبدیل می‌کند — جداکننده، فاصله و ارقام فارسی را می‌پذیرد.
 *
 * @example
 * parseAmount('۱۲٬۵۰۰٬۰۰۰')  // 12500000
 * parseAmount('4,800,000')       // 4800000
 */
export function parseAmount(raw: string | number): number {
  if (typeof raw === 'number') return isFinite(raw) ? raw : 0;
  const digits = toLatinDigits(raw).replace(/[^\d]/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

/**
 * مبلغ در حال تایپ را سه‌رقمی جدا می‌کند و ارقام را به همان خطی که کاربر تایپ کرده نگه می‌دارد.
 *
 * @example
 * groupAmount('1500000')   // "1,500,000"
 * groupAmount('۱۵۰۰۰۰۰')   // "۱٬۵۰۰٬۰۰۰"
 */
export function groupAmount(raw: string): string {
  const persian = /[۰-۹٠-٩]/.test(raw);
  const digits = toLatinDigits(raw).replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, persian ? '٬' : ',');
  return persian ? grouped.replace(/\d/g, d => FA_DIGITS[Number(d)]) : grouped;
}

// ---------------------------------------------------------------
// Core number formatter
// ---------------------------------------------------------------

/**
 * Format a number using the active locale (Persian or Latin digits).
 * Handles NaN, Infinity, negative numbers, and zero safely.
 *
 * @example
 * num(1403)    // "۱٬۴۰۳" in fa, "1,403" in en
 * num(-5)      // "‎-۵" in fa, "-5" in en
 */
export function num(n: number | string): string {
  const value = typeof n === 'string' ? parseFloat(n) : n;
  if (!isFinite(value)) return activeLocale === 'fa' ? '۰' : '0';
  return new Intl.NumberFormat(localeTag()).format(value);
}

/**
 * Format a large number in abbreviated form (localized).
 *   ≥ 1,000,000 → "X.X م" (fa) / "X.XM" (en)
 *   ≥ 1,000     → "X هزار" (fa) / "XK" (en)
 *   < 1,000     → full num() number
 */
export function short(n: number): string {
  if (!isFinite(n)) return activeLocale === 'fa' ? '۰' : '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const millions = Math.round(abs / 100_000) / 10;
    return activeLocale === 'fa'
      ? sign + num(millions) + ' م'
      : sign + num(millions) + 'M';
  }
  if (abs >= 1_000) {
    return activeLocale === 'fa'
      ? sign + num(Math.round(abs / 1_000)) + ' هزار'
      : sign + num(Math.round(abs / 1_000)) + 'K';
  }
  return num(n);
}

/**
 * Format a number as a Toman currency string.
 *
 * @example
 * toman(4800000)   // "۴٬۸۰۰٬۰۰۰ تومان" in fa, "4,800,000 Toman" in en
 */
export function toman(n: number): string {
  return activeLocale === 'fa' ? num(n) + ' تومان' : num(n) + ' Toman';
}

// ---------------------------------------------------------------
// Generic locale-aware formatters (kept for existing components)
// ---------------------------------------------------------------

type Language = 'fa' | 'en';

/**
 * Format Jalali or Gregorian date string safely.
 */
export function formatDate(dateStr: string, lang: Language = 'fa'): string {
  if (!dateStr) return '';
  if (dateStr === 'Today') return lang === 'fa' ? 'امروز' : 'Today';
  return dateStr;
}
