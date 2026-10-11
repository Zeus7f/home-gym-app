/**
 * src/lib/format.ts
 * Number and currency formatting utilities.
 * G3/G7 fix: all number display goes through these helpers — no raw .toLocaleString in components.
 */

// ---------------------------------------------------------------
// Core Persian number formatter
// ---------------------------------------------------------------

/**
 * Format a number using Persian (Farsi) digits.
 * Handles NaN, Infinity, negative numbers, and zero safely.
 *
 * @example
 * fa(1403)    // "۱٬۴۰۳"
 * fa(-5)      // "‎-۵"
 * fa(0)       // "۰"
 */
export function fa(n: number | string): string {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (!isFinite(num)) return '۰';
  return new Intl.NumberFormat('fa-IR').format(num);
}

/**
 * Format a large number in abbreviated Persian form.
 *   ≥ 1,000,000 → "X.X م"  (میلیون)
 *   ≥ 1,000     → "X هزار"
 *   < 1,000     → full fa() number
 *
 * @example
 * short(1500000)  // "۱.۵ م"
 * short(4200000)  // "۴.۲ م"
 * short(350000)   // "۳۵۰ هزار"
 * short(-200000)  // "-۲۰۰ هزار"
 * short(0)        // "۰"
 */
export function short(n: number): string {
  if (!isFinite(n)) return '۰';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    // Round to one decimal million
    const millions = Math.round(abs / 100_000) / 10;
    return sign + fa(millions) + ' م';
  }
  if (abs >= 1_000) {
    return sign + fa(Math.round(abs / 1_000)) + ' هزار';
  }
  return fa(n);
}

/**
 * Format a number as a Toman currency string.
 *
 * @example
 * toman(4800000)   // "۴٬۸۰۰٬۰۰۰ تومان"
 * toman(-1200000)  // "‎-۱٬۲۰۰٬۰۰۰ تومان"
 * toman(0)         // "۰ تومان"
 */
export function toman(n: number): string {
  return fa(n) + ' تومان';
}

/**
 * Format a number as abbreviated Toman (for compact displays).
 *
 * @example
 * shortToman(4800000)  // "۴.۸ م تومان"
 * shortToman(350000)   // "۳۵۰ هزار تومان"
 */
export function shortToman(n: number): string {
  return short(n) + ' تومان';
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
