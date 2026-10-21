/**
 * src/lib/displayName.ts
 * نمایش نام افراد متناسب با زبان فعال.
 *
 * داده‌های استور نام‌ها را به شکل «رضا کمالی (Reza)» نگه می‌دارند.
 * در حالت انگلیسی، بخش لاتین داخل پرانتز استخراج می‌شود تا رابط کاربری
 * یکدست بماند؛ اگر بخش لاتینی وجود نداشته باشد، همان نام اصلی نمایش داده می‌شود.
 */

const LATIN_IN_PARENS = /\(([^()]*)\)\s*$/;

/**
 * @param name نام کامل از داده‌های استور
 * @param isFa آیا زبان فعال فارسی است؟
 */
export function displayName(name: string, isFa: boolean): string {
  if (isFa || !name) return name;

  const match = name.match(LATIN_IN_PARENS);
  if (match && match[1].trim()) {
    const latin = match[1].trim();
    // فقط اگر واقعاً لاتین باشد (نه فارسی)
    if (!/[؀-ۿ]/.test(latin)) return latin;
  }
  return name;
}

/**
 * نام کوتاه برای آواتار — حرف اول نام نمایشی.
 */
export function initials(name: string, isFa: boolean): string {
  const shown = displayName(name, isFa);
  return shown.trim().charAt(0) || '?';
}
