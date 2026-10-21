/**
 * src/lib/auth/permissions.ts
 * ماتریس واحد دسترسی نقش‌ها.
 *
 * رابط کاربری با `can()` دکمه‌ها و مسیرها را نشان می‌دهد یا پنهان می‌کند.
 * سمت سرور، همین قواعد در RLS (migrationها) و Edge Function `manage-account`
 * اجرا می‌شوند؛ این فایل جایگزین آن‌ها نیست و فقط باید با آن‌ها هم‌خوان بماند.
 */

export type AppRole = 'super_admin' | 'owner' | 'trainer' | 'member';

export type Action =
  /** ساخت، غیرفعال‌کردن و ورود به باشگاه‌ها؛ ساخت مدیر باشگاه */
  | 'gym.manage'
  /** ساخت مربی؛ تغییر رمز و غیرفعال‌کردن مربی و ورزشکار */
  | 'staff.manage'
  /** ساخت ورزشکار (مربی: فقط پروفایل، وصل به خودش) */
  | 'member.create'
  /** تعیین بسته، قیمت، پرداخت و اصلاح جلسات ورزشکار */
  | 'member.package'
  | 'finance.view'
  | 'reports.view'
  | 'settings.manage'
  /** برنامهٔ روز و نوبت‌های همهٔ مربیان */
  | 'schedule.all'
  /** برنامهٔ روز، ثبت جلسه و برنامهٔ تمرینی ورزشکاران خود */
  | 'schedule.own'
  /** دیدن جلسات، برنامه و سوابق خود */
  | 'self.view'
  /** پیش‌نمایش فضای کاری نقش‌های پایین‌تر */
  | 'role.preview';

const MATRIX: Record<AppRole, ReadonlySet<Action>> = {
  super_admin: new Set<Action>(['gym.manage', 'role.preview']),
  owner: new Set<Action>([
    'staff.manage',
    'member.create',
    'member.package',
    'finance.view',
    'reports.view',
    'settings.manage',
    'schedule.all',
    'schedule.own',
    'role.preview',
  ]),
  trainer: new Set<Action>(['member.create', 'schedule.own']),
  member: new Set<Action>(['self.view']),
};

export function can(role: AppRole | null | undefined, action: Action): boolean {
  return !!role && MATRIX[role].has(action);
}

/** مسیر پیش‌فرض فضای کاری هر نقش */
export const HOME_PATH: Record<AppRole, string> = {
  super_admin: '/admin',
  owner: '/owner',
  trainer: '/trainer',
  member: '/member',
};

/** نقش‌هایی که هر نقش می‌تواند حساب‌شان را بسازد */
export function creatableRoles(role: AppRole | null | undefined): AppRole[] {
  switch (role) {
    case 'super_admin':
      return ['owner'];
    case 'owner':
      return ['trainer', 'member'];
    case 'trainer':
      return ['member'];
    default:
      return [];
  }
}
