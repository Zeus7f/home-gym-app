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

/**
 * برچسب‌های دادهٔ نمونه که معادل لاتین داخل پرانتز ندارند (مثلاً نام بسته‌ها).
 * PROJECT_STATUS P1: «Localization of seed data».
 */
const SEED_LABELS_EN: Record<string, string> = {
  'بسته خصوصی ۱۲ جلسه‌ای': '12-session private package',
  'بسته VIP بیست جلسه‌ای': '20-session VIP package',
  'بسته پایه ۱۰ جلسه‌ای': '10-session basic package',
  'بسته سلامتی ۸ جلسه‌ای': '8-session wellness package',
};

/**
 * برچسب داده‌محور (نام بسته، تخصص مربی و …) به زبان فعال.
 *
 * برچسب‌های آماده به شکل «فارسی (English)» ذخیره می‌شوند: در رابط انگلیسی بخش
 * لاتین و در رابط فارسی بخش فارسی نشان داده می‌شود. پرانتزی که محتوای فارسی
 * دارد (مثل «بستهٔ ویژه (تابستان)») دست‌نخورده می‌ماند.
 */
export function localizedLabel(label: string, isFa: boolean): string {
  if (!label) return label;
  if (!isFa) return SEED_LABELS_EN[label.trim()] ?? displayName(label, isFa);

  const match = label.match(LATIN_IN_PARENS);
  if (match && match[1].trim() && !/[؀-ۿ]/.test(match[1])) {
    return label.replace(LATIN_IN_PARENS, '').trim();
  }
  return label;
}
