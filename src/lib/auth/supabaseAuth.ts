/**
 * src/lib/auth/supabaseAuth.ts
 * B-01: ورود، بازیابی نشست و ساخت حساب از طریق Supabase Auth.
 * نقش و باشگاه کاربر از جدول profiles (با RLS) خوانده می‌شود، نه از مرورگر.
 */

import { supabase } from '../supabase/client';
import { normalizeLoginId } from '../phone';
import type { UserAccount } from '../domain/gymManagement';
import {
  DEFAULT_AUTH_EMAIL_DOMAIN,
  profileToUserAccount,
  toAuthEmail,
  type ProfileRow,
} from './accountMapping';

const env = (import.meta as any).env || {};
export const authEmailDomain: string = env.VITE_AUTH_EMAIL_DOMAIN || DEFAULT_AUTH_EMAIL_DOMAIN;

export type AuthMessageKey =
  | 'login.badCredentials'
  | 'login.noProfile'
  | 'login.inactive'
  | 'login.gymInactive'
  | 'login.authUnavailable';

export type AuthOutcome =
  | { ok: true; user: UserAccount }
  | { ok: false; messageKey: AuthMessageKey };

const PROFILE_COLUMNS = 'id, full_name, phone, role, tenant_id, is_active, username, app_entity_id';

async function loadUser(userId: string): Promise<AuthOutcome> {
  if (!supabase) return { ok: false, messageKey: 'login.authUnavailable' };
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) return { ok: false, messageKey: 'login.authUnavailable' };
  const profile = data as ProfileRow | null;

  // باشگاهِ tenant کاربر (مدیر کل باشگاه ندارد)
  let gymId = '';
  if (profile && profile.role !== 'super_admin' && profile.tenant_id) {
    const { data: gym } = await supabase
      .from('app_gyms')
      .select('id, is_active')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle();
    if (!gym) return { ok: false, messageKey: 'login.noProfile' };
    if (!(gym as { is_active: boolean }).is_active) return { ok: false, messageKey: 'login.gymInactive' };
    gymId = (gym as { id: string }).id;
  }
  return profileToUserAccount(profile, gymId);
}

/** ورود با نام کاربری (یا ایمیل) و رمز */
export async function signIn(identifier: string, password: string): Promise<AuthOutcome> {
  if (!supabase) return { ok: false, messageKey: 'login.authUnavailable' };
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(normalizeLoginId(identifier), authEmailDomain),
    password,
  });
  if (error || !data.user) {
    // Supabase عمداً بین «کاربر نیست» و «رمز اشتباه» فرق نمی‌گذارد
    const unreachable = !error?.status || error.status >= 500;
    return { ok: false, messageKey: unreachable ? 'login.authUnavailable' : 'login.badCredentials' };
  }

  const outcome = await loadUser(data.user.id);
  // حساب بدون پروفایل معتبر نباید نشست باز داشته باشد
  if (!outcome.ok) await supabase.auth.signOut();
  return outcome;
}

/** بازیابی نشست ذخیره‌شدهٔ Supabase هنگام بارگذاری صفحه */
export async function restoreSession(): Promise<UserAccount | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  const outcome = await loadUser(userId);
  if (!outcome.ok) {
    await supabase.auth.signOut();
    return null;
  }
  return outcome.user;
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

/** خروج از تب دیگر یا انقضای نشست */
export function onSignedOut(fn: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') fn();
  });
  return () => data.subscription.unsubscribe();
}

export type ProvisionErrorKey =
  | 'account.usernameTaken'
  | 'account.invalidUsername'
  | 'account.weakPassword'
  | 'account.invalidPhone'
  | 'account.failed';

const ERROR_KEYS: Record<string, ProvisionErrorKey> = {
  username_taken: 'account.usernameTaken',
  invalid_username: 'account.invalidUsername',
  invalid_phone: 'account.invalidPhone',
  weak_password: 'account.weakPassword',
};

/**
 * فراخوانی Edge Function `manage-account` (ساخت باشگاه، ساخت حساب، تغییر رمز، غیرفعال‌سازی).
 * مجوز را خود تابع از روی نقش فراخواننده بررسی می‌کند.
 */
export async function manageAccount(
  body: Record<string, unknown>
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; messageKey: ProvisionErrorKey }> {
  if (!supabase) return { ok: false, messageKey: 'account.failed' };
  const { data, error } = await supabase.functions.invoke('manage-account', { body });
  if (!error) return { ok: true, data: (data ?? {}) as Record<string, unknown> };

  let code = '';
  try {
    code = (await (error as any).context?.json?.())?.error ?? '';
  } catch {}
  return { ok: false, messageKey: ERROR_KEYS[code] ?? 'account.failed' };
}
