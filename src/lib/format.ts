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

/** محل نمایش فعال. */
export function getFormatLocale(): FormatLocale {
  return activeLocale;
}

function localeTag(locale: FormatLocale = activeLocale): string {
  return locale === 'fa' ? 'fa-IR' : 'en-US';
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
 * @deprecated نام قدیمی `fa` به معنی «فارسی» بود؛ اکنون نمایش با زبان فعال هماهنگ است.
 * از {@link num} استفاده کنید.
 */
export const fa = num;

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

/**
 * Format a number as abbreviated Toman (for compact displays).
 *
 * @example
 * shortToman(4800000)   // "۴.۸ م تومان" in fa, "4.8M Toman" in en
 */
export function shortToman(n: number): string {
  return short(n) + (activeLocale === 'fa' ? ' تومان' : ' Toman');
}

// ---------------------------------------------------------------
// Generic locale-aware formatters (kept for existing components)
// ---------------------------------------------------------------

type Language = 'fa' | 'en';

/**
 * Format numeric value with locale support.
 * @deprecated Prefer fa() for Persian-only projects.
 */
export function formatNumber(val: number, lang: Language = 'fa'): string {
  if (!isFinite(val)) return lang === 'fa' ? '۰' : '0';
  return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(val);
}

/**
 * Format currency amount with currency symbol or unit.
 * @deprecated Prefer toman() or shortToman() for this project.
 */
export function formatCurrency(
  amount: number,
  currency = 'تومان',
  lang: Language = 'fa',
): string {
  if (!isFinite(amount)) return (lang === 'fa' ? '۰' : '0') + ' ' + currency;
  const formatted = formatNumber(Math.abs(amount), lang);
  const sign = amount < 0 ? '-' : '';
  const currLabel =
    lang === 'fa' ? currency : currency === 'تومان' ? 'Tomans' : currency;
  return `${sign}${formatted} ${currLabel}`;
}

/**
 * Format Jalali or Gregorian date string safely.
 */
export function formatDate(dateStr: string, lang: Language = 'fa'): string {
  if (!dateStr) return '';
  if (dateStr === 'Today') return lang === 'fa' ? 'امروز' : 'Today';
  return dateStr;
}
