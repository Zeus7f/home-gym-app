/**
 * src/lib/routes.ts
 * ساختار استاندارد آدرس‌ها — هر بخش اصلی یک مسیر معنادار، نه `?tab=`.
 * پارامترهای `?` فقط برای فیلتر (مثلاً ?status=pending) استفاده می‌شوند.
 */

import type { AppRole } from './auth/permissions';

export const AUTH_PATHS = {
  login: '/auth/login',
  changePassword: '/auth/change-password',
} as const;

/** بخش‌های هر فضای کاری (بخش دوم مسیر) */
export const SECTIONS = {
  super_admin: ['gyms', 'accounts', 'system'],
  owner: ['dashboard', 'schedule', 'memberships', 'trainers', 'finance', 'analytics', 'settings'],
  trainer: ['today', 'calendar', 'athletes', 'programs', 'exercises', 'history'],
  member: ['overview', 'sessions', 'workouts', 'progress'],
} as const;

export type Section<R extends AppRole> = (typeof SECTIONS)[R][number];

/** ریشهٔ فضای کاری هر نقش */
export const BASE_PATH: Record<AppRole, string> = {
  super_admin: '/admin',
  owner: '/owner',
  trainer: '/trainer',
  member: '/member',
};

export const sectionPath = (role: AppRole, section: string) => `${BASE_PATH[role]}/${section}`;

/** صفحهٔ پیش‌فرض هر نقش */
export const HOME_SECTION: Record<AppRole, string> = {
  super_admin: 'gyms',
  owner: 'dashboard',
  trainer: 'today',
  member: 'overview',
};

export const homePath = (role: AppRole) => sectionPath(role, HOME_SECTION[role]);

/** کلیدهای قدیمی `?tab=` (نشانک‌ها و اعلان‌های ذخیره‌شده) → بخش استاندارد */
const LEGACY_TABS: Record<AppRole, Record<string, string>> = {
  super_admin: { gyms: 'gyms', accounts: 'accounts' },
  owner: {
    dash: 'dashboard', dashboard: 'dashboard', sched: 'schedule', schedule: 'schedule',
    mem: 'memberships', members: 'memberships', tr: 'trainers', trn: 'trainers', trainers: 'trainers',
    fin: 'finance', finance: 'finance', rep: 'analytics', reports: 'analytics', set: 'settings', settings: 'settings',
  },
  trainer: {
    today: 'today', mem: 'athletes', ath: 'athletes', members: 'athletes', hist: 'history', history: 'history',
    cat: 'exercises', catalog: 'exercises', exercises: 'exercises', prog: 'programs', programs: 'programs',
    cal: 'calendar', calendar: 'calendar',
  },
  member: {
    home: 'overview', ses: 'sessions', sess: 'sessions', sessions: 'sessions', ex: 'workouts', exercises: 'workouts',
    hist: 'progress', history: 'progress',
  },
};

/**
 * مقصد آزاد (کلید قدیمی، نام کامل یا بخش استاندارد) → بخش معتبر همان نقش.
 * مقصد ناشناخته به صفحهٔ پیش‌فرض نقش می‌رود (B-08).
 */
export function resolveSection(role: AppRole, raw: string | null | undefined): string {
  const valid = SECTIONS[role] as readonly string[];
  if (raw && valid.includes(raw)) return raw;
  return (raw && LEGACY_TABS[role][raw]) || HOME_SECTION[role];
}
