/**
 * src/lib/auth/supabaseAuth.ts
 * B-01: ورود، بازیابی نشست و ساخت حساب از طریق Supabase Auth.
 * نقش و باشگاه کاربر از جدول profiles (با RLS) خوانده می‌شود، نه از مرورگر.
 */

import { supabase } from '../supabase/client';
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
  | 'login.authUnavailable';

export type AuthOutcome =
  | { ok: true; user: UserAccount }
  | { ok: false; messageKey: AuthMessageKey };

const PROFILE_COLUMNS = 'id, full_name, phone, role, tenant_id, is_active, username, app_entity_id';

async function loadUser(userId: string, gymId: string): Promise<AuthOutcome> {
  if (!supabase) return { ok: false, messageKey: 'login.authUnavailable' };
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) return { ok: false, messageKey: 'login.authUnavailable' };
  return profileToUserAccount(data as ProfileRow | null, gymId);
}

/** ورود با نام کاربری (یا ایمیل) و رمز */
export async function signIn(identifier: string, password: string, gymId: string): Promise<AuthOutcome> {
  if (!supabase) return { ok: false, messageKey: 'login.authUnavailable' };
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(identifier, authEmailDomain),
    password,
  });
  if (error || !data.user) {
    // Supabase عمداً بین «کاربر نیست» و «رمز اشتباه» فرق نمی‌گذارد
    const unreachable = !error?.status || error.status >= 500;
    return { ok: false, messageKey: unreachable ? 'login.authUnavailable' : 'login.badCredentials' };
  }

  const outcome = await loadUser(data.user.id, gymId);
  // حساب بدون پروفایل معتبر نباید نشست باز داشته باشد
  if (!outcome.ok) await supabase.auth.signOut();
  return outcome;
}

/** بازیابی نشست ذخیره‌شدهٔ Supabase هنگام بارگذاری صفحه */
export async function restoreSession(gymId: string): Promise<UserAccount | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  const outcome = await loadUser(userId, gymId);
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
  | 'account.failed';

/** ساخت حساب مربی/عضو با Edge Function manage-account (فقط مدیر باشگاه) */
export async function provisionAccount(input: {
  username: string;
  password: string;
  fullName: string;
  role: 'trainer' | 'member';
  appEntityId: string;
  phone?: string;
}): Promise<{ ok: true } | { ok: false; messageKey: ProvisionErrorKey }> {
  if (!supabase) return { ok: false, messageKey: 'account.failed' };
  const { error } = await supabase.functions.invoke('manage-account', {
    body: { action: 'create', ...input },
  });
  if (!error) return { ok: true };

  let code = '';
  try {
    code = (await (error as any).context?.json?.())?.error ?? '';
  } catch {}
  const map: Record<string, ProvisionErrorKey> = {
    username_taken: 'account.usernameTaken',
    invalid_username: 'account.invalidUsername',
    weak_password: 'account.weakPassword',
  };
  return { ok: false, messageKey: map[code] ?? 'account.failed' };
}
