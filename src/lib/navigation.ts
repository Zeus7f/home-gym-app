/**
 * src/lib/navigation.ts
 * تبدیل امن مقصد ناوبری (از اعلان یا پارامتر URL) به کلید تب معتبر.
 *
 * B-08: اعلان‌ها و پارامتر `?tab=` رشتهٔ آزاد هستند. قبلاً این رشته مستقیماً
 * به نوع کلید تب cast می‌شد و مقصد نامعتبر صفحهٔ خالی (یا خطای runtime) می‌ساخت.
 */

/**
 * @param raw      مقصد خام (ممکن است undefined، نام کامل یا کلید کوتاه باشد)
 * @param valid    کلیدهای معتبر تب در این shell
 * @param fallback تب پیش‌فرض قابل‌مشاهده برای مقصد ناشناخته
 * @param aliases  نگاشت نام‌های جایگزین به کلید معتبر (مثلاً `members` → `mem`)
 */
export function resolveTab<K extends string>(
  raw: string | null | undefined,
  valid: readonly K[],
  fallback: K,
  aliases: Partial<Record<string, K>> = {}
): K {
  if (!raw) return fallback;
  if ((valid as readonly string[]).includes(raw)) return raw as K;
  const aliased = aliases[raw];
  return aliased && valid.includes(aliased) ? aliased : fallback;
}
