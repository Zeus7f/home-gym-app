/**
 * src/lib/auth/accountRules.ts
 * قواعد مشترک حساب‌ها — هم مرورگر و هم سرور از همین مقادیر استفاده می‌کنند.
 */

export const MIN_PASSWORD_LENGTH = 8;

/** نام کاربری غیرموبایل (مثلاً حساب مدیر کل): حروف کوچک لاتین، رقم، نقطه، خط تیره، زیرخط */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,62}$/;
