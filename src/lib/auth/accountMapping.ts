/**
 * src/lib/auth/accountMapping.ts
 * B-01: منطق خالص احراز هویت — بدون فراخوانی شبکه، تا قابل تست باشد.
 */

import type { UserAccount } from '../domain/gymManagement';

export type AuthMode = 'demo' | 'supabase';

/** نقش‌های جدول profiles در schema چندمستأجری (enum app_role) */
export type ProfileRole = 'super_admin' | 'gym_owner' | 'trainer' | 'member';

export interface ProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  role: ProfileRole;
  tenant_id: string | null;
  is_active: boolean;
  username: string | null;
  app_entity_id: string | null;
}

/** باید با CHECK profiles_username_format و Edge Function manage-account یکی باشد */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,62}$/;
export const MIN_PASSWORD_LENGTH = 8;
export const DEFAULT_AUTH_EMAIL_DOMAIN = 'accounts.homegym.app';

/**
 * حالت احراز هویت.
 * وقتی Supabase پیکربندی شده، ورود فقط از Supabase Auth است. ورود دمو با رمز
 * محلی فقط در build توسعه و با VITE_AUTH_MODE=demo قابل انتخاب است؛ build تولیدی
 * این تنظیم را نادیده می‌گیرد.
 */
export function resolveAuthMode(opts: {
  hasSupabase: boolean;
  requested?: string;
  isDev?: boolean;
}): AuthMode {
  if (!opts.hasSupabase) return 'demo';
  if (opts.isDev && opts.requested === 'demo') return 'demo';
  return 'supabase';
}

/** نام کاربری → ایمیل Auth. ورودی‌ای که خودش ایمیل است دست نمی‌خورد. */
export function toAuthEmail(identifier: string, domain: string = DEFAULT_AUTH_EMAIL_DOMAIN): string {
  const id = identifier.trim().toLowerCase();
  return id.includes('@') ? id : `${id}@${domain}`;
}

export type ProfileMappingError = 'login.noProfile' | 'login.inactive';

/**
 * پروفایل Supabase → حساب کاربری برنامه.
 * entityId برای مربی و عضو شناسهٔ رکوردشان در app_records است (app_entity_id)
 * و برای مدیر، شناسهٔ باشگاه. مدیر کل باشگاه ندارد (gymId خالی).
 */
export function profileToUserAccount(
  profile: ProfileRow | null,
  gymId: string
): { ok: true; user: UserAccount } | { ok: false; messageKey: ProfileMappingError } {
  if (!profile) return { ok: false, messageKey: 'login.noProfile' };
  if (!profile.is_active) return { ok: false, messageKey: 'login.inactive' };

  let role: UserAccount['role'];
  let entityId: string | null;
  switch (profile.role) {
    case 'super_admin':
      role = 'super_admin';
      entityId = '';
      break;
    case 'gym_owner':
      role = 'owner';
      entityId = gymId;
      break;
    case 'trainer':
    case 'member':
      role = profile.role;
      entityId = profile.app_entity_id;
      break;
    default:
      return { ok: false, messageKey: 'login.noProfile' };
  }
  if (role !== 'super_admin' && (!entityId || !profile.tenant_id || !gymId)) {
    return { ok: false, messageKey: 'login.noProfile' };
  }

  return {
    ok: true,
    user: {
      id: profile.id,
      username: profile.username ?? profile.phone ?? '',
      // رمز هرگز در مرورگر نگه داشته نمی‌شود
      password: '',
      role,
      entityId: entityId ?? '',
      gymId: role === 'super_admin' ? undefined : gymId,
      displayName: profile.full_name,
      phone: profile.phone ?? undefined,
    },
  };
}
